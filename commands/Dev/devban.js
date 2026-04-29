const { isDeveloper, applyBotBan, parseDurationInput } = require("../../handlers/devUtils");

module.exports = {
  name: "devban",
  aliases: ["botban", "kingban"],
  category: "Dev",
  description: "Bane um usuario de usar o bot globalmente.",
  usage: "devban <@usuario|id> [tempo] <motivo>",
  cooldown: 1,
  run: async (client, message, args) => {
    if (!isDeveloper(message.author.id)) {
      return message.reply(`${client.allEmojis.x} Comando restrito aos desenvolvedores.`);
    }

    const targetUser = message.mentions.users.first() || await client.users.fetch(args[0]).catch(() => null);
    if (!targetUser) {
      return message.reply(`${client.allEmojis.x} Usuario nao encontrado. Uso: \`devban <@usuario|id> [tempo] <motivo>\``);
    }

    if (isDeveloper(targetUser.id)) {
      return message.reply(`${client.allEmojis.x} Nao e permitido banir outro desenvolvedor.`);
    }

    let durationInput = null;
    let reasonIndex = 1;
    
    if (args[1] && !args[1].startsWith("--")) {
      const possibleDuration = args[1];
      const parsed = parseDurationInput(possibleDuration);
      if (parsed.ok) {
        durationInput = possibleDuration;
        reasonIndex = 2;
      }
    }
    
    const reason = args.slice(reasonIndex).join(" ").trim() || "Sem motivo informado.";
    const result = await applyBotBan({ client, targetId: targetUser.id, executorId: message.author.id, reason, durationInput });

    if (!result.ok) {
      return message.reply(`${client.allEmojis.x} ${result.message || "Erro ao banir usuario."}`);
    }

    return message.reply(`${client.allEmojis.check_mark} **${targetUser.tag}** banido do King. Motivo: ${reason} | Duracao: ${result.durationLabel}`);
  }
};
