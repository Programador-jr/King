const { runSlashCommand, buildMentions } = require("../../handlers/slashCommandUtils");

module.exports = {
  name: "unmute",
  description: "Remove o silencio de um usuario.",
  options: [
  {
    "User": {
      "name": "usuario",
      "description": "Usuario a remover silencio",
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
    const user = interaction.options.getUser("usuario");
    const member = interaction.options.getMember("usuario");
    const reason = interaction.options.getString("motivo");
    const args = [user?.id, reason].filter(Boolean);
    const mentions = buildMentions({ users: [user], members: [member] });
    return runSlashCommand(client, interaction, "unmute", args, mentions);
  }
};
