const { MessageEmbed } = require("discord.js");
const ee = require("../../botconfig/embed.json");
const {
  selectYtMix,
  getMixUsage,
  getMixDescription,
  getMixHelpDetails
} = require("../../handlers/ytMixes");

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

      if (!voiceChannel) {
        return message.reply({
          embeds: [
            new MessageEmbed()
              .setColor(ee.wrongcolor)
              .setTitle(`${client.allEmojis.x} **Por favor junte-se ${guild.me.voice.channel ? "__ao meu__" : "a um"} Canal de voz primeiro!**`)
          ]
        });
      }

      if (voiceChannel.userLimit !== 0 && voiceChannel.full) {
        return message.reply({
          embeds: [
            new MessageEmbed()
              .setColor(ee.wrongcolor)
              .setFooter(ee.footertext, ee.footericon)
              .setTitle(`${client.allEmojis.x} Seu canal de voz esta cheio, nao consigo entrar!`)
          ]
        });
      }

      if (voiceChannel.guild.me.voice.channel && voiceChannel.guild.me.voice.channel.id !== voiceChannel.id) {
        return message.reply({
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
      return message.reply({
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

