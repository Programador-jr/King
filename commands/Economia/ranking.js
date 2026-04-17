const Discord = require("discord.js");
const ee = require("../../botconfig/embed.json");
const emojis = require("../../botconfig/emojis.json");
const UserCoins = require("../../databases/kingcoin");

module.exports = {
  name: "ranking",
  category: "Economia",
  description: "Veja o ranking dos maiores detentores de King Coins.",
  aliases: ["lb", "leaderboard", "top", "rank"],
  run: async (client, message, args, default_prefix) => {
    const guildId = message.guildId;

    const topUsers = await UserCoins.find({ guildId })
      .sort({ coins: -1 })
      .limit(10)
      .lean();

    if (topUsers.length === 0) {
      const embed = new Discord.MessageEmbed()
        .setColor(ee.color)
        .setTitle(`${emojis.King_Coin} Leaderboard de King Coins`)
        .setDescription("Nenhum usuário registrado ainda!\nUse `!daily` para começar a ganhar!")
        .setFooter(ee.footertext, ee.footericon);
      return message.reply({ embeds: [embed] });
    }

    const medals = ["🥇", "🥈", "🥉"];

    let description = "";
    for (let i = 0; i < topUsers.length; i++) {
      const user = topUsers[i];
      const rank = medals[i] || `#${i + 1}`;
      const discordUser = await client.users.fetch(user.userId).catch(() => null);
      const username = discordUser ? discordUser.tag : `Unknown (${user.userId})`;
      description += `${rank} **${username}** — ${user.coins.toLocaleString()} ${emojis.King_Coin}\n`;
    }

    const currentUserData = await UserCoins.findOne({ userId: message.author.id, guildId });

    const embed = new Discord.MessageEmbed()
      .setColor(ee.color)
      .setAuthor(`${emojis.King_Coin} Leaderboard de King Coins`, message.guild.iconURL({ dynamic: true }))
      .setDescription(description)
      .addField("Sua posição", currentUserData ? `**${topUsers.findIndex(u => u.userId === message.author.id) + 1 || "N/A"}º** com **${currentUserData.coins.toLocaleString()}** ${emojis.King_Coin}` : "Você ainda não tem coins", true)
      .setFooter(ee.footertext, ee.footericon);

    message.reply({ embeds: [embed] });
  }
};
