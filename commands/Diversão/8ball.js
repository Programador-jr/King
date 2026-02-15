const Discord = require("discord.js");
const ee = require("../../botconfig/embed.json");

const ANSWERS = [
  "Sim, com certeza.",
  "Nao.",
  "Talvez.",
  "Sem duvida.",
  "Melhor nao contar com isso.",
  "As chances sao boas.",
  "As chances sao baixas.",
  "Pergunte novamente mais tarde.",
  "Sinais apontam que sim.",
  "Meu palpite e nao."
];

module.exports = {
  name: "8ball",
  aliases: ["oraculo", "bola8"],
  category: "Diversão",
  description: "Responde uma pergunta com a bola 8.",
  usage: "8ball <pergunta>",
  cooldown: "3",
  minargs: 1,
  argsmissing_message: "Uso: 8ball <pergunta>",
  run: async (client, message, args) => {
    const question = args.join(" ").trim();
    const answer = ANSWERS[Math.floor(Math.random() * ANSWERS.length)];

    const embed = new Discord.MessageEmbed()
      .setColor(ee.color)
      .setTitle("Bola 8")
      .addField("Pergunta", `>>> ${question}`)
      .addField("Resposta", `>>> ${answer}`)
      .setFooter(ee.footertext, ee.footericon);

    return message.reply({ embeds: [embed] });
  }
};
