const { runSlashCommand, buildMentions } = require("../../handlers/slashCommandUtils");

module.exports = {
  name: "forward",
  description: "Avanca a musica em segundos.",
  options: [
  {
    "Integer": {
      "name": "segundos",
      "description": "Segundos para avancar",
      "required": true
    }
  }
],
  runSlash: async (client, interaction) => {
    const value = interaction.options.getInteger("segundos");
    const args = value !== null ? [String(value)] : [];
    const mentions = buildMentions();
    return runSlashCommand(client, interaction, "forward", args, mentions);
  }
};
