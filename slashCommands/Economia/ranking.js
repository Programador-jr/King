const { runSlashCommand } = require("../../handlers/slashCommandUtils");

module.exports = {
  name: "ranking",
  description: "Veja o ranking dos maiores detentores de King Coins.",
  options: [],
  runSlash: async (client, interaction) => {
    return runSlashCommand(client, interaction, "ranking", []);
  }
};
