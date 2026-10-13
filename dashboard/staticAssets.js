const path = require("node:path");

/**
 * Expose only files intentionally placed in the dashboard's public directory.
 * Server code, templates, configuration, and environment files must never be
 * served from the dashboard root.
 */
module.exports = function mountDashboardStaticAssets(app, express, dashboardDir) {
  const publicDirectory = path.join(dashboardDir, "public");
  const options = {
    dotfiles: "ignore",
    index: false,
  };
  app.use(express.static(publicDirectory, options));
  app.use("/public", express.static(publicDirectory, options));
};
