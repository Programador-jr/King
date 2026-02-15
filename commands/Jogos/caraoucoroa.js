const { MessageEmbed } = require("discord.js");
const ee = require("../../botconfig/embed.json");

const normalizeGuess = (value) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

module.exports = {
  name: "caraoucoroa",
  aliases: ["coinflip", "coroa"],
  usage: "caraoucoroa [cara|coroa]",
  description: "Jogue cara ou coroa.",
  category: "Jogos",
  cooldown: 2,
  run: async (client, message, args) => {
    const guess = normalizeGuess(args[0]);
    const validGuess = guess === "cara" || guess === "coroa" ? guess : null;
    const result = Math.random() < 0.5 ? "cara" : "coroa";

    const embed = new MessageEmbed()
      .setColor(ee.color)
      .setTitle("Cara ou Coroa")
      .addField("Resultado", `**${result}**`, false)
      .setFooter(ee.footertext, ee.footericon);

    if (validGuess) {
      embed.addField("Seu palpite", `\`${validGuess}\``, true);
      embed.addField("Status", validGuess === result ? "Voce acertou!" : "Voce errou!", true);
    } else {
      embed.addField(
        "Dica",
        `Use \`${client.settings.get(message.guild.id, "prefix")}caraoucoroa cara\` para tentar adivinhar.`,
        false
      );
    }

    return message.reply({ embeds: [embed] });
  }
};
