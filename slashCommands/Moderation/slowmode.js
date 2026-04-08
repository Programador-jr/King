const { runSlashCommand, buildMentions } = require("../../handlers/slashCommandUtils");

module.exports = {
  name: "slowmode",
  description: "Define o modo lento do canal.",
  options: [
  {
    "String": {
      "name": "tempo",
      "description": "Segundos ou off",
      "required": true
    }
  },
  {
    "String": {
      "name": "motivo",
      "description": "Motivo",
      "required": false
    }
  }
],
  runSlash: async (client, interaction) => {
    const time = interaction.options.getString("tempo");
    const reason = interaction.options.getString("motivo");
    const args = [time, reason].filter(Boolean);
    const mentions = buildMentions();
    return runSlashCommand(client, interaction, "slowmode", args, mentions);
  }
};
