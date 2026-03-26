const asyncHooks = require("node:async_hooks");
const tls = require("node:tls");

const HANDSHAKE_ERROR_CODES = new Set([
  "ERR_SSL_SSL/TLS_ALERT_HANDSHAKE_FAILURE",
  "ERR_SSL_TLSV1_ALERT_PROTOCOL_VERSION",
  "EPROTO",
]);

const promiseCreationStacks = new WeakMap();
let promiseTrackingEnabled = false;
let tlsPatched = false;

const toErrorLike = (value) => (value instanceof Error ? value : new Error(String(value)));
const getErrorCode = (error) => String(error?.code || "");
const isTlsHandshakeFailure = (error) => {
  const code = getErrorCode(error);
  if (HANDSHAKE_ERROR_CODES.has(code)) return true;
  const message = String(error?.message || error || "");
  return /ssl\/tls alert handshake failure|alert number 40/i.test(message);
};

const formatError = (error) => {
  const err = toErrorLike(error);
  return {
    name: err.name || "Error",
    code: getErrorCode(err) || "NO_CODE",
    message: err.message || String(err),
    stack: err.stack || "",
    cause: err.cause ? String(err.cause) : "",
    host: err.host || err.hostname || "",
    port: err.port || "",
    address: err.address || "",
    url: err.config?.url || err.request?.path || "",
    method: err.config?.method || "",
  };
};

const enablePromiseTracking = () => {
  if (promiseTrackingEnabled) return;
  promiseTrackingEnabled = true;

  asyncHooks
    .createHook({
      init(asyncId, type, triggerAsyncId, resource) {
        if (type !== "PROMISE" || !resource || typeof resource.then !== "function") return;
        const holder = {};
        Error.captureStackTrace(holder, enablePromiseTracking);
        promiseCreationStacks.set(resource, String(holder.stack || ""));
      },
    })
    .enable();
};

const patchTlsConnectLogging = () => {
  if (tlsPatched) return;
  tlsPatched = true;

  const originalConnect = tls.connect;
  tls.connect = function patchedTlsConnect(...args) {
    let options = {};

    if (typeof args[0] === "object" && args[0] !== null) {
      options = args[0];
    } else {
      if (typeof args[0] === "number") options.port = args[0];
      if (typeof args[1] === "string") options.host = args[1];
      if (typeof args[1] === "object" && args[1] !== null) options = { ...options, ...args[1] };
      if (typeof args[2] === "object" && args[2] !== null) options = { ...options, ...args[2] };
    }

    const socket = originalConnect.apply(this, args);
    socket.once("error", (error) => {
      if (!isTlsHandshakeFailure(error)) return;
      const host = options.servername || options.host || options.hostname || "unknown";
      const port = Number(options.port || 443);
      console.log(`[antiCrash][TLS] Handshake failure in ${host}:${port}`);
    });

    return socket;
  };
};

module.exports = () => {
  enablePromiseTracking();
  patchTlsConnectLogging();

  process.on("unhandledRejection", (reason, promise) => {
    const info = formatError(reason);
    const createdAt = promiseCreationStacks.get(promise) || "";

    if (isTlsHandshakeFailure(reason)) {
      console.log(" [antiCrash] :: Unhandled rejection (TLS handshake)");
      console.log(`[antiCrash] code=${info.code} host=${info.host || "?"} port=${info.port || "?"} url=${info.url || "?"}`);
      if (info.stack) console.log(info.stack);
      if (createdAt) console.log("[antiCrash] Promise created at:\n" + createdAt);
      return;
    }

    console.log(" [antiCrash] :: Unhandled rejection/Catch");
    console.log(`[antiCrash] code=${info.code} message=${info.message}`);
    if (info.url || info.method) {
      console.log(`[antiCrash] request=${String(info.method || "GET").toUpperCase()} ${info.url || "-"}`);
    }
    if (info.stack) console.log(info.stack);
    if (createdAt) console.log("[antiCrash] Promise created at:\n" + createdAt);
  });

  process.on("uncaughtException", (err, origin) => {
    const info = formatError(err);
    console.log(" [antiCrash] :: Uncaught exception/Catch");
    console.log(`[antiCrash] origin=${origin || "unknown"} code=${info.code} message=${info.message}`);
    if (info.stack) console.log(info.stack);
  });

  process.on("uncaughtExceptionMonitor", (err, origin) => {
    const info = formatError(err);
    console.log(" [antiCrash] :: Uncaught exception/Catch (MONITOR)");
    console.log(`[antiCrash] origin=${origin || "unknown"} code=${info.code} message=${info.message}`);
    if (info.stack) console.log(info.stack);
  });

};
