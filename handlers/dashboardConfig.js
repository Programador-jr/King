const dashboardSettings = require("../dashboard/settings.json");

const trim = (value) => String(value ?? "").trim();
const hasProtocol = (value) => /^[a-z][a-z0-9+.-]*:\/\//i.test(value);
const stripTrailingSlash = (value) => String(value || "").replace(/\/+$/, "");

const ensureProtocol = (value, fallbackProtocol = "http") => {
  const raw = trim(value);
  if (!raw) return "";
  return stripTrailingSlash(hasProtocol(raw) ? raw : `${fallbackProtocol}://${raw}`);
};

const readFirstEnv = (keys) => {
  for (const key of keys) {
    const value = trim(process.env[key]);
    if (value) return value;
  }
  return "";
};

const isPlaceholder = (value) => {
  const normalized = trim(value).toLowerCase();
  return !normalized || normalized.includes("your-domain.com");
};

const toPort = (value, fallback) => {
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return fallback;
};

const getDashboardPort = (settings = dashboardSettings) => {
  const envPort = readFirstEnv(["DASHBOARD_PORT", "PORT"]);
  const settingsPort = settings?.config?.http?.port;
  return toPort(envPort || settingsPort, 5000);
};

const getDashboardBaseUrl = (settings = dashboardSettings) => {
  const envDomain = readFirstEnv(["DASHBOARD_DOMAIN", "WEB_URL", "PUBLIC_URL", "APP_URL", "RENDER_EXTERNAL_URL"]);
  const settingsDomain = trim(settings?.website?.domain);
  const raw = envDomain || settingsDomain;
  if (isPlaceholder(raw)) return "";
  const fallbackProtocol = trim(process.env.DASHBOARD_PROTOCOL) || "http";
  return ensureProtocol(raw, fallbackProtocol);
};

const getDashboardCallbackUrl = (settings = dashboardSettings) => {
  const explicitCallback = readFirstEnv(["DASHBOARD_CALLBACK"]) || trim(settings?.config?.callback);
  const fallbackProtocol = trim(process.env.DASHBOARD_PROTOCOL) || "http";
  if (!isPlaceholder(explicitCallback)) {
    return ensureProtocol(explicitCallback, fallbackProtocol);
  }
  const base = getDashboardBaseUrl(settings);
  if (!base) return "";
  return `${base}/callback`;
};

const getDashboardSupportUrl = (settings = dashboardSettings) => {
  const explicitSupport = readFirstEnv(["DASHBOARD_SUPPORT_URL"]) || trim(settings?.website?.support);
  if (!explicitSupport) return "";
  return ensureProtocol(explicitSupport, "https");
};

module.exports = {
  getDashboardPort,
  getDashboardBaseUrl,
  getDashboardCallbackUrl,
  getDashboardSupportUrl,
};
