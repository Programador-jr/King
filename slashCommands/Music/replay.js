const { runSlashCommand, buildMentions } = require("../../handlers/slashCommandUtils");

module.exports = {
  name: "replay",
  description: "Reinicia a musica atual.",
  options: [],
  runSlash: async (client, interaction) => {
    const args = [];
    const mentions = buildMentions();
    return runSlashCommand(client, interaction, "replay", args, mentions);
  }
};
