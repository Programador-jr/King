const { isDeveloper, revokeBotBan } = require("../../handlers/devUtils");

module.exports = {
  name: "devunban",
  aliases: ["botunban", "kingunban"],
  category: "Dev",
  description: "Remove o ban global de um usuario no bot.",
  usage: "devunban <@usuario|id>",
  cooldown: 1,
  run: async (client, message, args) => {
    if (!isDeveloper(message.author.id)) {
      return message.reply(`${client.allEmojis.x} Comando restrito aos desenvolvedores.`);
    }

    const targetUser = message.mentions.users.first() || await client.users.fetch(args[0]).catch(() => null);
    const targetId = targetUser?.id || args[0];
    if (!targetId) {
      return message.reply(`${client.allEmojis.x} Informe um usuario ou id valido.`);
    }

    const result = await revokeBotBan({ client, targetId, executorId: message.author.id });
    if (!result.deleted) {
      return message.reply(`${client.allEmojis.x} Este usuario nao estava banido do bot.`);
    }

    return message.reply(`${client.allEmojis.check_mark} **${result.targetUser?.tag || targetId}** desbanido do King.`);
  }
};
