const { runSlashCommand, buildMentions } = require("../../handlers/slashCommandUtils");

module.exports = {
  name: "clear",
  description: "Limpa a fila.",
  options: [],
  runSlash: async (client, interaction) => {
    const args = [];
    const mentions = buildMentions();
    return runSlashCommand(client, interaction, "clear", args, mentions);
  }
};
