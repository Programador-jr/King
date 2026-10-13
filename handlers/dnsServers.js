const net = require("node:net");

function normalizeDnsServer(value) {
  const input = String(value || "").trim();
  let host;
  let port;

  if (input.startsWith("[")) {
    const match = input.match(/^\[([^\]]+)\](?::(\d+))?$/);
    if (!match || net.isIP(match[1]) !== 6) throw new Error(`Invalid DNS server: ${input}`);
    [, host, port] = match;
    host = `[${host}]`;
  } else {
    if (net.isIP(input)) return input;
    const match = input.match(/^([^:]+):(\d+)$/);
    if (!match || net.isIP(match[1]) !== 4) throw new Error(`Invalid DNS server: ${input}`);
    [, host, port] = match;
  }

  if (port && (Number(port) < 1 || Number(port) > 65535)) {
    throw new Error(`Invalid DNS server port: ${port}`);
  }
  return port ? `${host}:${Number(port)}` : host;
}

function parseDnsServers(value) {
  const entries = String(value || "").split(",").map((item) => item.trim()).filter(Boolean);
  return entries.map(normalizeDnsServer);
}

module.exports = { parseDnsServers, normalizeDnsServer };
