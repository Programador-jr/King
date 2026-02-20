const Discord = require("discord.js");
const ee = require("../../botconfig/embed.json");
const crypto = require("crypto");

module.exports = {
  name: "ship",
  aliases: ["compatibilidade", "casal"],
  category: "Diversão",
  description: "Calcula a compatibilidade entre dois usuários.",
  usage: "ship @user1 @user2",
  cooldown: "3",

  run: async (client, message, args) => {

    const mentions = message.mentions.users;

    if (mentions.size === 0) {
      const embed = new Discord.MessageEmbed()
        .setColor(ee.wrongcolor)
        .setDescription("**❌ Você precisa mencionar dois usuários para shippar.**");
      return message.reply({ embeds: [embed] });
    }

    const user1 = mentions.first();
    const user2 = mentions.size > 1 ? mentions.last() : mentions.first();

    if (user1.bot || user2.bot) {
      const embed = new Discord.MessageEmbed()
        .setColor(ee.wrongcolor)
        .setDescription("**Não é possível shippar bots 🤖**")
      return message.reply({ embeds: [embed] });
    }

    if (user1.id === user2.id) {
      const embed = new Discord.MessageEmbed()
        .setColor(ee.wrongcolor)
        .setDescription("**😳 Auto amor é importante... mas vamos com calma.**")
      return message.reply({ embeds: [embed] });
    }

    const combined = [user1.id, user2.id].sort().join("-");
    const hash = crypto.createHash("md5").update(combined).digest("hex");
    const percentage = parseInt(hash.substring(0, 2), 16) % 101;

    const name1 = user1.username;
    const name2 = user2.username;

    const shipName =
      name1.substring(0, Math.ceil(name1.length / 2)) +
      name2.substring(Math.floor(name2.length / 2));

    const filled = Math.round(percentage / 10);
    const empty = 10 - filled;
    const bar = "❤️".repeat(filled) + "🖤".repeat(empty);

    let status;

    if (percentage >= 90) status = "💍 Casamento marcado!";
    else if (percentage >= 70) status = "💘 Química forte!";
    else if (percentage >= 50) status = "😊 Pode dar certo!";
    else if (percentage >= 30) status = "🤔 Talvez com esforço...";
    else status = "💀 Melhor serem só amigos.";

    const embed = new Discord.MessageEmbed()
      .setColor(ee.color)
      .setTitle("💘 Resultado do Ship")
      .setDescription(
        `**${user1.username} + ${user2.username}**\n\n` +
        `💞 Nome do casal: **${shipName}**\n\n` +
        `📊 Compatibilidade: **${percentage}%**\n` +
        `${bar}\n\n` +
        `${status}`
      )
      .setFooter(ee.footertext, ee.footericon);

    await message.reply({ embeds: [embed] });
  }
};