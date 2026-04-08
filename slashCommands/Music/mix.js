const { runSlashCommand, buildMentions } = require("../../handlers/slashCommandUtils");

module.exports = {
  name: "mix",
  description: "Toca um mix pre-definido.",
  options: [
  {
    "String": {
      "name": "mix",
      "description": "Nome do mix",
      "required": false
    }
  }
],
  runSlash: async (client, interaction) => {
    const value = interaction.options.getString("mix");
    const args = value ? [value] : [];
    const mentions = buildMentions();
    return runSlashCommand(client, interaction, "mix", args, mentions);
  }
};
