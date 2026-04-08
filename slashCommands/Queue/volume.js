const { runSlashCommand, buildMentions } = require("../../handlers/slashCommandUtils");

module.exports = {
  name: "volume",
  description: "Define o volume.",
  options: [
  {
    "Integer": {
      "name": "volume",
      "description": "Volume de 1 a 150",
      "required": true
    }
  }
],
  runSlash: async (client, interaction) => {
    const value = interaction.options.getInteger("volume");
    const args = value !== null ? [String(value)] : [];
    const mentions = buildMentions();
    return runSlashCommand(client, interaction, "volume", args, mentions);
  }
};
