const { MessageEmbed, AttachmentBuilder } = require("discord.js");
const ee = require("../../botconfig/embed.json");
const {
  parseArtistTitle,
  getSongSearchData,
  getLyricsWithFallback,
} = require("../../handlers/lyricsService");

const MAX_EMBED_LYRICS = 3900;

const safeSlug = (value) =>
  String(value || "lyrics")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "lyrics";

module.exports = {
  name: "lyrics",
  category: "Musica",
  usage: "lyrics [nome da musica | artista - musica]",
  aliases: ["letra", "lirycs", "lyric"],
  description: "Mostra a letra da musica atual com APIs alternativas",
  cooldown: 7,
  requiredroles: [],
  alloweduserids: [],
  run: async (client, message, args) => {
    try {
      const hasArgsQuery = args.length > 0;
      const { member, guildId } = message;
      const { guild } = member;

      let currentSong = null;
      if (!hasArgsQuery) {
        const { channel } = member.voice;

        if (!channel) {
          return message.reply({
            embeds: [
              new MessageEmbed()
                .setColor(ee.wrongcolor)
                .setTitle(
                  `${client.allEmojis.x} **Por favor junte-se ${
                    guild.me.voice.channel ? "__ao meu__" : "a um"
                  } Canal de voz primeiro!**`
                ),
            ],
          });
        }

        if (channel.guild.me.voice.channel && channel.guild.me.voice.channel.id !== channel.id) {
          return message.reply({
            embeds: [
              new MessageEmbed()
                .setColor(ee.wrongcolor)
                .setFooter(ee.footertext, ee.footericon)
                .setTitle(`${client.allEmojis.x} Entre no __meu__ canal de voz!`)
                .setDescription(`<#${guild.me.voice.channel.id}>`),
            ],
          });
        }

        const queue = client.distube.getQueue(guildId);
        if (!queue || !queue.songs || queue.songs.length === 0) {
          return message.reply({
            embeds: [
              new MessageEmbed()
                .setColor(ee.wrongcolor)
                .setTitle(`${client.allEmojis.x} **Eu nao estou tocando nada agora!**`),
            ],
          });
        }
        currentSong = queue.songs[0];
      }

      const queryFromArgs = hasArgsQuery ? parseArtistTitle(args.join(" ")) : null;
      const queryFromSong = currentSong ? getSongSearchData(currentSong) : { artist: "", title: "" };
      const query = hasArgsQuery
        ? {
            artist: queryFromArgs?.artist || "",
            title: queryFromArgs?.title || args.join(" ").trim(),
          }
        : {
            artist: queryFromSong.artist,
            title: queryFromSong.title,
          };

      if (!query.title) {
        return message.reply({
          embeds: [
            new MessageEmbed()
              .setColor(ee.wrongcolor)
              .setTitle(`${client.allEmojis.x} Nao consegui identificar a musica para buscar a letra.`),
          ],
        });
      }

      const result = await getLyricsWithFallback(query, {
        vagalumeApiKey: process.env.VAGALUME_API_KEY || process.env.VAGALUME_KEY || "",
      });

      if (!result.lyrics) {
        return message.reply({
          embeds: [
            new MessageEmbed()
              .setColor(ee.wrongcolor)
              .setTitle(`${client.allEmojis.x} Nao encontrei a letra dessa musica.`)
              .setDescription(
                `Busca usada:\n> Artista: \`${query.artist || "desconhecido"}\`\n> Musica: \`${
                  query.title
                }\``
              ),
          ],
        });
      }

      const sourceLabel = `${result.source}${result.synced ? " (sincronizada)" : ""}`;
      const header = [
        `Fonte: ${sourceLabel}`,
        `Artista: ${result.artist || query.artist || "desconhecido"}`,
        `Musica: ${result.title || query.title}`,
        "",
      ].join("\n");

      const songForEmbed = {
        ...(currentSong || {}),
        name: result.title || query.title || currentSong?.name,
        url: currentSong?.url || "https://www.vagalume.com.br/",
        thumbnail: currentSong?.thumbnail || ee.footericon,
        user: currentSong?.user || message.author,
      };

      const fullLyrics = `${header}${result.lyrics}`.trim();
      const embed = new MessageEmbed()
        .setColor(ee.color)
        .setTitle(`Letra - ${songForEmbed.name || "Musica"}`)
        .setURL(songForEmbed.url)
        .setThumbnail(songForEmbed.thumbnail)
        .setFooter(`Música solicitada por: ${songForEmbed.user?.tag || message.author.tag}`);

      if (fullLyrics.length <= MAX_EMBED_LYRICS) {
        embed.setDescription(fullLyrics);
        return message.reply({ embeds: [embed] });
      }

      embed.setDescription(
        `${header}A letra completa excede o limite de um embed e foi enviada no arquivo abaixo.`
      );
      const filename = `lyrics-${safeSlug(`${result.artist || query.artist}-${result.title || query.title}`)}.txt`;
      const file = new AttachmentBuilder(Buffer.from(fullLyrics, "utf8"), { name: filename });
      return message.reply({ embeds: [embed], files: [file] });
    } catch (error) {
      console.log(error?.stack ? error.stack : error);
      return message.reply({
        embeds: [
          new MessageEmbed()
            .setColor(ee.wrongcolor)
            .setTitle(`${client.allEmojis.x} Ocorreu um erro ao buscar a letra.`),
        ],
      });
    }
  },
};

