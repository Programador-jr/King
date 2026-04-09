const { MessageEmbed } = require("discord.js");
const ee = require("../../botconfig/embed.json");
const {
  assertModerationPermission,
  resolveMember,
  sanitizeReason,
  checkHierarchy,
  parseDuration,
  formatDuration,
  sendModerationLog,
  MAX_TIMEOUT_MS
} = require("../../handlers/moderationUtils");

module.exports = {
  name: "mute",
  category: "Moderação",
  aliases: ["timeout"],
  description: "Silencia um usuário temporariamente.",
  usage: "mute @usuario <tempo> [motivo]",
  cooldown: 2,
  memberpermissions: ["MODERATE_MEMBERS"],
  requiredroles: [],
  alloweduserids: [],
  guildOnly: true,
  run: async (client, message, args) => {
    if (!assertModerationPermission(client, message)) return;

    const botMember = message.guild.members.me || message.guild.me;
    if (!botMember?.permissions?.has("MODERATE_MEMBERS")) {
      return message.reply({
        flags: 64,
        embeds: [
          new MessageEmbed()
            .setColor(ee.wrongcolor)
            .setTitle(`${client.allEmojis.x} **Eu não tenho permissão para silenciar membros.**`)
        ]
      });
    }

    const targetMember = await resolveMember(message, args[0]);
    if (!targetMember) {
      return message.reply({
        embeds: [
          new MessageEmbed()
            .setColor(ee.wrongcolor)
            .setTitle(`${client.allEmojis.x} **Usuário não encontrado.**`)
            .setDescription("Use: `mute @usuario <tempo> [motivo]` (ex.: 10m, 2h, 1d)")
        ]
      });
    }

    const hierarchyError = checkHierarchy(message.member, targetMember, botMember);
    if (hierarchyError) {
      return message.reply({
        embeds: [
          new MessageEmbed()
            .setColor(ee.wrongcolor)
            .setTitle(`${client.allEmojis.x} **Não foi possível silenciar.**`)
            .setDescription(hierarchyError)
        ]
      });
    }

    if (!targetMember.moderatable) {
      return message.reply({
        embeds: [
          new MessageEmbed()
            .setColor(ee.wrongcolor)
            .setTitle(`${client.allEmojis.x} **Não consigo silenciar este usuário.**`)
        ]
      });
    }

    const durationMs = parseDuration(args[1]);
    if (!durationMs) {
      return message.reply({
        embeds: [
          new MessageEmbed()
            .setColor(ee.wrongcolor)
            .setTitle(`${client.allEmojis.x} **Tempo inválido.**`)
            .setDescription("Use: `mute @usuario <tempo>` com sufixo s/m/h/d.")
        ]
      });
    }

    if (durationMs > MAX_TIMEOUT_MS) {
      return message.reply({
        embeds: [
          new MessageEmbed()
            .setColor(ee.wrongcolor)
            .setTitle(`${client.allEmojis.x} **O tempo máximo é 28 dias.**`)
        ]
      });
    }

    const reason = sanitizeReason(args.slice(2).join(" "));

    try {
      await targetMember.timeout(durationMs, reason);

      const durationText = formatDuration(durationMs);

      await message.reply({
        embeds: [
          new MessageEmbed()
            .setColor(ee.color)
            .setTitle(`${client.allEmojis.check_mark} **Usuário silenciado com sucesso.**`)
            .addField("Usuário", `${targetMember.user.tag}`, true)
            .addField("Duração", durationText, true)
            .addField("Motivo", reason, false)
        ]
      });

      await sendModerationLog(client, message.guild, {
        action: "Silenciamento",
        moderator: message.author,
        target: targetMember.user,
        reason,
        duration: durationText,
        channel: message.channel
      });
    } catch (error) {
      console.error("[Mute] Erro:", error);
      return message.reply({
        embeds: [
          new MessageEmbed()
            .setColor(ee.wrongcolor)
            .setTitle(`${client.allEmojis.x} **Não foi possível silenciar o usuário.**`)
        ]
      });
    }
  }
};
