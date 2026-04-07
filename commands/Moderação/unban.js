const { MessageEmbed } = require("discord.js");
const ee = require("../../botconfig/embed.json");
const {
  assertModerationPermission,
  resolveUser,
  extractId,
  sanitizeReason,
  sendModerationLog
} = require("../../handlers/moderationUtils");

module.exports = {
  name: "unban",
  category: "Moderação",
  aliases: ["desbanir"],
  description: "Remove o banimento de um usuário.",
  usage: "unban <id> [motivo]",
  cooldown: 2,
  memberpermissions: [],
  requiredroles: [],
  alloweduserids: [],
  guildOnly: true,
  run: async (client, message, args) => {
    if (!assertModerationPermission(client, message)) return;

    const botMember = message.guild.members.me || message.guild.me;
    if (!botMember?.permissions?.has("BAN_MEMBERS")) {
      return message.reply({
        embeds: [
          new MessageEmbed()
            .setColor(ee.wrongcolor)
            .setTitle(`${client.allEmojis.x} **Eu não tenho permissão para desbanir membros.**`)
        ]
      });
    }

    const targetId = extractId(args[0]);
    if (!targetId) {
      return message.reply({
        embeds: [
          new MessageEmbed()
            .setColor(ee.wrongcolor)
            .setTitle(`${client.allEmojis.x} **ID inválido.**`)
            .setDescription("Use: `unban <id> [motivo]`")
        ]
      });
    }

    const reason = sanitizeReason(args.slice(1).join(" "));

    try {
      await message.guild.bans.remove(targetId, reason);
      const targetUser = await resolveUser(client, targetId);

      await message.reply({
        embeds: [
          new MessageEmbed()
            .setColor(ee.color)
            .setTitle(`${client.allEmojis.check_mark} **Usuário desbanido com sucesso.**`)
            .addField("Usuário", targetUser ? targetUser.tag : targetId, true)
            .addField("Motivo", reason, true)
        ]
      });

      await sendModerationLog(client, message.guild, {
        action: "Desbanimento",
        moderator: message.author,
        target: targetUser || { id: targetId, tag: targetId },
        reason,
        channel: message.channel
      });
    } catch (error) {
      console.error("[Unban] Erro:", error);
      return message.reply({
        embeds: [
          new MessageEmbed()
            .setColor(ee.wrongcolor)
            .setTitle(`${client.allEmojis.x} **Não foi possível desbanir o usuário.**`)
        ]
      });
    }
  }
};
