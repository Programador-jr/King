const { runSlashCommand, buildMentions } = require("../../handlers/slashCommandUtils");

module.exports = {
  name: "rewind",
  description: "Volta a musica em segundos.",
  options: [
  {
    "Integer": {
      "name": "segundos",
      "description": "Segundos para voltar",
      "required": true
    }
  }
],
  runSlash: async (client, interaction) => {
    const value = interaction.options.getInteger("segundos");
    const args = value !== null ? [String(value)] : [];
    const mentions = buildMentions();
    return runSlashCommand(client, interaction, "rewind", args, mentions);
  }
};
