const assert = require("node:assert/strict");
const { test } = require("node:test");

function minimumVersion(range) {
  const match = String(range).match(/(?:>=|\^|~)?(\d+)\.(\d+)\.(\d+)/);
  assert.ok(match, `unsupported engine range: ${range}`);
  return match.slice(1).map(Number);
}

function compareVersions(a, b) {
  for (let index = 0; index < 3; index += 1) {
    if (a[index] !== b[index]) return a[index] - b[index];
  }
  return 0;
}

test("declared Node.js minimum meets the locked Mongoose engine requirement", () => {
  const packageJson = require("../package.json");
  const lockfile = require("../package-lock.json");
  const declared = minimumVersion(packageJson.engines.node);
  const mongoose = minimumVersion(lockfile.packages["node_modules/mongoose"].engines.node);
  assert.ok(compareVersions(declared, mongoose) >= 0, `${packageJson.engines.node} is below mongoose ${lockfile.packages["node_modules/mongoose"].engines.node}`);
});
