const fs = require("node:fs");
const asyncHooks = require("node:async_hooks");

const promiseCreationStacks = new WeakMap();
const TRACE_PROMISES = process.env.ANTI_CRASH_TRACE_PROMISES === "true";

function redact(value) {
  return String(value ?? "")
    .replace(/\b(Bearer\s+)[^\s,;]+/gi, "$1[REDACTED]")
    .replace(/\b([a-z_-]*(?:password|passwd|secret|token|authorization|api[_-]?key|credential|signature|auth)[a-z_-]*)(\s*[:=]\s*)([^\s,;]+)/gi, "$1$2[REDACTED]")
    .replace(/\b((?:mongo(?:db)?_?uri|database_?url|connection_?string)\s*[:=]\s*)[^\s,;]+/gi, "$1[REDACTED]")
    .replace(/\b([a-z][a-z0-9+.-]*:\/\/)[^\s/@:]+:[^\s/@]+@/gi, "$1[REDACTED]@")
    .replace(/([?&][^=&\s]*(?:token|key|secret|password|signature|auth|credential)[^=&\s]*=)[^&#\s]+/gi, "$1[REDACTED]")
    .slice(0, 2000);
}

function safeError(error) {
  const candidate = error instanceof Error ? error : new Error(String(error));
  return {
    name: redact(candidate.name || "Error"),
    code: redact(candidate.code || "NO_CODE"),
    message: redact(candidate.message || "Unspecified error"),
  };
}

function fatalLog(kind, error, origin = "") {
  const details = safeError(error);
  const trace = TRACE_PROMISES && error && promiseCreationStacks.get(error);
  const line = `[antiCrash] fatal ${kind}${origin ? ` (${redact(origin)})` : ""}: ${details.name} code=${details.code} message=${details.message}${trace ? `\nPromise created at: ${redact(trace)}` : ""}\n`;
  try {
    fs.writeSync(2, line);
  } catch {
    // Preserve the fatal exit even when stderr is unavailable.
  }
  process.exit(1);
}

module.exports = () => {
  if (TRACE_PROMISES) {
    asyncHooks.createHook({
      init(_asyncId, type, _triggerAsyncId, resource) {
        if (type !== "PROMISE" || !resource || typeof resource.then !== "function") return;
        const holder = {};
        Error.captureStackTrace(holder, module.exports);
        promiseCreationStacks.set(resource, holder.stack || "");
      },
    }).enable();
  }

  process.on("unhandledRejection", (reason, promise) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    if (TRACE_PROMISES && promise && error && !promiseCreationStacks.has(error)) {
      const trace = promiseCreationStacks.get(promise);
      if (trace) promiseCreationStacks.set(error, trace);
    }
    fatalLog("unhandledRejection", error);
  });

  // Do not swallow uncaught exceptions: terminate immediately after a sanitized synchronous log.
  process.on("uncaughtException", (error, origin) => fatalLog("uncaughtException", error, origin));
};
