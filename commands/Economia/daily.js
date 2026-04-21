const Discord = require("discord.js");
const ee = require("../../botconfig/embed.json");
const emojis = require("../../botconfig/emojis.json");
const UserCoins = require("../../databases/kingcoin");

const DAILY_AMOUNT = 100;
const COOLDOWN_MS = 24 * 60 * 60 * 1000;

module.exports = {
  name: "daily",
  category: "Economia",
  description: "Receba sua recompensa diária de King Coins.",
  aliases: ["diario", "daily", "claim"],
  run: async (client, message, args, default_prefix) => {
    const userId = message.author.id;

    let userData = await UserCoins.findOne({ userId });

    if (!userData) {
      userData = await UserCoins.create({ userId, coins: DAILY_AMOUNT, lastDaily: new Date(), totalEarned: DAILY_AMOUNT });
      
      const embed = new Discord.MessageEmbed()
        .setColor(ee.color)
        .setAuthor(`${message.author.tag}`, message.author.displayAvatarURL({ dynamic: true, size: 2048 }))
        .setTitle(`${emojis.King_Coin} Bem-vindo ao King Coin!`)
        .setDescription(`Você recebeu **${DAILY_AMOUNT}** ${emojis.King_Coin} como bônus de boas-vindas!`)
        .addField("Saldo Atual", `**${DAILY_AMOUNT}** ${emojis.King_Coin}`, true)
        .setFooter(ee.footertext, ee.footericon);

      return message.reply({ embeds: [embed] });
    }

    const now = new Date();
    const lastDaily = userData.lastDaily ? new Date(userData.lastDaily) : null;
    
    if (lastDaily && (now - lastDaily) < COOLDOWN_MS) {
      const remainingMs = COOLDOWN_MS - (now - lastDaily);
      const hours = Math.floor(remainingMs / (1000 * 60 * 60));
      const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

      const embed = new Discord.MessageEmbed()
        .setColor(ee.wrongcolor)
        .setAuthor(`${message.author.tag}`, message.author.displayAvatarURL({ dynamic: true, size: 2048 }))
        .setTitle("⏰ Recompensa em cooldown")
        .setDescription(`Você já reivindicou sua recompensa diária!\n\nTente novamente em **${hours}h ${minutes}m**`)
        .setFooter(ee.footertext, ee.footericon);

      return message.reply({ embeds: [embed] });
    }

    await UserCoins.findOneAndUpdate(
      { userId },
      {
        $inc: { coins: DAILY_AMOUNT, totalEarned: DAILY_AMOUNT },
        $set: { lastDaily: now }
      },
      { upsert: true }
    );

    const newBalance = userData.coins + DAILY_AMOUNT;

    const embed = new Discord.MessageEmbed()
      .setColor(ee.color)
      .setAuthor(`${message.author.tag}`, message.author.displayAvatarURL({ dynamic: true, size: 2048 }))
      .setTitle(`Recompensa Diária!`)
      .setDescription(`Você recebeu **${DAILY_AMOUNT}** ${emojis.King_Coin}!`)
      .addField("Novo Saldo", `**${newBalance.toLocaleString()}** ${emojis.King_Coin}`, true)
      .setFooter(ee.footertext, ee.footericon);

    message.reply({ embeds: [embed] });
  }
};