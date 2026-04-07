const { MessageEmbed } = require("discord.js");
const ee = require("../../botconfig/embed.json");
const {
  assertModerationPermission,
  sanitizeReason,
  sendModerationLog
} = require("../../handlers/moderationUtils");

module.exports = {
  name: "slowmode",
  category: "Moderação",
  aliases: ["modo-lento"],
  description: "Define o modo lento do canal.",
  usage: "slowmode <segundos|off> [motivo]",
  cooldown: 2,
  memberpermissions: [],
  requiredroles: [],
  alloweduserids: [],
  guildOnly: true,
  run: async (client, message, args) => {
    if (!assertModerationPermission(client, message)) return;

    const botMember = message.guild.members.me || message.guild.me;
    if (!botMember?.permissions?.has("MANAGE_CHANNELS")) {
      return message.reply({
        embeds: [
          new MessageEmbed()
            .setColor(ee.wrongcolor)
            .setTitle(`${client.allEmojis.x} **Eu não tenho permissão para gerenciar canais.**`)
        ]
      });
    }

    if (!args[0]) {
      return message.reply({
        embeds: [
          new MessageEmbed()
            .setColor(ee.wrongcolor)
            .setTitle(`${client.allEmojis.x} **Informe o tempo em segundos ou off.**`)
            .setDescription("Use: `slowmode <segundos|off>`")
        ]
      });
    }

    const raw = String(args[0]).toLowerCase();
    const seconds = raw === "off" ? 0 : parseInt(raw, 10);
    if (Number.isNaN(seconds) || seconds < 0 || seconds > 21600) {
      return message.reply({
        embeds: [
          new MessageEmbed()
            .setColor(ee.wrongcolor)
            .setTitle(`${client.allEmojis.x} **O tempo deve estar entre 0 e 21600 segundos.**`)
        ]
      });
    }

    const reason = sanitizeReason(args.slice(1).join(" "));

    try {
      await message.channel.setRateLimitPerUser(seconds, reason);

      const status = seconds === 0 ? "desativado" : `${seconds}s`;

      await message.reply({
        embeds: [
          new MessageEmbed()
            .setColor(ee.color)
            .setTitle(`${client.allEmojis.check_mark} **Modo lento atualizado.**`)
            .addField("Valor", status, true)
            .addField("Motivo", reason, true)
        ]
      });

      await sendModerationLog(client, message.guild, {
        action: "Modo lento",
        moderator: message.author,
        reason,
        duration: status,
        channel: message.channel
      });
    } catch (error) {
      console.error("[Slowmode] Erro:", error);
      return message.reply({
        embeds: [
          new MessageEmbed()
            .setColor(ee.wrongcolor)
            .setTitle(`${client.allEmojis.x} **Não foi possível alterar o modo lento.**`)
        ]
      });
    }
  }
};
