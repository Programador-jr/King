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
    },
    {
      StringChoices: {
        name: "estrategia",
        description: "Quando a mesa para de comprar cartas",
        required: false,
        choices: [
          ["seguro", "seguro"],
          ["padrao", "padrao"],
          ["agressivo", "agressivo"]
        ]
      }
    }
  ],
  runSlash: async (client, interaction) => {
    const aposta = interaction.options.getInteger("aposta");
    const estrategia = interaction.options.getString("estrategia");
    const args = [];
    if (aposta !== null) args.push(String(aposta));
    if (estrategia) args.push(estrategia);
    return runSlashCommand(client, interaction, "blackjack", args);
  }
};
