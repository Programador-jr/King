const path = require("node:path");

/**
 * Expose only files intentionally placed in the dashboard's public directory.
 * Server code, templates, configuration, and environment files must never be
 * served from the dashboard root.
 */
module.exports = function mountDashboardStaticAssets(app, express, dashboardDir) {
  app.use(express.static(path.join(dashboardDir, "public"), {
    dotfiles: "ignore",
    index: false,
  }));
};
