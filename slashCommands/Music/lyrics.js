const { runSlashCommand, buildMentions } = require("../../handlers/slashCommandUtils");

module.exports = {
  name: "lyrics",
  description: "Mostra a letra da musica.",
  options: [
  {
    "String": {
      "name": "busca",
      "description": "Nome da musica (opcional)",
      "required": false
    }
  }
],
  runSlash: async (client, interaction) => {
    const value = interaction.options.getString("busca");
    const args = value ? [value] : [];
    const mentions = buildMentions();
    return runSlashCommand(client, interaction, "lyrics", args, mentions);
  }
};
