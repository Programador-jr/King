const { runSlashCommand, buildMentions } = require("../../handlers/slashCommandUtils");

module.exports = {
  name: "impostometro",
  description: "Mostra o valor atual do Impostometro.",
  options: [],
  runSlash: async (client, interaction) => {
    const args = [];
    const mentions = buildMentions();
    return runSlashCommand(client, interaction, "impostometro", args, mentions);
  }
};
