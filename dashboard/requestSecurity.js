const express = require("express");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
const { csrfSync } = require("csrf-sync");

const DEFAULT_BODY_LIMIT = "256kb";
const DEFAULT_PARAMETER_LIMIT = 200;
const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const DEFAULT_RATE_LIMITS = Object.freeze({
  oauth: { windowMs: 15 * 60 * 1000, limit: 20 },
  mutation: { windowMs: 60 * 1000, limit: 60 },
  queue: { windowMs: 60 * 1000, limit: 30 },
  tickets: { windowMs: 60 * 1000, limit: 30 },
  webhook: { windowMs: 60 * 1000, limit: 120 },
});

function createDashboardRequestSecurity({
  production = process.env.NODE_ENV === "production",
  bodyLimit = DEFAULT_BODY_LIMIT,
  parameterLimit = DEFAULT_PARAMETER_LIMIT,
  limits = {},
} = {}) {
  const configuredLimits = { ...DEFAULT_RATE_LIMITS, ...limits };

  const securityHeaders = helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", "data:", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com"],
        formAction: ["'self'"],
        frameAncestors: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        objectSrc: ["'none'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
        scriptSrcAttr: ["'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
        styleSrcAttr: ["'unsafe-inline'"],
        upgradeInsecureRequests: production ? [] : null,
      },
    },
    strictTransportSecurity: production ? undefined : false,
  });

  const jsonParser = express.json({ limit: bodyLimit });
  const urlencodedParser = express.urlencoded({
    extended: true,
    limit: bodyLimit,
    parameterLimit,
  });

  const {
    generateToken,
    csrfSynchronisedProtection,
  } = csrfSync({
    getTokenFromRequest: (req) => {
      if (req.is("application/x-www-form-urlencoded")) return req.body?._csrf;
      return req.get("x-csrf-token");
    },
    skipCsrfProtection: (req) => req.path === "/webhooks/topgg",
    errorConfig: {
      statusCode: 403,
      message: "A valid CSRF token is required.",
      code: "EBADCSRFTOKEN",
    },
  });

  const createLimiter = (name) => rateLimit({
    ...configuredLimits[name],
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => res.status(429).json({
      ok: false,
      error: "rate_limited",
      message: "Muitas requisições. Aguarde antes de tentar novamente.",
    }),
  });

  const oauthLimiter = createLimiter("oauth");
  const mutationLimiter = createLimiter("mutation");
  const queueLimiter = createLimiter("queue");
  const ticketLimiter = createLimiter("tickets");
  const webhookLimiter = createLimiter("webhook");

  const requestRateLimit = (req, res, next) => {
    if (req.path === "/login" || req.path === "/callback") {
      return oauthLimiter(req, res, next);
    }
    if (req.path === "/webhooks/topgg") {
      return webhookLimiter(req, res, next);
    }
    if (!UNSAFE_METHODS.has(req.method)) return next();
    if (/^\/api\/queue\/[^/]+\/control$/.test(req.path)) {
      return queueLimiter(req, res, next);
    }
    if (req.path.startsWith("/api/tickets/") || /^\/dashboard\/[^/]+\/tickets\//.test(req.path)) {
      return ticketLimiter(req, res, next);
    }
    return mutationLimiter(req, res, next);
  };

  const sameOriginProtection = (req, res, next) => {
    if (!UNSAFE_METHODS.has(req.method) || req.path === "/webhooks/topgg") return next();

    const fetchSite = String(req.get("sec-fetch-site") || "").toLowerCase();
    if (fetchSite === "cross-site") {
      return res.status(403).json({ ok: false, error: "cross_origin_request" });
    }

    const origin = req.get("origin");
    if (!origin) return next();

    try {
      const originUrl = new URL(origin);
      const requestOrigin = new URL(`${req.protocol}://${req.get("host")}`);
      if (originUrl.origin !== requestOrigin.origin) {
        return res.status(403).json({ ok: false, error: "cross_origin_request" });
      }
    } catch {
      return res.status(403).json({ ok: false, error: "cross_origin_request" });
    }
    return next();
  };

  const errorHandler = (err, _req, res, next) => {
    if (err?.code === "EBADCSRFTOKEN") {
      return res.status(403).json({ ok: false, error: "invalid_csrf_token" });
    }
    if (err?.type === "entity.too.large" || err?.type === "parameters.too.many") {
      return res.status(413).json({ ok: false, error: "payload_too_large" });
    }
    if (err?.type === "entity.parse.failed") {
      return res.status(400).json({ ok: false, error: "invalid_request_body" });
    }
    return next(err);
  };

  return {
    securityHeaders,
    jsonParser,
    urlencodedParser,
    requestRateLimit,
    sameOriginProtection,
    csrfProtection: csrfSynchronisedProtection,
    generateCsrfToken: (req) => generateToken(req),
    errorHandler,
    bodyLimit,
    parameterLimit,
  };
}

module.exports = {
  createDashboardRequestSecurity,
  DEFAULT_BODY_LIMIT,
  DEFAULT_PARAMETER_LIMIT,
  DEFAULT_RATE_LIMITS,
};
