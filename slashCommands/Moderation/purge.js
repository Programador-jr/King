const { runSlashCommand, buildMentions } = require("../../handlers/slashCommandUtils");

module.exports = {
  name: "purge",
  description: "Apaga varias mensagens do canal.",
  options: [
  {
    "Integer": {
      "name": "quantidade",
      "description": "Numero de mensagens (1-100)",
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
    const amount = interaction.options.getInteger("quantidade");
    const reason = interaction.options.getString("motivo");
    const args = [amount !== null ? String(amount) : null, reason].filter(Boolean);
    const mentions = buildMentions();
    return runSlashCommand(client, interaction, "purge", args, mentions);
  }
};
