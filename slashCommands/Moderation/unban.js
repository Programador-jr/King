const { runSlashCommand, buildMentions } = require("../../handlers/slashCommandUtils");

module.exports = {
  name: "unban",
  description: "Remove o banimento de um usuario.",
  options: [
  {
    "String": {
      "name": "id",
      "description": "ID do usuario banido",
      "required": true
    }
  },
  {
    "String": {
      "name": "motivo",
      "description": "Motivo do desbanimento",
      "required": false
    }
  }
],
  runSlash: async (client, interaction) => {
    const id = interaction.options.getString("id");
    const reason = interaction.options.getString("motivo");
    const args = [id, reason].filter(Boolean);
    const mentions = buildMentions();
    return runSlashCommand(client, interaction, "unban", args, mentions);
  }
};
