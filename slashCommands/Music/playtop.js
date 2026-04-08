const { runSlashCommand, buildMentions } = require("../../handlers/slashCommandUtils");

module.exports = {
  name: "playtop",
  description: "Toca e adiciona ao topo da fila.",
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
    return runSlashCommand(client, interaction, "playtop", args, mentions);
  }
};
