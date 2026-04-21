const { runSlashCommand } = require("../../handlers/slashCommandUtils");

module.exports = {
  name: "votos",
  description: "Mostra seu histórico de votos no Top.gg.",
  options: [],
  runSlash: async (client, interaction) => {
    return runSlashCommand(client, interaction, "votos", []);
  }
};
