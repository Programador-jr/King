const { MessageEmbed } = require("discord.js");
const ee = require("../../botconfig/embed.json");
const {
  assertModerationPermission,
  sanitizeReason,
  sendModerationLog
} = require("../../handlers/moderationUtils");

module.exports = {
  name: "lock",
  category: "Moderação",
  aliases: ["travar"],
  description: "Trava o canal atual para o @everyone.",
  usage: "lock [motivo]",
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

    const reason = sanitizeReason(args.join(" "));

    try {
      await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, {
        SendMessages: false
      }, { reason });

      await message.reply({
        embeds: [
          new MessageEmbed()
            .setColor(ee.color)
            .setTitle(`${client.allEmojis.check_mark} **Canal travado com sucesso.**`)
            .addField("Motivo", reason, false)
        ]
      });

      await sendModerationLog(client, message.guild, {
        action: "Canal travado",
        moderator: message.author,
        reason,
        channel: message.channel
      });
    } catch (error) {
      console.error("[Lock] Erro:", error);
      return message.reply({
        embeds: [
          new MessageEmbed()
            .setColor(ee.wrongcolor)
            .setTitle(`${client.allEmojis.x} **Não foi possível travar o canal.**`)
        ]
      });
    }
  }
};
