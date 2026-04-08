const { runSlashCommand, buildMentions } = require("../../handlers/slashCommandUtils");

module.exports = {
  name: "kick",
  description: "Expulsa um usuario do servidor.",
  options: [
  {
    "User": {
      "name": "usuario",
      "description": "Usuario a expulsar",
      "required": true
    }
  },
  {
    "String": {
      "name": "motivo",
      "description": "Motivo da expulsao",
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
    return runSlashCommand(client, interaction, "kick", args, mentions);
  }
};
