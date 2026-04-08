const { runSlashCommand, buildMentions } = require("../../handlers/slashCommandUtils");

module.exports = {
  name: "play",
  description: "Toca uma musica ou playlist.",
  options: [
  {
    "String": {
      "name": "busca",
      "description": "Nome ou link",
      "required": true
    }
  }
],
  runSlash: async (client, interaction) => {
    const value = interaction.options.getString("busca");
    const args = value ? [value] : [];
    const mentions = buildMentions();
    return runSlashCommand(client, interaction, "play", args, mentions);
  }
};
