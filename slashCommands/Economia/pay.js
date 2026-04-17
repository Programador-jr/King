const { runSlashCommand, buildMentions } = require("../../handlers/slashCommandUtils");

module.exports = {
  name: "pay",
  description: "Transfira King Coins para outro usuário.",
  options: [
    {
      "User": {
        "name": "usuario",
        "description": "Usuário para quem deseja transferir",
        "required": true
      }
    },
    {
      "Number": {
        "name": "quantia",
        "description": "Quantidade de King Coins a transferir",
        "required": true
      }
    }
  ],
  runSlash: async (client, interaction) => {
    const user = interaction.options.getUser("usuario");
    const amount = interaction.options.getNumber("quantia");
    const member = interaction.options.getMember("usuario");
    const args = [user.id, amount.toString()];
    const mentions = buildMentions({ users: [user], members: [member] });
    return runSlashCommand(client, interaction, "pay", args, mentions);
  }
};
