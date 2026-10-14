const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");
const express = require("express");
const { afterEach, test } = require("node:test");
const mountDashboardStaticAssets = require("../dashboard/staticAssets");

const servers = [];
const tempDirs = [];

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  })));
  await Promise.all(tempDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })));
});

test("dashboard serves public assets but does not expose internal files", async () => {
  const dashboardSource = await fs.readFile(path.join(__dirname, "../dashboard/index.js"), "utf8");
  assert.match(dashboardSource, /require\(["']\.\/staticAssets["']\)\(app, express, __dirname\)/);
  assert.doesNotMatch(dashboardSource, /express\.static\(path\.join\(__dirname, ['"]\/['"]\),\s*\{\s*dotfiles:\s*['"]allow['"]\s*\}\)/);
  const dashboardDir = await fs.mkdtemp(path.join(os.tmpdir(), "king-dashboard-static-"));
  tempDirs.push(dashboardDir);

  await fs.mkdir(path.join(dashboardDir, "public"));
  await fs.mkdir(path.join(dashboardDir, "views"));
  await fs.writeFile(path.join(dashboardDir, "public", "style.css"), "body { color: black; }");
  await fs.writeFile(path.join(dashboardDir, "index.js"), "SERVER_SOURCE_SECRET");
  await fs.writeFile(path.join(dashboardDir, "settings.json"), '{"secret":"CONFIG_SECRET"}');
  await fs.writeFile(path.join(dashboardDir, ".env"), "TOKEN=ENV_SECRET");
  await fs.writeFile(path.join(dashboardDir, "views", "index.ejs"), "TEMPLATE_SECRET");

  const app = express();
  mountDashboardStaticAssets(app, express, dashboardDir);
  const server = http.createServer(app);
  servers.push(server);

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const asset = await fetch(`${baseUrl}/public/style.css`);
  assert.equal(asset.status, 200);
  assert.match(await asset.text(), /color: black/);
  assert.equal((await fetch(`${baseUrl}/style.css`)).status, 200);

  for (const route of ["/public/index.js", "/public/settings.json", "/public/.env", "/public/views/index.ejs", "/index.js", "/settings.json", "/.env", "/views/index.ejs"]) {
    const response = await fetch(`${baseUrl}${route}`);
    assert.equal(response.status, 404, `${route} should not be publicly accessible`);
    const body = await response.text();
    assert.doesNotMatch(body, /SERVER_SOURCE_SECRET|CONFIG_SECRET|ENV_SECRET|TEMPLATE_SECRET/);
  }
});
