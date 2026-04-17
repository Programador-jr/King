const { runSlashCommand } = require("../../handlers/slashCommandUtils");

module.exports = {
  name: "daily",
  description: "Receba sua recompensa diária de King Coins.",
  options: [],
  runSlash: async (client, interaction) => {
    return runSlashCommand(client, interaction, "daily", []);
  }
};
