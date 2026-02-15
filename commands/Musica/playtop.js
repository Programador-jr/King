const { MessageEmbed, PermissionFlagsBits } = require("discord.js");
const ee = require("../../botconfig/embed.json");
const settings = require("../../botconfig/settings.json");
const { check_if_dj } = require("../../handlers/functions");
const { resolveQuery } = require("../../handlers/musicSearch");

const ERROR_DELETE_MS = 4000;
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
  name: "playtop",
  category: "Musica",
  aliases: ["pt"],
  usage: "playtop <Procurar/link>",
  description: "Toca uma musica/lista de reproducao e adiciona ao topo!",
  cooldown: 2,
  requiredroles: [],
  alloweduserids: [],

  run: async (client, message, args) => {
    try {
      const { member, channelId, guildId } = message;
      const { guild } = member;
      const { channel } = member.voice;
      if (!channel) {
        return replyError(message, {
          embeds: [
            new MessageEmbed()
              .setColor(ee.wrongcolor)
              .setTitle(`${client.allEmojis.x} **Por favor junte-se ${guild.me.voice.channel ? "__ao meu__" : "a um"} canal de voz primeiro!**`)
          ]
        });
      }

      const me = guild.members.me ?? guild.members.cache.get(client.user.id);
      const perms = channel.permissionsFor(me);
      if (!perms?.has(PermissionFlagsBits.Connect) || !perms?.has(PermissionFlagsBits.Speak)) {
        return replyError(message, {
          embeds: [
            new MessageEmbed()
              .setColor(ee.wrongcolor)
              .setTitle(`${client.allEmojis.x} **Sem permissao para entrar/falar nesse canal.**`)
          ]
        });
      }

      if (channel.userLimit != 0 && channel.full) {
        return replyError(message, {
          embeds: [
            new MessageEmbed()
              .setColor(ee.wrongcolor)
              .setFooter(ee.footertext, ee.footericon)
              .setTitle(`Seu canal de voz esta cheio, nao consigo entrar!`)
          ]
        });
      }

      if (channel.guild.me.voice.channel && channel.guild.me.voice.channel.id != channel.id) {
        return replyError(message, {
          embeds: [
            new MessageEmbed()
              .setColor(ee.wrongcolor)
              .setFooter(ee.footertext, ee.footericon)
              .setTitle(`Ja estou conectado em outro lugar`)
          ]
        });
      }

      if (!args[0]) {
        return replyError(message, {
          embeds: [
            new MessageEmbed()
              .setColor(ee.wrongcolor)
              .setFooter(ee.footertext, ee.footericon)
              .setTitle(`${client.allEmojis.x} **Adicione uma consulta de pesquisa!**`)
              .setDescription(`**Uso:**\n> \`${client.settings.get(message.guild.id, "prefix")}playtop <Procurar/Link>\``)
          ]
        });
      }

      const Text = args.join(" ");
      const newmsg = await message.reply({
        content: `ðŸ” Procurando... \`\`\`${Text}\`\`\``
      }).catch(() => null);

      try {
        const queue = client.distube.getQueue(guildId);
        const options = {
          member: member,
          unshift: true
        };
        if (!queue) options.textChannel = guild.channels.cache.get(channelId);
        if (queue) {
          if (check_if_dj(client, member, queue.songs[0])) {
            return replyError(message, {
              embeds: [
                new MessageEmbed()
                  .setColor(ee.wrongcolor)
                  .setFooter(ee.footertext, ee.footericon)
                  .setTitle(`${client.allEmojis.x} **Voce nao e um DJ e nao e o Solicitante da musica!**`)
                  .setDescription(`**CARGO-DJ:**\n> ${check_if_dj(client, member, queue.songs[0])}`)
              ]
            });
          }
        }

        const resolved = await resolveQuery(Text);
        if (resolved?.unsupported === "youtube_music") {
          await newmsg?.edit({
            content: `${client.allEmojis.x} **YouTube Music nao suportado. Tente usar um link do YouTube**`
          }).catch(() => {});
          deleteLater(message);
          deleteLater(newmsg);
          return;
        }
        if (!resolved?.url) {
          await newmsg?.edit({
            content: `${client.allEmojis.x} Nao encontrei resultado para: \`\`\`${Text}\`\`\``
          }).catch(() => {});
          deleteLater(message);
          deleteLater(newmsg);
          return;
        }

        const playWithRetry = async () => {
          let retried = false;
          for (;;) {
            try {
              const existingQueue = client.distube.getQueue(guildId);
              if (existingQueue?.stopped) {
                existingQueue.remove();
              }
              await client.distube.play(channel, resolved.url, options);
              return;
            } catch (err) {
              const code = err?.code || err?.errorCode || "";
              if (!retried && (String(err).includes("QUEUE_STOPPED") || code === "QUEUE_STOPPED")) {
                const existingQueue = client.distube.getQueue(guildId);
                if (existingQueue) existingQueue.remove();
                retried = true;
                continue;
              }
              throw err;
            }
          }
        };
        await playWithRetry();
        const activeQueue = client.distube.getQueue(guildId);
        newmsg?.edit({
          content: `${activeQueue?.songs?.length > 0 ? "ðŸ‘ Adicionado ao topo da fila" : "ðŸŽ¶ Tocando Agora"}: \`\`\`css\n${resolved.title || Text}\n\`\`\``
        }).catch(() => {});
      } catch (e) {
        console.log(e.stack ? e.stack : e);
        replyError(message, {
          content: `${client.allEmojis.x} | Erro: `,
          embeds: [new MessageEmbed().setColor(ee.wrongcolor).setDescription(`\`\`\`${e}\`\`\``)]
        });
      }
    } catch (e) {
      console.log(String(e.stack).bgRed);
    }
  }
};

