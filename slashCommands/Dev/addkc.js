const { runSlashCommand, buildMentions } = require("../../handlers/slashCommandUtils");

module.exports = {
  name: "addkc",
  description: "Adiciona KC a um usuario.",
  options: [
    {
      User: {
        name: "usuario",
        description: "Usuario que recebera KC",
        required: true
      }
    },
    {
      Integer: {
        name: "quantia",
        description: "Quantidade de KC",
        required: true
      }
    }
  ],
  runSlash: async (client, interaction) => {
    const user = interaction.options.getUser("usuario");
    const amount = interaction.options.getInteger("quantia");
    const mentions = buildMentions({ users: [user] });
    return runSlashCommand(client, interaction, "addkc", [user?.id, String(amount)].filter(Boolean), mentions);
  }
};
