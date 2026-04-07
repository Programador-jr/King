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
  name: "unmute",
  category: "Moderação",
  aliases: ["untimeout", "desmutar"],
  description: "Remove o silenciamento de um usuário.",
  usage: "unmute @usuario [motivo]",
  cooldown: 2,
  memberpermissions: [],
  requiredroles: [],
  alloweduserids: [],
  guildOnly: true,
  run: async (client, message, args) => {
    if (!assertModerationPermission(client, message)) return;

    const botMember = message.guild.members.me || message.guild.me;
    if (!botMember?.permissions?.has("MODERATE_MEMBERS")) {
      return message.reply({
        embeds: [
          new MessageEmbed()
            .setColor(ee.wrongcolor)
            .setTitle(`${client.allEmojis.x} **Eu não tenho permissão para remover silenciamentos.**`)
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
            .setDescription("Use: `unmute @usuario [motivo]`")
        ]
      });
    }

    const hierarchyError = checkHierarchy(message.member, targetMember, botMember);
    if (hierarchyError) {
      return message.reply({
        embeds: [
          new MessageEmbed()
            .setColor(ee.wrongcolor)
            .setTitle(`${client.allEmojis.x} **Não foi possível remover o silêncio.**`)
            .setDescription(hierarchyError)
        ]
      });
    }

    if (!targetMember.moderatable) {
      return message.reply({
        embeds: [
          new MessageEmbed()
            .setColor(ee.wrongcolor)
            .setTitle(`${client.allEmojis.x} **Não consigo remover o silêncio deste usuário.**`)
        ]
      });
    }

    const reason = sanitizeReason(args.slice(1).join(" "));

    try {
      await targetMember.timeout(null, reason);

      await message.reply({
        embeds: [
          new MessageEmbed()
            .setColor(ee.color)
            .setTitle(`${client.allEmojis.check_mark} **Silenciamento removido com sucesso.**`)
            .addField("Usuário", `${targetMember.user.tag}`, true)
            .addField("Motivo", reason, true)
        ]
      });

      await sendModerationLog(client, message.guild, {
        action: "Remoção de silêncio",
        moderator: message.author,
        target: targetMember.user,
        reason,
        channel: message.channel
      });
    } catch (error) {
      console.error("[Unmute] Erro:", error);
      return message.reply({
        embeds: [
          new MessageEmbed()
            .setColor(ee.wrongcolor)
            .setTitle(`${client.allEmojis.x} **Não foi possível remover o silenciamento.**`)
        ]
      });
    }
  }
};
