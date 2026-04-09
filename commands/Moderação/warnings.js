const { MessageEmbed } = require("discord.js");
const ee = require("../../botconfig/embed.json");
const Warnings = require("../../databases/warnings");
const {
  assertModerationPermission,
  resolveMember
} = require("../../handlers/moderationUtils");

module.exports = {
  name: "warnings",
  category: "Moderação",
  aliases: ["avisos", "warns"],
  description: "Lista os avisos de um usuário.",
  usage: "warnings @usuario",
  cooldown: 2,
  memberpermissions: ["VIEW_AUDIT_LOG"],
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
            .setDescription("Use: `warnings @usuario`")
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
              .setColor(ee.color)
              .setTitle(`${client.allEmojis.check_mark} **Nenhum aviso encontrado.**`)
          ]
        });
      }

      const limit = 15;
      const startIndex = Math.max(0, warnings.length - limit);
      const recentWarnings = warnings.slice(startIndex);

      const lines = recentWarnings.map((warning, idx) => {
        const number = startIndex + idx + 1;
        const date = warning.createdAt ? new Date(warning.createdAt).toLocaleString("pt-BR") : "-";
        return `\`${number}\` • **${warning.reason}** — ${warning.moderatorTag} • ${date}`;
      });

      const footerText = warnings.length > limit
        ? `Mostrando últimos ${limit} de ${warnings.length} avisos.`
        : `${warnings.length} aviso(s) registrados.`;

      return message.reply({
        embeds: [
          new MessageEmbed()
            .setColor(ee.color)
            .setTitle(`Avisos de ${targetMember.user.tag}`)
            .setDescription(lines.join("\n"))
            .setFooter(footerText)
        ]
      });
    } catch (error) {
      console.error("[Warnings] Erro:", error);
      return message.reply({
        embeds: [
          new MessageEmbed()
            .setColor(ee.wrongcolor)
            .setTitle(`${client.allEmojis.x} **Não foi possível obter os avisos.**`)
        ]
      });
    }
  }
};
