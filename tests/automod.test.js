const assert = require("node:assert/strict");
const { test } = require("node:test");
const AutoModHandler = require("../handlers/automod");
const { createSettingsStore } = require("./helpers/settingsStore");

function createHandler(config) {
  const settings = createSettingsStore();
  settings.set("guild-1", config);
  return new AutoModHandler({ settings });
}

function createMessage(content, { bot = false, roles = [] } = {}) {
  return {
    content,
    guild: { id: "guild-1" },
    author: { id: "user-1", bot },
    member: { roles: { cache: new Set(roles) } },
  };
}

test("automod uses safe defaults and normalizes configured lists", () => {
  const defaultHandler = createHandler({});
  const configuredHandler = createHandler({
    automodAntiWordsList: "spam, scam,  bad link ",
    automodBypassRoles: ["trusted-role"],
  });

  assert.equal(defaultHandler.getSettings("guild-1").enabled, false);
  assert.deepEqual(configuredHandler.getSettings("guild-1").antiWords.list, ["spam", "scam", "bad link"]);
  assert.equal(configuredHandler.hasBypassRole(createMessage("hello").member, ["trusted-role"]), false);
  assert.equal(configuredHandler.hasBypassRole(createMessage("hello", { roles: ["trusted-role"] }).member, ["trusted-role"]), true);
});

test("automod blocks configured links and words but honors disabled and bypass cases", async () => {
  const handler = createHandler({
    automodEnabled: true,
    automodAntiLinksEnabled: true,
    automodAntiWordsEnabled: true,
    automodAntiWordsList: ["scam"],
    automodBypassRoles: ["trusted-role"],
  });

  const linkViolation = await handler.checkMessage(createMessage("visit https://example.test"));
  assert.equal(linkViolation[0].type, "antiLinks");
  assert.equal(linkViolation[0].action, "delete");
  assert.equal((await handler.checkMessage(createMessage("this is a scam")))[0].type, "antiWords");
  assert.equal(await handler.checkMessage(createMessage("visit https://example.test", { roles: ["trusted-role"] })), null);
  assert.equal(await handler.checkMessage(createMessage("visit https://example.test", { bot: true })), null);
});
