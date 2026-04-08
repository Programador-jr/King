const { MessageEmbed } = require("discord.js");
const ee = require("../../botconfig/embed.json");
const {
  assertModerationPermission,
  resolveMember,
  sanitizeReason,
  checkHierarchy,
  sendModerationLog
} = require("../../handlers/moderationUtils");

module.exports = {
  name: "kick",
  category: "Moderação",
  aliases: ["expulsar"],
  description: "Expulsa um usuário do servidor.",
  usage: "kick @usuario [motivo]",
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
    if (!botMember?.permissions?.has("KICK_MEMBERS")) {
      return message.reply({
        flags: 64,
        embeds: [
          new MessageEmbed()
            .setColor(ee.wrongcolor)
            .setTitle(`${client.allEmojis.x} **Eu não tenho permissão para expulsar membros.**`)
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
            .setDescription("Use: `kick @usuario [motivo]`")
        ]
      });
    }

    const hierarchyError = checkHierarchy(message.member, targetMember, botMember);
    if (hierarchyError) {
      return message.reply({
        embeds: [
          new MessageEmbed()
            .setColor(ee.wrongcolor)
            .setTitle(`${client.allEmojis.x} **Não foi possível expulsar.**`)
            .setDescription(hierarchyError)
        ]
      });
    }

    if (!targetMember.kickable) {
      return message.reply({
        embeds: [
          new MessageEmbed()
            .setColor(ee.wrongcolor)
            .setTitle(`${client.allEmojis.x} **Não consigo expulsar este usuário.**`)
        ]
      });
    }

    const reason = sanitizeReason(args.slice(1).join(" "));

    try {
      await targetMember.kick(reason);

      await message.reply({
        embeds: [
          new MessageEmbed()
            .setColor(ee.color)
            .setTitle(`${client.allEmojis.check_mark} **Usuário expulso com sucesso.**`)
            .addField("Usuário", `${targetMember.user.tag}`, true)
            .addField("Motivo", reason, true)
        ]
      });

      await sendModerationLog(client, message.guild, {
        action: "Expulsão",
        moderator: message.author,
        target: targetMember.user,
        reason,
        channel: message.channel
      });
    } catch (error) {
      console.error("[Kick] Erro:", error);
      return message.reply({
        embeds: [
          new MessageEmbed()
            .setColor(ee.wrongcolor)
            .setTitle(`${client.allEmojis.x} **Não foi possível expulsar o usuário.**`)
        ]
      });
    }
  }
};
