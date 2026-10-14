const crypto = require("node:crypto");

const SECRET_MIN_LENGTH = 32;
const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;

function isPlaceholderSecret(secret) {
  return /^(your|sua|replace|paste|cole|substitua|change[_ -]?me|example|placeholder)/i.test(secret);
}

function createDashboardSessionConfig({
  env = process.env,
  production = env.NODE_ENV === "production",
  secureCookie = production,
  trustProxy = false,
} = {}) {
  const configuredSecret = String(env.DASHBOARD_SESSION_SECRET || "").trim();

  if (configuredSecret && (configuredSecret.length < SECRET_MIN_LENGTH || isPlaceholderSecret(configuredSecret))) {
    throw new Error(
      `[dashboard] DASHBOARD_SESSION_SECRET must be a non-placeholder secret with at least ${SECRET_MIN_LENGTH} characters.`
    );
  }

  if (production && !configuredSecret) {
    throw new Error("[dashboard] DASHBOARD_SESSION_SECRET is required in production.");
  }

  const generatedSecret = !configuredSecret;
  const secret = configuredSecret || crypto.randomBytes(48).toString("hex");

  return {
    secret,
    generatedSecret,
    trustProxy: trustProxy ? 1 : false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: Boolean(secureCookie),
      maxAge: SESSION_MAX_AGE_MS,
    },
  };
}

module.exports = { createDashboardSessionConfig, SECRET_MIN_LENGTH, SESSION_MAX_AGE_MS };
