const { runSlashCommand, buildMentions } = require("../../handlers/slashCommandUtils");

module.exports = {
  name: "warnings",
  description: "Lista os avisos de um usuario.",
  options: [
  {
    "User": {
      "name": "usuario",
      "description": "Usuario para listar avisos",
      "required": true
    }
  }
],
  runSlash: async (client, interaction) => {
    const user = interaction.options.getUser("usuario");
    const member = interaction.options.getMember("usuario");
    const args = user ? [user.id] : [];
    const mentions = buildMentions({ users: [user], members: [member] });
    return runSlashCommand(client, interaction, "warnings", args, mentions);
  }
};
