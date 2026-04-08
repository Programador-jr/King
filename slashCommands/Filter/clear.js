const { runSlashCommand, buildMentions } = require("../../handlers/slashCommandUtils");

module.exports = {
  name: "clear",
  description: "Remove todos os filtros.",
  options: [],
  runSlash: async (client, interaction) => {
    const args = [];
    const mentions = buildMentions();
    return runSlashCommand(client, interaction, "clear", args, mentions);
  }
};
