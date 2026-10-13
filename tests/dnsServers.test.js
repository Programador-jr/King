const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const path = require("node:path");
const { test } = require("node:test");
const { parseDnsServers } = require("../handlers/dnsServers");

const root = path.resolve(__dirname, "..");

test("DNS_SERVERS accepts absent, empty, IPv4, IPv6, and optional ports", () => {
  assert.deepEqual(parseDnsServers(undefined), []);
  assert.deepEqual(parseDnsServers("  "), []);
  assert.deepEqual(parseDnsServers("1.1.1.1, 8.8.8.8:5353, [2001:4860:4860::8888]:53"), [
    "1.1.1.1",
    "8.8.8.8:5353",
    "[2001:4860:4860::8888]:53",
  ]);
});

test("MongoDB module initializes with unset or empty DNS_SERVERS and uses system DNS", () => {
  for (const value of [undefined, ""]) {
    const env = { ...process.env, NODE_ENV: "production", DNS_SERVERS: value ?? "" };
    if (value === undefined) delete env.DNS_SERVERS;
    const result = spawnSync(process.execPath, ["-e", "require('./databases/mongodb')"], {
      cwd: root,
      env,
      encoding: "utf8",
    });
    assert.equal(result.status, 0, result.stderr);
  }
});

test("MongoDB module applies valid custom DNS and rejects invalid entries clearly", () => {
  const valid = spawnSync(process.execPath, ["-e", "require('./databases/mongodb')"], {
    cwd: root,
    env: { ...process.env, NODE_ENV: "production", DNS_SERVERS: "1.1.1.1,[2001:4860:4860::8888]:53" },
    encoding: "utf8",
  });
  assert.equal(valid.status, 0, valid.stderr);

  const invalid = spawnSync(process.execPath, ["-e", "require('./databases/mongodb')"], {
    cwd: root,
    env: { ...process.env, NODE_ENV: "production", DNS_SERVERS: "not-a-dns-server" },
    encoding: "utf8",
  });
  assert.notEqual(invalid.status, 0);
  assert.match(invalid.stderr, /Invalid DNS server/);
});
