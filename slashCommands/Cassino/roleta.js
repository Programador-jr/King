const { runSlashCommand } = require("../../handlers/slashCommandUtils");

module.exports = {
  name: "roleta",
  description: "Aposte em cor, paridade ou numero na roleta.",
  options: [
    {
      Integer: {
        name: "aposta",
        description: "Quantidade de moedas apostadas",
        required: false
      }
    },
    {
      String: {
        name: "palpite",
        description: "vermelho, preto, par, impar ou numero entre 0 e 36",
        required: false
      }
    }
  ],
  runSlash: async (client, interaction) => {
    const aposta = interaction.options.getInteger("aposta");
    const palpite = interaction.options.getString("palpite");
    const args = [];
    if (aposta !== null) args.push(String(aposta));
    if (palpite) args.push(palpite);
    return runSlashCommand(client, interaction, "roleta", args);
  }
};
