const { runSlashCommand } = require("../../handlers/slashCommandUtils");

module.exports = {
  name: "slots",
  description: "Gire os slots apostando King Coins.",
  options: [
    {
      Integer: {
        name: "aposta",
        description: "Quantidade de moedas apostadas",
        required: false
      }
    }
  ],
  runSlash: async (client, interaction) => {
    const aposta = interaction.options.getInteger("aposta");
    const args = [];
    if (aposta !== null) args.push(String(aposta));
    return runSlashCommand(client, interaction, "slots", args);
  }
};
