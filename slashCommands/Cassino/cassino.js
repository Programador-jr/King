const { runSlashCommand } = require("../../handlers/slashCommandUtils");

module.exports = {
  name: "cassino",
  description: "Mostra os jogos de cassino disponiveis.",
  options: [],
  runSlash: async (client, interaction) => runSlashCommand(client, interaction, "cassino", [])
};
