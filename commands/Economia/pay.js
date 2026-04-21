const Discord = require("discord.js");
const ee = require("../../botconfig/embed.json");
const emojis = require("../../botconfig/emojis.json");
const UserCoins = require("../../databases/kingcoin");

module.exports = {
  name: "pay",
  category: "Economia",
  description: "Transfira King Coins para outro usuário.",
  aliases: ["transferir", "give", "enviar", "transfer"],
  run: async (client, message, args, default_prefix) => {
    const senderId = message.author.id;

    const targetUser = message.mentions.users.first();
    if (!targetUser) {
      const embed = new Discord.MessageEmbed()
        .setColor(ee.wrongcolor)
        .setTitle(`${emojis.x} Uso incorreto`)
        .setDescription("Mencione o usuário para quem deseja transferir.\n\n**Uso:** `!pay @usuario <quantia>`")
        .setFooter(ee.footertext, ee.footericon);
      return message.reply({ embeds: [embed] });
    }

    if (targetUser.bot) {
      const embed = new Discord.MessageEmbed()
        .setColor(ee.wrongcolor)
        .setTitle(`${emojis.x} Erro`)
        .setDescription("Você não pode transferir coins para bots!")
        .setFooter(ee.footertext, ee.footericon);
      return message.reply({ embeds: [embed] });
    }

    if (targetUser.id === senderId) {
      const embed = new Discord.MessageEmbed()
        .setColor(ee.wrongcolor)
        .setTitle(`${emojis.x} Erro`)
        .setDescription("Você não pode transferir coins para si mesmo!")
        .setFooter(ee.footertext, ee.footericon);
      return message.reply({ embeds: [embed] });
    }

    const amountStr = args[1];
    if (!amountStr || isNaN(amountStr) || parseInt(amountStr) <= 0) {
      const embed = new Discord.MessageEmbed()
        .setColor(ee.wrongcolor)
        .setTitle(`${emojis.x} Uso incorreto`)
        .setDescription("Informe uma quantia válida.\n\n**Uso:** `!pay @usuario <quantia>`")
        .setFooter(ee.footertext, ee.footericon);
      return message.reply({ embeds: [embed] });
    }

    const amount = parseInt(amountStr);

    const senderData = await UserCoins.findOne({ userId: senderId });
    const senderBalance = senderData?.coins || 0;

    if (senderBalance < amount) {
      const embed = new Discord.MessageEmbed()
        .setColor(ee.wrongcolor)
        .setTitle(`${emojis.x} Saldo insuficiente`)
        .setDescription(`Você tem **${senderBalance}** ${emojis.King_Coin}.\nNecesita de **${amount}** para completar a transferência.`)
        .setFooter(ee.footertext, ee.footericon);
      return message.reply({ embeds: [embed] });
    }

    await UserCoins.findOneAndUpdate(
      { userId: senderId },
      { $inc: { coins: -amount } }
    );

    const targetData = await UserCoins.findOne({ userId: targetUser.id });
    if (targetData) {
      await UserCoins.findOneAndUpdate(
        { userId: targetUser.id },
        { $inc: { coins: amount } }
      );
    } else {
      await UserCoins.create({
        userId: targetUser.id,
        coins: amount,
        totalEarned: amount
      });
    }

    const newSenderBalance = senderBalance - amount;
    const newTargetBalance = (targetData?.coins || 0) + amount;

    const embed = new Discord.MessageEmbed()
      .setColor(ee.color)
      .setAuthor(`${message.author.tag}`, message.author.displayAvatarURL({ dynamic: true, size: 2048 }))
      .setTitle(`${emojis.check_mark} Transferência realizada!`)
      .setDescription(`${message.author} transferiu **${amount.toLocaleString()}** ${emojis.King_Coin} para ${targetUser}`)
      .addField("Seu novo saldo", `**${newSenderBalance.toLocaleString()}** ${emojis.King_Coin}`, true)
      .addField(`Saldo de ${targetUser.username}`, `**${newTargetBalance.toLocaleString()}** ${emojis.King_Coin}`, true)
      .setFooter(ee.footertext, ee.footericon);

    message.reply({ embeds: [embed] });
  }
};