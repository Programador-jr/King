const assert = require("node:assert/strict");
const { afterEach, test } = require("node:test");
const startKingApi = require("../handlers/kingApi");

const envKeys = ["KING_API_KEY", "KING_API_PORT", "NODE_ENV"];
const originalEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));

function restoreEnv() {
  for (const key of envKeys) {
    if (originalEnv[key] === undefined) delete process.env[key];
    else process.env[key] = originalEnv[key];
  }
}

afterEach(restoreEnv);

function createClient() {
  return {
    isReady: () => true,
    user: { id: "bot-id", username: "King" },
    uptime: 1000,
    ws: { ping: 20 },
    guilds: { cache: { size: 2 } },
    users: { cache: { size: 10 } },
    lavalink: { manager: { nodeManager: { nodes: new Map() } } },
  };
}

async function withServer(env, callback) {
  restoreEnv();
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }

  const client = createClient();
  const server = startKingApi(client);

  await new Promise((resolve, reject) => {
    if (server.listening) return resolve();
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const address = server.address();
  try {
    await callback(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
    delete client.kingApiServer;
  }
}

test("production startup fails when KING_API_KEY is missing", () => {
  restoreEnv();
  process.env.NODE_ENV = "production";
  delete process.env.KING_API_KEY;
  process.env.KING_API_PORT = "0";

  assert.throws(
    () => startKingApi(createClient()),
    /KING_API_KEY is required in production/
  );
});

test("protected endpoints return 503 when authentication is not configured outside production", async () => {
  await withServer({ NODE_ENV: "test", KING_API_KEY: undefined, KING_API_PORT: "0" }, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/status`);
    assert.equal(response.status, 503);
    assert.equal((await response.json()).error, "service_unavailable");
  });
});

test("health stays minimal and public", async () => {
  await withServer({ NODE_ENV: "test", KING_API_KEY: "test-secret", KING_API_PORT: "0" }, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/health`);
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.service, "king-api");
    assert.equal("bot" in payload, false);
    assert.equal("lavalink" in payload, false);
  });
});

test("status endpoints reject missing or invalid credentials and ignore query-string keys", async () => {
  await withServer({ NODE_ENV: "test", KING_API_KEY: "test-secret", KING_API_PORT: "0" }, async (baseUrl) => {
    for (const url of [
      `${baseUrl}/api/status`,
      `${baseUrl}/api/status?key=test-secret`,
    ]) {
      const response = await fetch(url);
      assert.equal(response.status, 401);
    }

    const invalid = await fetch(`${baseUrl}/api/status`, {
      headers: { "x-api-key": "wrong-secret" },
    });
    assert.equal(invalid.status, 401);
  });
});

test("status endpoints accept an API key header or Bearer token", async () => {
  await withServer({ NODE_ENV: "test", KING_API_KEY: "test-secret", KING_API_PORT: "0" }, async (baseUrl) => {
    const headerResponse = await fetch(`${baseUrl}/api/status`, {
      headers: { "x-api-key": "test-secret" },
    });
    assert.equal(headerResponse.status, 200);

    const bearerResponse = await fetch(`${baseUrl}/api/status/bot`, {
      headers: { authorization: "Bearer test-secret" },
    });
    assert.equal(bearerResponse.status, 200);
  });
});
