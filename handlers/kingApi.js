const express = require("express");
const mongoose = require("mongoose");

function buildLavalinkNodes(client) {
  const nodes = client.lavalink?.manager?.nodeManager?.nodes;
  if (!nodes || typeof nodes.values !== "function") return [];

  return Array.from(nodes.values()).map((node) => ({
    id: node.id || node.options?.id || "unknown",
    connected: Boolean(node.connected),
    host: node.options?.host || null,
    port: node.options?.port || null,
    secure: Boolean(node.options?.secure),
  }));
}

function buildStatusPayload(client) {
  const botOnline = client.isReady();
  const lavalinkNodes = buildLavalinkNodes(client);
  const lavalinkConnected = lavalinkNodes.filter((node) => node.connected).length;

  return {
    ok: true,
    timestamp: new Date().toISOString(),
    bot: {
      id: client.user?.id || null,
      username: client.user?.username || null,
      status: botOnline ? "operational" : "major_outage",
      online: botOnline,
      uptime_ms: client.uptime || 0,
      ping_ms: Number.isFinite(client.ws?.ping) ? client.ws.ping : null,
      guilds: client.guilds?.cache?.size || 0,
      users: client.users?.cache?.size || 0,
    },
    mongodb: {
      status: mongoose.connection.readyState === 1 ? "operational" : "major_outage",
      connected: mongoose.connection.readyState === 1,
      ready_state: mongoose.connection.readyState,
    },
    lavalink: {
      status: lavalinkConnected > 0 ? "operational" : "major_outage",
      connected_nodes: lavalinkConnected,
      total_nodes: lavalinkNodes.length,
      nodes: lavalinkNodes,
    },
  };
}

module.exports = (client) => {
  if (client.kingApiServer) return client.kingApiServer;

  const app = express();
  const apiKey = String(process.env.KING_API_KEY || "").trim();
  const rawPort = String(process.env.KING_API_PORT || "").trim();
  const parsedPort = Number.parseInt(rawPort, 10);
  const port = Number.isInteger(parsedPort) && parsedPort >= 0 && parsedPort < 65536
    ? parsedPort
    : 3002;

  const requireApiKey = (req, res, next) => {
    if (!apiKey) return next();

    const bearer = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
    const headerKey = String(req.headers["x-api-key"] || "").trim();
    const queryKey = String(req.query.key || "").trim();
    const provided = bearer || headerKey || queryKey;

    if (provided && provided === apiKey) return next();

    return res.status(401).json({
      ok: false,
      error: "unauthorized",
      message: "API key invalida ou ausente.",
    });
  };

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "king-api", timestamp: new Date().toISOString() });
  });

  app.get("/api/status", requireApiKey, (req, res) => {
    res.json(buildStatusPayload(client));
  });

  app.get("/api/status/bot", requireApiKey, (req, res) => {
    res.json(buildStatusPayload(client).bot);
  });

  app.get("/api/status/lavalink", requireApiKey, (req, res) => {
    res.json(buildStatusPayload(client).lavalink);
  });

  app.get("/api/status/mongodb", requireApiKey, (req, res) => {
    res.json(buildStatusPayload(client).mongodb);
  });

  const server = app.listen(port, () => {
    console.log(`[KingAPI] Escutando na porta ${port}`);
  });

  client.kingApiServer = server;
  return server;
};
