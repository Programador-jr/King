const { MessageEmbed } = require("discord.js");
const ee = require("../../botconfig/embed.json");
const {
  assertModerationPermission,
  sanitizeReason,
  sendModerationLog
} = require("../../handlers/moderationUtils");

module.exports = {
  name: "unlock",
  category: "Moderação",
  aliases: ["destravar"],
  description: "Destrava o canal atual para o @everyone.",
  usage: "unlock [motivo]",
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
        SendMessages: null
      }, { reason });

      await message.reply({
        embeds: [
          new MessageEmbed()
            .setColor(ee.color)
            .setTitle(`${client.allEmojis.check_mark} **Canal destravado com sucesso.**`)
            .addField("Motivo", reason, false)
        ]
      });

      await sendModerationLog(client, message.guild, {
        action: "Canal destravado",
        moderator: message.author,
        reason,
        channel: message.channel
      });
    } catch (error) {
      console.error("[Unlock] Erro:", error);
      return message.reply({
        embeds: [
          new MessageEmbed()
            .setColor(ee.wrongcolor)
            .setTitle(`${client.allEmojis.x} **Não foi possível destravar o canal.**`)
        ]
      });
    }
  }
};
