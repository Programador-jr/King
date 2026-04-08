const { runSlashCommand, buildMentions } = require("../../handlers/slashCommandUtils");

module.exports = {
  name: "avatar",
  description: "Mostra o avatar de um usuario.",
  options: [
  {
    "User": {
      "name": "usuario",
      "description": "Usuario (opcional)",
      "required": false
    }
  }
],
  runSlash: async (client, interaction) => {
    const user = interaction.options.getUser("usuario");
    const member = interaction.options.getMember("usuario");
    const args = user ? [user.id] : [];
    const mentions = buildMentions({ users: [user], members: [member] });
    return runSlashCommand(client, interaction, "avatar", args, mentions);
  }
};
