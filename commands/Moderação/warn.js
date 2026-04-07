const { MessageEmbed } = require("discord.js");
const ee = require("../../botconfig/embed.json");
const Warnings = require("../../databases/warnings");
const {
  assertModerationPermission,
  resolveMember,
  sanitizeReason,
  checkHierarchy,
  sendModerationLog
} = require("../../handlers/moderationUtils");

module.exports = {
  name: "warn",
  category: "Moderação",
  aliases: ["aviso"],
  description: "Aplica um aviso a um usuário.",
  usage: "warn @usuario [motivo]",
  cooldown: 2,
  memberpermissions: [],
  requiredroles: [],
  alloweduserids: [],
  guildOnly: true,
  run: async (client, message, args) => {
    if (!assertModerationPermission(client, message)) return;

    const targetMember = await resolveMember(message, args[0]);
    if (!targetMember) {
      return message.reply({
        embeds: [
          new MessageEmbed()
            .setColor(ee.wrongcolor)
            .setTitle(`${client.allEmojis.x} **Usuário não encontrado.**`)
            .setDescription("Use: `warn @usuario [motivo]`")
        ]
      });
    }

    const botMember = message.guild.members.me || message.guild.me;
    const hierarchyError = checkHierarchy(message.member, targetMember, botMember);
    if (hierarchyError) {
      return message.reply({
        embeds: [
          new MessageEmbed()
            .setColor(ee.wrongcolor)
            .setTitle(`${client.allEmojis.x} **Não foi possível avisar.**`)
            .setDescription(hierarchyError)
        ]
      });
    }

    const reason = sanitizeReason(args.slice(1).join(" "));
    const warningEntry = {
      id: `${Date.now()}`,
      reason,
      moderatorId: message.author.id,
      moderatorTag: message.author.tag,
      createdAt: new Date()
    };

    try {
      const doc = await Warnings.findOneAndUpdate(
        { guildId: message.guild.id, userId: targetMember.id },
        { $push: { warnings: warningEntry } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      const totalWarnings = doc?.warnings?.length || 1;

      await message.reply({
        embeds: [
          new MessageEmbed()
            .setColor(ee.color)
            .setTitle(`${client.allEmojis.check_mark} **Aviso aplicado com sucesso.**`)
            .addField("Usuário", `${targetMember.user.tag}`, true)
            .addField("Total de avisos", String(totalWarnings), true)
            .addField("Motivo", reason, false)
        ]
      });

      targetMember.user.send({
        embeds: [
          new MessageEmbed()
            .setColor(ee.color)
            .setTitle("Você recebeu um aviso")
            .setDescription(`Servidor: **${message.guild.name}**`)
            .addField("Motivo", reason, false)
        ]
      }).catch(() => {});

      await sendModerationLog(client, message.guild, {
        action: "Aviso",
        moderator: message.author,
        target: targetMember.user,
        reason,
        channel: message.channel
      });
    } catch (error) {
      console.error("[Warn] Erro:", error);
      return message.reply({
        embeds: [
          new MessageEmbed()
            .setColor(ee.wrongcolor)
            .setTitle(`${client.allEmojis.x} **Não foi possível aplicar o aviso.**`)
        ]
      });
    }
  }
};
