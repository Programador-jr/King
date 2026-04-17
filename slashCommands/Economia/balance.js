const { runSlashCommand, buildMentions } = require("../../handlers/slashCommandUtils");

module.exports = {
  name: "balance",
  description: "Mostra seu saldo de King Coins.",
  options: [
    {
      "User": {
        "name": "usuario",
        "description": "Usuário para ver o saldo (opcional)",
        "required": false
      }
    }
  ],
  runSlash: async (client, interaction) => {
    const user = interaction.options.getUser("usuario");
    const member = interaction.options.getMember("usuario");
    const args = user ? [user.id] : [];
    const mentions = buildMentions({ users: [user], members: [member] });
    return runSlashCommand(client, interaction, "balance", args, mentions);
  }
};
