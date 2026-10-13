const assert = require("node:assert/strict");
const http = require("node:http");
const express = require("express");
const session = require("express-session");
const { afterEach, test } = require("node:test");
const { createDashboardRequestSecurity } = require("../dashboard/requestSecurity");

const servers = [];

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  })));
});

async function withServer(options, callback) {
  const security = createDashboardRequestSecurity(options);
  const app = express();
  app.set("trust proxy", 1);
  app.use(security.securityHeaders);
  app.use(session({
    secret: "test-session-secret-that-is-long-enough",
    resave: false,
    saveUninitialized: false,
  }));
  app.use(security.requestRateLimit);
  app.use(security.jsonParser);
  app.use(security.urlencodedParser);
  app.use(security.sameOriginProtection);
  app.use(security.csrfProtection);
  app.get("/page", (req, res) => res.json({ token: security.generateCsrfToken(req) }));
  app.get("/login", (_req, res) => res.sendStatus(200));
  app.get("/callback", (_req, res) => res.sendStatus(200));
  app.post("/mutate", (req, res) => res.json({ ok: true, body: req.body }));
  app.post("/api/queue/:guildID/control", (_req, res) => res.sendStatus(204));
  app.post("/api/tickets/:guildID/:ticketNumber/close", (_req, res) => res.sendStatus(204));
  app.post("/webhooks/topgg", (_req, res) => res.status(204).end());
  app.use(security.errorHandler);

  const server = http.createServer(app);
  servers.push(server);
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();
  await callback(`http://127.0.0.1:${address.port}`);
}

async function getCsrfSession(baseUrl) {
  const pageResponse = await fetch(`${baseUrl}/page`);
  const cookie = pageResponse.headers.get("set-cookie")?.split(";")[0];
  const { token } = await pageResponse.json();
  assert.ok(cookie);
  assert.ok(token);
  return { cookie, token };
}

test("dashboard emits Helmet headers and an explicit compatible CSP", async () => {
  await withServer({}, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/page`);
    const policy = response.headers.get("content-security-policy");

    assert.equal(response.status, 200);
    assert.match(policy, /default-src 'self'/);
    assert.match(policy, /cdn\.jsdelivr\.net/);
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  });
});

test("state-changing requests require a session CSRF token; Top.gg keeps its signed webhook flow", async () => {
  await withServer({}, async (baseUrl) => {
    const { cookie, token } = await getCsrfSession(baseUrl);

    const missing = await fetch(`${baseUrl}/mutate`, {
      method: "POST",
      headers: { cookie, "content-type": "application/json" },
      body: JSON.stringify({ value: "no-token" }),
    });
    assert.equal(missing.status, 403);
    assert.equal((await missing.json()).error, "invalid_csrf_token");

    const accepted = await fetch(`${baseUrl}/mutate`, {
      method: "POST",
      headers: { cookie, "content-type": "application/json", "x-csrf-token": token },
      body: JSON.stringify({ value: "ok" }),
    });
    assert.equal(accepted.status, 200);

    const formAccepted = await fetch(`${baseUrl}/mutate`, {
      method: "POST",
      headers: { cookie, "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ _csrf: token, value: "form-ok" }),
    });
    assert.equal(formAccepted.status, 200);

    const webhook = await fetch(`${baseUrl}/webhooks/topgg`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    });
    assert.equal(webhook.status, 204);
  });
});

test("same-origin defense rejects a mismatched Origin even when a token is supplied", async () => {
  await withServer({}, async (baseUrl) => {
    const { cookie, token } = await getCsrfSession(baseUrl);
    const response = await fetch(`${baseUrl}/mutate`, {
      method: "POST",
      headers: {
        cookie,
        origin: "https://attacker.example",
        "content-type": "application/json",
        "x-csrf-token": token,
      },
      body: JSON.stringify({ value: "blocked" }),
    });

    assert.equal(response.status, 403);
    assert.equal((await response.json()).error, "cross_origin_request");
  });
});

test("sensitive routes return 429 with standard headers when rate limited", async () => {
  await withServer({ limits: { mutation: { windowMs: 60_000, limit: 1 } } }, async (baseUrl) => {
    const { cookie, token } = await getCsrfSession(baseUrl);
    const request = () => fetch(`${baseUrl}/mutate`, {
      method: "POST",
      headers: { cookie, "content-type": "application/json", "x-csrf-token": token },
      body: JSON.stringify({ value: "ok" }),
    });

    assert.equal((await request()).status, 200);
    const limited = await request();
    assert.equal(limited.status, 429);
    assert.equal((await limited.json()).error, "rate_limited");
    assert.ok(limited.headers.get("ratelimit-limit"));
  });
});

test("OAuth, queue-control, and ticket endpoints use their dedicated limits", async () => {
  await withServer({ limits: {
    oauth: { windowMs: 60_000, limit: 1 },
    queue: { windowMs: 60_000, limit: 1 },
    tickets: { windowMs: 60_000, limit: 1 },
  } }, async (baseUrl) => {
    assert.equal((await fetch(`${baseUrl}/login`)).status, 200);
    assert.equal((await fetch(`${baseUrl}/callback`)).status, 429);

    const { cookie, token } = await getCsrfSession(baseUrl);
    const postWithToken = (url) => fetch(url, {
      method: "POST",
      headers: { cookie, "content-type": "application/json", "x-csrf-token": token },
      body: "{}",
    });

    const queueUrl = `${baseUrl}/api/queue/guild-1/control`;
    assert.equal((await postWithToken(queueUrl)).status, 204);
    assert.equal((await postWithToken(queueUrl)).status, 429);

    const ticketUrl = `${baseUrl}/api/tickets/guild-1/1/close`;
    assert.equal((await postWithToken(ticketUrl)).status, 204);
    assert.equal((await postWithToken(ticketUrl)).status, 429);
  });
});

test("JSON and URL-encoded body limits return a controlled 413", async () => {
  await withServer({ bodyLimit: "32b", parameterLimit: 1 }, async (baseUrl) => {
    const jsonResponse = await fetch(`${baseUrl}/mutate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ payload: "x".repeat(100) }),
    });
    assert.equal(jsonResponse.status, 413);
    assert.equal((await jsonResponse.json()).error, "payload_too_large");

    const formResponse = await fetch(`${baseUrl}/mutate`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ first: "1", second: "2" }),
    });
    assert.equal(formResponse.status, 413);
  });
});
