const { MessageEmbed, PermissionFlagsBits } = require("discord.js");
const ee = require("../../botconfig/embed.json");
const {
  selectYtMix,
  getMixUsage,
  getMixDescription,
  getMixHelpDetails
} = require("../../handlers/ytMixes");

const ERROR_DELETE_MS = 4000;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const deleteLater = (msg) => {
  if (!msg) return;
  setTimeout(() => msg.delete().catch(() => {}), ERROR_DELETE_MS);
};
const replyError = async (message, payload) => {
  const sent = await message.reply(payload).catch(() => null);
  deleteLater(message);
  deleteLater(sent);
  return sent;
};

module.exports = {
  name: "mix",
  category: "Musica",
  aliases: ["musicmix", "playmix", "playlist", "playmusicmix"],
  usage: getMixUsage(),
  description: getMixDescription(),
  helpDetails: getMixHelpDetails,
  cooldown: 2,
  requiredroles: [],
  alloweduserids: [],

  run: async (client, message, args) => {
    try {
      const { member, channelId, guildId } = message;
      const { guild } = member;
      const voiceChannel = member.voice?.channel;
      const botVoiceChannel = guild.members.me?.voice?.channel ?? guild.me?.voice?.channel;

      if (!voiceChannel) {
        return replyError(message, {
          embeds: [
            new MessageEmbed()
              .setColor(ee.wrongcolor)
              .setTitle(`${client.allEmojis.x} **Por favor junte-se ${botVoiceChannel ? "__ao meu__" : "a um"} Canal de voz primeiro!**`)
          ]
        });
      }

      const me = guild.members.me ?? guild.me ?? guild.members.cache.get(client.user.id);
      const perms = voiceChannel.permissionsFor(me);
      if (!perms?.has(PermissionFlagsBits.Connect) || !perms?.has(PermissionFlagsBits.Speak)) {
        return replyError(message, {
          embeds: [
            new MessageEmbed()
              .setColor(ee.wrongcolor)
              .setTitle(`${client.allEmojis.x} **Sem permissao para entrar/falar nesse canal.**`)
          ]
        });
      }

      if (voiceChannel.userLimit !== 0 && voiceChannel.full) {
        return replyError(message, {
          embeds: [
            new MessageEmbed()
              .setColor(ee.wrongcolor)
              .setFooter(ee.footertext, ee.footericon)
              .setTitle(`${client.allEmojis.x} Seu canal de voz esta cheio, nao consigo entrar!`)
          ]
        });
      }

      if (botVoiceChannel && botVoiceChannel.id !== voiceChannel.id) {
        return replyError(message, {
          embeds: [
            new MessageEmbed()
              .setColor(ee.wrongcolor)
              .setFooter(ee.footertext, ee.footericon)
              .setTitle(`${client.allEmojis.x} Ja estou conectado em outro lugar`)
          ]
        });
      }

      const selectedMix = selectYtMix(args.join(" "));
      const link = selectedMix.url;
      const loadingMsg = await message.reply({
        content: `${client.allEmojis.loading} Carregando o **Mix de musica ${selectedMix.label}**`
      });

      const playWithRetry = async () => {
        let retriedStopped = false;
        let retriedVoiceConnect = 0;
        for (;;) {
          try {
            const existingQueue = client.distube.getQueue(guildId);
            if (existingQueue?.stopped) existingQueue.remove();
            await client.distube.play(voiceChannel, link, {
              member,
              textChannel: guild.channels.cache.get(channelId)
            });
            return;
          } catch (err) {
            const code = err?.code || err?.errorCode || "";
            if (!retriedStopped && (String(err).includes("QUEUE_STOPPED") || code === "QUEUE_STOPPED")) {
              const existingQueue = client.distube.getQueue(guildId);
              if (existingQueue) existingQueue.remove();
              retriedStopped = true;
              continue;
            }
            if (String(err).includes("VOICE_CONNECT_FAILED") || code === "VOICE_CONNECT_FAILED") {
              const existingQueue = client.distube.getQueue(guildId);
              if (existingQueue) existingQueue.remove();
              if (retriedVoiceConnect < 2) {
                retriedVoiceConnect += 1;
                await wait(1200 * retriedVoiceConnect);
                continue;
              }
            }
            throw err;
          }
        }
      };

      await playWithRetry();
      const queue = client.distube.getQueue(guildId);
      await loadingMsg.edit({
        content: `${queue?.songs?.length > 1 ? "Carregado" : "Tocando Agora"}: **${selectedMix.label}**`
      });
    } catch (e) {
      console.log(e.stack ? e.stack : e);
      const code = e?.code || e?.errorCode || "";
      if (String(e).includes("VOICE_CONNECT_FAILED") || code === "VOICE_CONNECT_FAILED") {
        return replyError(message, {
          embeds: [
            new MessageEmbed()
              .setColor(ee.wrongcolor)
              .setTitle(`${client.allEmojis.x} Nao consegui conectar ao canal de voz.`)
              .setDescription("Verifique se o bot tem permissao de **Conectar** e **Falar**, e tente novamente.")
          ]
        });
      }
      return replyError(message, {
        content: `${client.allEmojis.x} | Erro:`,
        embeds: [
          new MessageEmbed()
            .setColor(ee.wrongcolor)
            .setDescription(`\`\`\`${String(e)}\`\`\``)
        ]
      });
    }
  }
};
