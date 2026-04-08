const { runSlashCommand, buildMentions } = require("../../handlers/slashCommandUtils");

module.exports = {
  name: "emoji",
  description: "Mostra informacoes de um emoji.",
  options: [
  {
    "String": {
      "name": "emoji",
      "description": "Emoji ou nome",
      "required": true
    }
  }
],
  runSlash: async (client, interaction) => {
    const value = interaction.options.getString("emoji");
    const args = value ? [value] : [];
    const mentions = buildMentions();
    return runSlashCommand(client, interaction, "emoji", args, mentions);
  }
};
