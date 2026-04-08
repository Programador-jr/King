const { runSlashCommand, buildMentions } = require("../../handlers/slashCommandUtils");

module.exports = {
  name: "custombassboost",
  description: "Define um bassboost personalizado.",
  options: [
  {
    "Integer": {
      "name": "ganho",
      "description": "Ganho de 0 a 20",
      "required": true
    }
  }
],
  runSlash: async (client, interaction) => {
    const value = interaction.options.getInteger("ganho");
    const args = value !== null ? [String(value)] : [];
    const mentions = buildMentions();
    return runSlashCommand(client, interaction, "custombassboost", args, mentions);
  }
};
