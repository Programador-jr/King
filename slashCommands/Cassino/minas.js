const { runSlashCommand } = require("../../handlers/slashCommandUtils");

module.exports = {
  name: "minas",
  description: "Abra casas interativamente e tente evitar as minas.",
  options: [
    {
      Integer: {
        name: "aposta",
        description: "Quantidade de moedas apostadas",
        required: false
      }
    },
    {
      Integer: {
        name: "minas",
        description: "Quantidade de minas no tabuleiro",
        required: false
      }
    },
    {
      Integer: {
        name: "tamanho",
        description: "Tamanho do tabuleiro: 3, 4 ou 5",
        required: false
      }
    }
  ],
  runSlash: async (client, interaction) => {
    const aposta = interaction.options.getInteger("aposta");
    const minas = interaction.options.getInteger("minas");
    const tamanho = interaction.options.getInteger("tamanho");
    const args = [];
    if (aposta !== null) args.push(String(aposta));
    if (minas !== null) args.push(String(minas));
    if (tamanho !== null) args.push(String(tamanho));
    return runSlashCommand(client, interaction, "minas", args);
  }
};
