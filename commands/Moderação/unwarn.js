const { MessageEmbed } = require("discord.js");
const ee = require("../../botconfig/embed.json");
const Warnings = require("../../databases/warnings");
const {
  assertModerationPermission,
  resolveMember,
  sanitizeReason,
  sendModerationLog
} = require("../../handlers/moderationUtils");

module.exports = {
  name: "unwarn",
  category: "Moderação",
  aliases: ["removeraviso"],
  description: "Remove um aviso de um usuário.",
  usage: "unwarn @usuario <numero> [motivo]",
  cooldown: 2,
  memberpermissions: ["MANAGE_ROLES"],
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

    const targetMember = await resolveMember(message, args[0]);
    if (!targetMember) {
      return message.reply({
        embeds: [
          new MessageEmbed()
            .setColor(ee.wrongcolor)
            .setTitle(`${client.allEmojis.x} **Usuário não encontrado.**`)
            .setDescription("Use: `unwarn @usuario <numero> [motivo]`")
        ]
      });
    }

    const index = parseInt(args[1], 10);
    if (!index || index < 1) {
      return message.reply({
        embeds: [
          new MessageEmbed()
            .setColor(ee.wrongcolor)
            .setTitle(`${client.allEmojis.x} **Informe o número do aviso.**`)
            .setDescription("Use: `unwarn @usuario <numero>`")
        ]
      });
    }

    try {
      const doc = await Warnings.findOne({ guildId: message.guild.id, userId: targetMember.id });
      const warnings = doc?.warnings || [];

      if (warnings.length === 0) {
        return message.reply({
          embeds: [
            new MessageEmbed()
              .setColor(ee.wrongcolor)
              .setTitle(`${client.allEmojis.x} **Este usuário não possui avisos.**`)
          ]
        });
      }

      if (index > warnings.length) {
        return message.reply({
          embeds: [
            new MessageEmbed()
              .setColor(ee.wrongcolor)
              .setTitle(`${client.allEmojis.x} **Número de aviso inválido.**`)
          ]
        });
      }

      const removed = warnings.splice(index - 1, 1)[0];

      if (warnings.length === 0) {
        await Warnings.deleteOne({ guildId: message.guild.id, userId: targetMember.id });
      } else {
        doc.warnings = warnings;
        await doc.save();
      }

      const reason = sanitizeReason(args.slice(2).join(" "), "Aviso removido");

      await message.reply({
        embeds: [
          new MessageEmbed()
            .setColor(ee.color)
            .setTitle(`${client.allEmojis.check_mark} **Aviso removido com sucesso.**`)
            .addField("Usuário", `${targetMember.user.tag}`, true)
            .addField("Aviso removido", removed?.reason || "-", false)
        ]
      });

      await sendModerationLog(client, message.guild, {
        action: "Aviso removido",
        moderator: message.author,
        target: targetMember.user,
        reason,
        channel: message.channel
      });
    } catch (error) {
      console.error("[Unwarn] Erro:", error);
      return message.reply({
        embeds: [
          new MessageEmbed()
            .setColor(ee.wrongcolor)
            .setTitle(`${client.allEmojis.x} **Não foi possível remover o aviso.**`)
        ]
      });
    }
  }
};
