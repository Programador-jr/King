const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const {
  createDashboardSessionConfig,
  SESSION_MAX_AGE_MS,
} = require("../dashboard/sessionConfig");

test("production requires a configured dashboard session secret", () => {
  assert.throws(
    () => createDashboardSessionConfig({ env: {}, production: true }),
    /DASHBOARD_SESSION_SECRET is required in production/
  );
});

test("rejects weak and placeholder session secrets", () => {
  for (const secret of ["short", "YOUR_VERY_LONG_RANDOM_SECRET_KEY_HERE", "SUA_CHAVE_SECRETA_MUITO_LONGA", "COLE_UMA_CHAVE_ALEATORIA_DE_48_BYTES_EM_HEXADECIMAL", "SUBSTITUA_PELA_CHAVE_GERADA"]) {
    assert.throws(
      () => createDashboardSessionConfig({
        env: { DASHBOARD_SESSION_SECRET: secret },
        production: false,
      }),
      /non-placeholder secret with at least 32 characters/
    );
  }
});

test("production session config uses secure cookie defaults and explicit proxy trust", () => {
  const config = createDashboardSessionConfig({
    env: { DASHBOARD_SESSION_SECRET: "a".repeat(48) },
    production: true,
    secureCookie: true,
    trustProxy: true,
  });

  assert.equal(config.secret, "a".repeat(48));
  assert.equal(config.generatedSecret, false);
  assert.equal(config.trustProxy, 1);
  assert.deepEqual(config.cookie, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    maxAge: SESSION_MAX_AGE_MS,
  });
});

test("development without a configured secret uses a random temporary secret", () => {
  const first = createDashboardSessionConfig({ env: {}, production: false });
  const second = createDashboardSessionConfig({ env: {}, production: false });

  assert.equal(first.generatedSecret, true);
  assert.equal(first.secret.length, 96);
  assert.notEqual(first.secret, second.secret);
  assert.equal(first.cookie.secure, false);
});

test("dashboard rotates the session on login and destroys it on logout", () => {
  const source = fs.readFileSync(path.join(__dirname, "../dashboard/index.js"), "utf8");

  assert.doesNotMatch(source, /DASHBOARD_SESSION_SECRET\s*\|\|\s*`/);
  assert.match(source, /req\.logIn\(user, \(loginErr\)/);
  assert.match(source, /req\.session\.backURL = backURL/);
  assert.match(source, /req\.logout\(\(err\)/);
  assert.match(source, /req\.session\.destroy\(\(err\)/);
  assert.match(source, /httpOnly:\s*true/);
  assert.match(source, /sameSite:\s*"lax"/);
});
