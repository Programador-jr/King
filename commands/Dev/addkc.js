const emojis = require("../../botconfig/emojis.json");
const { isDeveloper, addKingCoins } = require("../../handlers/devUtils");

module.exports = {
  name: "addkc",
  aliases: ["givekc", "addcoin"],
  category: "Dev",
  description: "Adiciona KC a um usuario.",
  usage: "addkc <@usuario|id> <quantia>",
  cooldown: 1,
  run: async (client, message, args) => {
    if (!isDeveloper(message.author.id)) {
      return message.reply(`${client.allEmojis.x} Comando restrito aos desenvolvedores.`);
    }

    const targetUser = message.mentions.users.first() || await client.users.fetch(args[0]).catch(() => null);
    const amount = parseInt(args[1], 10);
    if (!targetUser || !Number.isInteger(amount) || amount <= 0) {
      return message.reply(`${client.allEmojis.x} Uso invalido. Use: \`addkc <@usuario|id> <quantia>\``);
    }

    const result = await addKingCoins({ client, targetId: targetUser.id, amount, executorId: message.author.id });
    return message.reply(`${client.allEmojis.check_mark} **${result.targetUser?.tag || targetUser.id}** recebeu **${amount.toLocaleString()}** ${emojis.King_Coin} | Saldo: **${result.newBalance.toLocaleString()}** ${emojis.King_Coin}`);
  }
};
