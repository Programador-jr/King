const assert = require("node:assert/strict");
const { afterEach, test } = require("node:test");
const { GuildSettings, MongoDBEnmap } = require("../databases/mongodb");

const originalFindById = GuildSettings.findById;
const originalFindByIdAndUpdate = GuildSettings.findByIdAndUpdate;
const originalError = console.error;

afterEach(() => {
  GuildSettings.findById = originalFindById;
  GuildSettings.findByIdAndUpdate = originalFindByIdAndUpdate;
  console.error = originalError;
});

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

test("guild settings writes persist in order and expose completion", async () => {
  const writes = [];
  const firstWrite = deferred();
  const secondWrite = deferred();
  GuildSettings.findByIdAndUpdate = async (_id, snapshot) => {
    writes.push(snapshot);
    if (writes.length === 1) await firstWrite.promise;
    if (writes.length === 2) await secondWrite.promise;
  };

  const settings = new MongoDBEnmap();
  settings.cache.set("guild-1", { _id: "guild-1" });
  const first = settings.set("guild-1", "first", "value");
  const second = settings.set("guild-1", "second", "value");
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(writes.length, 1, "the second database write waits for the first");
  assert.equal(writes[0].value, "first");
  firstWrite.resolve();
  await first;
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(settings.get("guild-1", "value"), "second", "an older save cannot replace the latest cache value");
  secondWrite.resolve();
  await second;

  assert.deepEqual(writes.map((snapshot) => snapshot.value), ["first", "second"]);
  assert.equal(settings.get("guild-1", "value"), "second");
});

test("initial database reads merge with mutations made while loading", async () => {
  const read = deferred();
  const persisted = [];
  GuildSettings.findById = () => ({ lean: () => ({ exec: () => read.promise }) });
  GuildSettings.findByIdAndUpdate = async (_id, snapshot) => { persisted.push(snapshot); };

  const settings = new MongoDBEnmap();
  settings.ensure("guild-1", { value: "default", newDefault: true });
  const write = settings.set("guild-1", "newer", "value");
  read.resolve({ _id: "guild-1", value: "database", existing: "preserved" });

  await Promise.all([write, settings.fetch("guild-1")]);
  await settings.flush("guild-1");

  assert.equal(settings.get("guild-1", "value"), "newer");
  assert.equal(settings.get("guild-1", "existing"), "preserved");
  assert.equal(settings.get("guild-1", "newDefault"), true);
  assert.equal(persisted.at(-1).value, "newer");
});

test("failed settings writes reject to callers and are logged", async () => {
  const error = new Error("database unavailable");
  const logged = [];
  GuildSettings.findByIdAndUpdate = async () => { throw error; };
  console.error = (...args) => logged.push(args);

  const settings = new MongoDBEnmap();
  settings.cache.set("guild-1", { _id: "guild-1" });
  await assert.rejects(settings.set("guild-1", "value", "setting"), error);

  assert.equal(logged.length, 1);
  assert.match(logged[0][0], /Falha ao salvar guild guild-1/);
});
