const { MessageEmbed } = require("discord.js");
const ee = require("../../botconfig/embed.json");
const settings = require("../../botconfig/settings.json");
const { check_if_dj } = require("../../handlers/functions");
const FiltersSettings = require("../../botconfig/filters.json");

const getCurrentFilters = (queue) => {
  if (!queue) return [];
  if (Array.isArray(queue.filters?.names)) return queue.filters.names;
  if (queue.filters?.collection) return [...queue.filters.collection.keys()];
  return [];
};

module.exports = {
  name: "setfilter",
  category: "Filtro",
  usage: "setfilter <Filtro1 Filtro2>",
  aliases: ["setfilters", "set", "setf", "definirfiltro", "mudarfiltro"],
  description: "Define (substitui) todos os filtros",
  cooldown: 5,
  requiredroles: [],
  alloweduserids: [],
  run: async (client, message, args) => {
    try {
      const { member, guildId, guild } = message;
      const { channel } = member.voice;
      if (!channel) {
        return message.reply({
          embeds: [new MessageEmbed().setColor(ee.wrongcolor).setTitle(`${client.allEmojis.x} **Por favor junte-se ${guild.me.voice.channel ? "__ao meu__" : "a um"} Canal de voz primeiro!**`)]
        });
      }
      if (channel.guild.me.voice.channel && channel.guild.me.voice.channel.id != channel.id) {
        return message.reply({
          embeds: [new MessageEmbed()
            .setColor(ee.wrongcolor)
            .setFooter(ee.footertext, ee.footericon)
            .setTitle(`${client.allEmojis.x} Entre no __meu__ canal de voz primeiro!`)
            .setDescription(`<#${guild.me.voice.channel.id}>`)
          ]
        });
      }

      const newQueue = client.distube.getQueue(guildId);
      if (!newQueue || !newQueue.songs || newQueue.songs.length == 0) {
        return message.reply({
          embeds: [new MessageEmbed().setColor(ee.wrongcolor).setTitle(`${client.allEmojis.x} **Eu não estou tocando nada agora!**`)]
        });
      }

      if (check_if_dj(client, member, newQueue.songs[0])) {
        return message.reply({
          embeds: [new MessageEmbed()
            .setColor(ee.wrongcolor)
            .setFooter(ee.footertext, ee.footericon)
            .setTitle(`${client.allEmojis.x}**Você não é um DJ e não é o Solicitante da musica!**`)
            .setDescription(`**CARGO-DJ:**\n> ${check_if_dj(client, member, newQueue.songs[0])}`)
          ]
        });
      }

      const currentFilters = getCurrentFilters(newQueue);
      if (!args.length) {
        return message.reply({
          embeds: [new MessageEmbed()
            .setColor(ee.wrongcolor)
            .setFooter(ee.footertext, ee.footericon)
            .setTitle(`${client.allEmojis.x} **Adicione filtros para definir.**`)
            .addField("**Filtros atuais:**", currentFilters.length ? currentFilters.map((f) => `\`${f}\``).join(", ") : "Nenhum")
          ]
        });
      }

      const filters = args.map((f) => f.toLowerCase());
      if (filters.some((f) => !FiltersSettings[f])) {
        return message.reply({
          embeds: [new MessageEmbed()
            .setColor(ee.wrongcolor)
            .setFooter(ee.footertext, ee.footericon)
            .setTitle(`${client.allEmojis.x} **Você adicionou pelo menos um filtro inválido!**`)
            .setDescription("**Para definir vários filtros, adicione um ESPAÇO no meio (` `)!**")
            .addField("**Filtros válidos:**", Object.keys(FiltersSettings).map((f) => `\`${f}\``).join(", "))
          ]
        });
      }

      const uniqueFilters = [...new Set(filters)];
      await newQueue.filters.set(uniqueFilters);
      return message.reply({
        embeds: [new MessageEmbed()
          .setColor(ee.color)
          .setTimestamp()
          .setTitle(`♨**Definido ${uniqueFilters.length} Filtros!**`)
          .setFooter(`Ação por: ${member.user.tag}`, member.user.displayAvatarURL({ dynamic: true }))
        ]
      });
    } catch (e) {
      console.log(e.stack ? e.stack : e);
      return message.reply({
        content: `${client.allEmojis.x} | Erro:`,
        embeds: [new MessageEmbed().setColor(ee.wrongcolor).setDescription(`\`\`\`${e}\`\`\``)]
      });
    }
  }
};

