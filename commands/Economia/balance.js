const Discord = require("discord.js");
const ee = require("../../botconfig/embed.json");
const emojis = require("../../botconfig/emojis.json");
const UserCoins = require("../../databases/kingcoin");

module.exports = {
  name: "balance",
  category: "Economia",
  description: "Mostra seu saldo de King Coins.",
  aliases: ["bal", "saldo", "coins"],
  run: async (client, message, args, default_prefix) => {
    const user = message.mentions.users.first() || client.users.cache.get(args[0]) || message.author;
    const guildId = message.guildId;
    const userId = user.id;

    const userData = await UserCoins.findOneOrCreate(userId, guildId);

    const embed = new Discord.MessageEmbed()
      .setColor(ee.color)
      .setAuthor(`${user.tag}`, user.displayAvatarURL({ dynamic: true, size: 2048 }))
      .setTitle(`${emojis.King_Coin} Saldo de King Coins`)
      .addField("Saldo Atual", `**${userData.coins.toLocaleString()}** ${emojis.King_Coin}`, true)
      .addField("Total Ganho", `**${userData.totalEarned.toLocaleString()}** ${emojis.King_Coin}`, true)
      .setFooter(ee.footertext, ee.footericon);

    message.reply({ embeds: [embed] });
  }
};
