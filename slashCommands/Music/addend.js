const { runSlashCommand, buildMentions } = require("../../handlers/slashCommandUtils");

module.exports = {
  name: "addend",
  description: "Adiciona a musica atual ao fim da fila.",
  options: [],
  runSlash: async (client, interaction) => {
    const args = [];
    const mentions = buildMentions();
    return runSlashCommand(client, interaction, "addend", args, mentions);
  }
};
