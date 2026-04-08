const { runSlashCommand, buildMentions } = require("../../handlers/slashCommandUtils");

module.exports = {
  name: "move",
  description: "Move uma musica de lugar.",
  options: [
  {
    "Integer": {
      "name": "origem",
      "description": "Posicao da musica",
      "required": true
    }
  },
  {
    "Integer": {
      "name": "destino",
      "description": "Nova posicao",
      "required": true
    }
  }
],
  runSlash: async (client, interaction) => {
    const first = interaction.options.getInteger("origem");
    const second = interaction.options.getInteger("destino");
    const args = [first, second].filter((v) => v !== null && v !== undefined).map((v) => String(v));
    const mentions = buildMentions();
    return runSlashCommand(client, interaction, "move", args, mentions);
  }
};
