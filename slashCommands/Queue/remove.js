const { runSlashCommand, buildMentions } = require("../../handlers/slashCommandUtils");

module.exports = {
  name: "remove",
  description: "Remove uma musica da fila.",
  options: [
  {
    "Integer": {
      "name": "posicao",
      "description": "Indice da musica",
      "required": true
    }
  }
],
  runSlash: async (client, interaction) => {
    const value = interaction.options.getInteger("posicao");
    const args = value !== null ? [String(value)] : [];
    const mentions = buildMentions();
    return runSlashCommand(client, interaction, "remove", args, mentions);
  }
};
