const { runSlashCommand, buildMentions } = require("../../handlers/slashCommandUtils");

module.exports = {
  name: "unban",
  description: "Remove o ban global de um usuario no bot.",
  options: [
    {
      User: {
        name: "usuario",
        description: "Usuario a desbanir do bot",
        required: true
      }
    }
  ],
  runSlash: async (client, interaction) => {
    const user = interaction.options.getUser("usuario");
    const args = [user?.id].filter(Boolean);
    const mentions = buildMentions({ users: [user] });
    return runSlashCommand(client, interaction, "devunban", args, mentions);
  }
};
