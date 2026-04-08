const { runSlashCommand, buildMentions } = require("../../handlers/slashCommandUtils");

module.exports = {
  name: "unwarn",
  description: "Remove um aviso de um usuario.",
  options: [
  {
    "User": {
      "name": "usuario",
      "description": "Usuario",
      "required": true
    }
  },
  {
    "Integer": {
      "name": "numero",
      "description": "Numero do aviso",
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
    const number = interaction.options.getInteger("numero");
    const reason = interaction.options.getString("motivo");
    const args = [user?.id, number !== null ? String(number) : null, reason].filter(Boolean);
    const mentions = buildMentions({ users: [user], members: [member] });
    return runSlashCommand(client, interaction, "unwarn", args, mentions);
  }
};
