const { runSlashCommand, buildMentions } = require("../../handlers/slashCommandUtils");

module.exports = {
  name: "mute",
  description: "Silencia um usuario temporariamente.",
  options: [
  {
    "User": {
      "name": "usuario",
      "description": "Usuario a silenciar",
      "required": true
    }
  },
  {
    "String": {
      "name": "tempo",
      "description": "Duracao (ex: 10m, 2h)",
      "required": true
    }
  },
  {
    "String": {
      "name": "motivo",
      "description": "Motivo do silencio",
      "required": false
    }
  }
],
  runSlash: async (client, interaction) => {
    const user = interaction.options.getUser("usuario");
    const member = interaction.options.getMember("usuario");
    const duration = interaction.options.getString("tempo");
    const reason = interaction.options.getString("motivo");
    const args = [user?.id, duration, reason].filter(Boolean);
    const mentions = buildMentions({ users: [user], members: [member] });
    return runSlashCommand(client, interaction, "mute", args, mentions);
  }
};
