const { runSlashCommand, buildMentions } = require("../../handlers/slashCommandUtils");

module.exports = {
  name: "ban",
  description: "Bane um usuario do servidor.",
  options: [
  {
    "User": {
      "name": "usuario",
      "description": "Usuario a banir",
      "required": true
    }
  },
  {
    "String": {
      "name": "motivo",
      "description": "Motivo do banimento",
      "required": false
    }
  }
],
  runSlash: async (client, interaction) => {
    const user = interaction.options.getUser("usuario");
    const member = interaction.options.getMember("usuario");
    const reason = interaction.options.getString("motivo");
    const args = [user?.id, reason].filter(Boolean);
    const mentions = buildMentions({ users: [user], members: [member] });
    return runSlashCommand(client, interaction, "ban", args, mentions);
  }
};
