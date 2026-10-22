const assert = require("node:assert/strict");
const { test } = require("node:test");

function minimumVersion(range) {
  const match = String(range).match(/(?:>=|\^|~)?\s*(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
  assert.ok(match, `unsupported engine range: ${range}`);
  return match.slice(1, 4).map((part) => Number(part || 0));
}

function compareVersions(a, b) {
  for (let index = 0; index < 3; index += 1) {
    if (a[index] !== b[index]) return a[index] - b[index];
  }
  return 0;
}

test("declared Node.js minimum meets the locked runtime dependency requirements", () => {
  const packageJson = require("../package.json");
  const lockfile = require("../package-lock.json");
  const declared = minimumVersion(packageJson.engines.node);
  const runtimeDependencies = [
    "node_modules/@discordjs/voice",
    "node_modules/distube",
    "node_modules/mongoose",
    "node_modules/pretty-ms",
  ];

  for (const dependencyPath of runtimeDependencies) {
    const dependency = lockfile.packages[dependencyPath];
    const required = minimumVersion(dependency.engines.node);
    assert.ok(
      compareVersions(declared, required) >= 0,
      `${packageJson.engines.node} is below ${dependency.name || dependencyPath} ${dependency.engines.node}`,
    );
  }
});
