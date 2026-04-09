const { MessageEmbed } = require("discord.js");
const ee = require("../../botconfig/embed.json");
const {
  assertModerationPermission,
  resolveMember,
  resolveUser,
  sanitizeReason,
  checkHierarchy,
  sendModerationLog
} = require("../../handlers/moderationUtils");

module.exports = {
  name: "ban",
  category: "Moderação",
  aliases: ["banir"],
  description: "Bane um usuário do servidor.",
  usage: "ban @usuario [motivo]",
  cooldown: 2,
  memberpermissions: ["BAN_MEMBERS"],
  requiredroles: [],
  alloweduserids: [],
  guildOnly: true,
  run: async (client, message, args) => {
    if (!assertModerationPermission(client, message)) return;

    const botMember = message.guild.members.me || message.guild.me;
    if (!botMember?.permissions?.has("BAN_MEMBERS")) {
      return message.reply({
        flags: 64,
        embeds: [
          new MessageEmbed()
            .setColor(ee.wrongcolor)
            .setTitle(`${client.allEmojis.x} **Eu não tenho permissão para banir membros.**`)
        ]
      });
    }

    const targetMember = await resolveMember(message, args[0]);
    const targetUser = targetMember?.user || await resolveUser(client, args[0]);

    if (!targetUser) {
      return message.reply({
        embeds: [
          new MessageEmbed()
            .setColor(ee.wrongcolor)
            .setTitle(`${client.allEmojis.x} **Usuário não encontrado.**`)
            .setDescription("Use: `ban @usuario [motivo]`")
        ]
      });
    }

    if (targetMember) {
      const hierarchyError = checkHierarchy(message.member, targetMember, botMember);
      if (hierarchyError) {
        return message.reply({
          embeds: [
            new MessageEmbed()
              .setColor(ee.wrongcolor)
              .setTitle(`${client.allEmojis.x} **Não foi possível banir.**`)
              .setDescription(hierarchyError)
          ]
        });
      }

      if (!targetMember.bannable) {
        return message.reply({
          embeds: [
            new MessageEmbed()
              .setColor(ee.wrongcolor)
              .setTitle(`${client.allEmojis.x} **Não consigo banir este usuário.**`)
          ]
        });
      }
    }

    const reason = sanitizeReason(args.slice(1).join(" "));

    try {
      await message.guild.members.ban(targetUser.id, { reason });

      await message.reply({
        embeds: [
          new MessageEmbed()
            .setColor(ee.color)
            .setTitle(`${client.allEmojis.check_mark} **Usuário banido com sucesso.**`)
            .addField("Usuário", `${targetUser.tag}`, true)
            .addField("Motivo", reason, true)
        ]
      });

      await sendModerationLog(client, message.guild, {
        action: "Banimento",
        moderator: message.author,
        target: targetUser,
        reason,
        channel: message.channel
      });
    } catch (error) {
      console.error("[Ban] Erro:", error);
      return message.reply({
        embeds: [
          new MessageEmbed()
            .setColor(ee.wrongcolor)
            .setTitle(`${client.allEmojis.x} **Não foi possível banir o usuário.**`)
        ]
      });
    }
  }
};
