const { MessageEmbed } = require("discord.js");
const ee = require("../../botconfig/embed.json");
const {
  assertModerationPermission,
  sanitizeReason,
  sendModerationLog
} = require("../../handlers/moderationUtils");

module.exports = {
  name: "purge",
  category: "Moderação",
  aliases: ["limpar", "limparchat"],
  description: "Apaga múltiplas mensagens de um canal.",
  usage: "purge <quantidade> [motivo]",
  cooldown: 3,
  memberpermissions: [],
  requiredroles: [],
  alloweduserids: [],
  guildOnly: true,
  run: async (client, message, args) => {
    if (!assertModerationPermission(client, message)) return;

    const botMember = message.guild.members.me || message.guild.me;
    if (!botMember?.permissions?.has("MANAGE_ROLES")) {
      return message.reply({
        flags: 64,
        embeds: [
          new MessageEmbed()
            .setColor(ee.wrongcolor)
            .setTitle(`${client.allEmojis.x} **Eu não tenho permissão para gerenciar cargos.**`)
        ]
      });
    }
    if (!botMember?.permissions?.has("MANAGE_MESSAGES")) {
      return message.reply({
        flags: 64,
        embeds: [
          new MessageEmbed()
            .setColor(ee.wrongcolor)
            .setTitle(`${client.allEmojis.x} **Eu não tenho permissão para gerenciar mensagens.**`)
        ]
      });
    }

    const amount = parseInt(args[0], 10);
    if (!amount || amount < 1 || amount > 100) {
      return message.reply({
        embeds: [
          new MessageEmbed()
            .setColor(ee.wrongcolor)
            .setTitle(`${client.allEmojis.x} **Informe uma quantidade entre 1 e 100.**`)
        ]
      });
    }

    const reason = sanitizeReason(args.slice(1).join(" "));

    try {
      const deleted = await message.channel.bulkDelete(amount, true);

      const confirmation = await message.channel.send({
        embeds: [
          new MessageEmbed()
            .setColor(ee.color)
            .setTitle(`${client.allEmojis.check_mark} **${deleted.size} mensagens apagadas.**`)
        ]
      });

      setTimeout(() => confirmation.delete().catch(() => {}), 4000);

      await sendModerationLog(client, message.guild, {
        action: "Limpeza de chat",
        moderator: message.author,
        reason,
        amount: deleted.size,
        channel: message.channel
      });
    } catch (error) {
      console.error("[Purge] Erro:", error);
      return message.reply({
        embeds: [
          new MessageEmbed()
            .setColor(ee.wrongcolor)
            .setTitle(`${client.allEmojis.x} **Não foi possível apagar as mensagens.**`)
        ]
      });
    }
  }
};
