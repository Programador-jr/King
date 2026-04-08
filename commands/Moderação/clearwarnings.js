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
  name: "clearwarnings",
  category: "Moderação",
  aliases: ["clearwarns", "limparavisos"],
  description: "Remove todos os avisos de um usuário.",
  usage: "clearwarnings @usuario [motivo]",
  cooldown: 2,
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

    const targetMember = await resolveMember(message, args[0]);
    if (!targetMember) {
      return message.reply({
        embeds: [
          new MessageEmbed()
            .setColor(ee.wrongcolor)
            .setTitle(`${client.allEmojis.x} **Usuário não encontrado.**`)
            .setDescription("Use: `clearwarnings @usuario [motivo]`")
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

      await Warnings.deleteOne({ guildId: message.guild.id, userId: targetMember.id });

      const reason = sanitizeReason(args.slice(1).join(" "), "Avisos removidos");

      await message.reply({
        embeds: [
          new MessageEmbed()
            .setColor(ee.color)
            .setTitle(`${client.allEmojis.check_mark} **Avisos removidos com sucesso.**`)
            .addField("Usuário", `${targetMember.user.tag}`, true)
            .addField("Total removido", String(warnings.length), true)
        ]
      });

      await sendModerationLog(client, message.guild, {
        action: "Avisos limpos",
        moderator: message.author,
        target: targetMember.user,
        reason,
        channel: message.channel
      });
    } catch (error) {
      console.error("[ClearWarnings] Erro:", error);
      return message.reply({
        embeds: [
          new MessageEmbed()
            .setColor(ee.wrongcolor)
            .setTitle(`${client.allEmojis.x} **Não foi possível limpar os avisos.**`)
        ]
      });
    }
  }
};
