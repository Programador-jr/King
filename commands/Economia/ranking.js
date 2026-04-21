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
    const guild = message.guild;

    const globalTop = await UserCoins.find()
      .sort({ coins: -1 })
      .limit(10)
      .lean();

    const guildMembers = await guild.members.fetch();
    const memberIds = [...guildMembers.keys()];
    
    const localUsers = await UserCoins.find({ userId: { $in: memberIds } })
      .sort({ coins: -1 })
      .limit(10)
      .lean();

    if (globalTop.length === 0 && localUsers.length === 0) {
      const embed = new Discord.MessageEmbed()
        .setColor(ee.color)
        .setTitle(`${emojis.King_Coin} Ranking de King Coins`)
        .setDescription("Nenhum usuário registrado ainda!\nUse `!daily` para começar a ganhar!")
        .setFooter(ee.footertext, ee.footericon);
      return message.reply({ embeds: [embed] });
    }

    const medals = ["🥇", "🥈", "🥉"];

    let globalDescription = "";
    for (let i = 0; i < globalTop.length; i++) {
      const user = globalTop[i];
      const rank = medals[i] || `#${i + 1}`;
      const discordUser = await client.users.fetch(user.userId).catch(() => null);
      const username = discordUser ? discordUser.tag : `Unknown (${user.userId})`;
      globalDescription += `${rank} **${username}** — ${user.coins.toLocaleString()} ${emojis.King_Coin}\n`;
    }

    let localDescription = "";
    for (let i = 0; i < localUsers.length; i++) {
      const user = localUsers[i];
      const rank = medals[i] || `#${i + 1}`;
      const discordUser = await client.users.fetch(user.userId).catch(() => null);
      const username = discordUser ? discordUser.tag : `Unknown (${user.userId})`;
      localDescription += `${rank} **${username}** — ${user.coins.toLocaleString()} ${emojis.King_Coin}\n`;
    }

    const currentUserData = await UserCoins.findOne({ userId: message.author.id });
    const globalPos = globalTop.findIndex(u => u.userId === message.author.id) + 1;
    const localPos = localUsers.findIndex(u => u.userId === message.author.id) + 1;

    const embed = new Discord.MessageEmbed()
      .setColor(ee.color)
      .setTitle(`Ranking de King Coins`)
      .setDescription(`🌍 **Top 10 Global**\n${globalDescription || "Nenhum usuário"}\n🏠 **Top 10 do Servidor**\n${localDescription || "Nenhum usuário deste servidor"}`)
      .addField("Sua posição", 
        `${currentUserData ? 
          `Global: **#${globalPos || "N/A"}** | Servidor: **#${localPos || "N/A"}**` : 
          "Você ainda não tem coins"}`, 
        false)
      .setFooter(ee.footertext, ee.footericon);

    message.reply({ embeds: [embed] });
  }
};