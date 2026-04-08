const { runSlashCommand, buildMentions } = require("../../handlers/slashCommandUtils");

module.exports = {
  name: "seek",
  description: "Define a posicao atual da musica.",
  options: [
  {
    "Integer": {
      "name": "segundos",
      "description": "Segundos para ir",
      "required": true
    }
  }
],
  runSlash: async (client, interaction) => {
    const value = interaction.options.getInteger("segundos");
    const args = value !== null ? [String(value)] : [];
    const mentions = buildMentions();
    return runSlashCommand(client, interaction, "seek", args, mentions);
  }
};
