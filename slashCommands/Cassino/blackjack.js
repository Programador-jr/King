const { runSlashCommand } = require("../../handlers/slashCommandUtils");

module.exports = {
  name: "blackjack",
  description: "Jogue blackjack contra a banca.",
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
    return runSlashCommand(client, interaction, "blackjack", args);
  }
};
