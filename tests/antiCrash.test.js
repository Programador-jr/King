const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const path = require("node:path");
const { test } = require("node:test");

const root = path.resolve(__dirname, "..");
const fatalError = 'Bearer bearer-secret access_token=query-secret https://user:password@example.com/?api_key=url-secret MONGO_URI=mongodb+srv://db-user:db-secret@cluster.example/db';

function runNode(script, extraEnv = {}) {
  const env = { ...process.env };
  delete env.ANTI_CRASH_TRACE_PROMISES;
  Object.assign(env, extraEnv);
  return spawnSync(process.execPath, ["-e", script], { cwd: root, env, encoding: "utf8" });
}

test("antiCrash leaves TLS untouched and promise tracing disabled by default", () => {
  const result = runNode(`
    const hooks = require('node:async_hooks');
    const tls = require('node:tls');
    const original = hooks.createHook;
    let hookCount = 0;
    hooks.createHook = (...args) => { hookCount += 1; return original(...args); };
    const connect = tls.connect;
    require('./handlers/antiCrash')();
    process.stdout.write(JSON.stringify({ hookCount, tlsUntouched: tls.connect === connect }));
  `);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), { hookCount: 0, tlsUntouched: true });
});

test("antiCrash enables promise creation tracing only when requested", () => {
  const result = runNode(`
    const hooks = require('node:async_hooks');
    const original = hooks.createHook;
    let hookCount = 0;
    hooks.createHook = (...args) => { hookCount += 1; return original(...args); };
    require('./handlers/antiCrash')();
    process.stdout.write(String(hookCount));
  `, { ANTI_CRASH_TRACE_PROMISES: "true" });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(Number(result.stdout), 1);
});

test("uncaught exceptions terminate with a redacted fatal log", () => {
  const result = runNode(`
    require('./handlers/antiCrash')();
    setImmediate(() => { throw new Error(${JSON.stringify(fatalError)}); });
  `);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /fatal uncaughtException/);
  assert.match(result.stderr, /\[REDACTED\]/);
  for (const secret of ["bearer-secret", "query-secret", "password", "url-secret", "db-secret"]) {
    assert.equal(result.stderr.includes(secret), false, `log leaked ${secret}`);
  }
});

test("unhandled rejections terminate with a redacted fatal log", () => {
  const result = runNode(`
    require('./handlers/antiCrash')();
    Promise.reject(new Error(${JSON.stringify(fatalError)}));
  `);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /fatal unhandledRejection/);
  assert.match(result.stderr, /\[REDACTED\]/);
  for (const secret of ["bearer-secret", "query-secret", "password", "url-secret", "db-secret"]) {
    assert.equal(result.stderr.includes(secret), false, `log leaked ${secret}`);
  }
});
