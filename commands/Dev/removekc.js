const emojis = require("../../botconfig/emojis.json");
const { isDeveloper, removeKingCoins } = require("../../handlers/devUtils");

module.exports = {
  name: "removekc",
  aliases: ["takekc", "removecoin"],
  category: "Dev",
  description: "Remove KC de um usuario.",
  usage: "removekc <@usuario|id> <quantia>",
  cooldown: 1,
  run: async (client, message, args) => {
    if (!isDeveloper(message.author.id)) {
      return message.reply(`${client.allEmojis.x} Comando restrito aos desenvolvedores.`);
    }

    const targetUser = message.mentions.users.first() || await client.users.fetch(args[0]).catch(() => null);
    const amount = parseInt(args[1], 10);
    if (!targetUser || !Number.isInteger(amount) || amount <= 0) {
      return message.reply(`${client.allEmojis.x} Uso invalido. Use: \`removekc <@usuario|id> <quantia>\``);
    }

    const result = await removeKingCoins({ client, targetId: targetUser.id, amount, executorId: message.author.id });
    if (!result.ok) {
      return message.reply(`${client.allEmojis.x} Saldo insuficiente. O usuario possui apenas **${result.currentBalance.toLocaleString()}** ${emojis.King_Coin}.`);
    }

    return message.reply(`${client.allEmojis.check_mark} **${result.targetUser?.tag || targetUser.id}** perdeu **${amount.toLocaleString()}** ${emojis.King_Coin} | Saldo: **${result.newBalance.toLocaleString()}** ${emojis.King_Coin}`);
  }
};
