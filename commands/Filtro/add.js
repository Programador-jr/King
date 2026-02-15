const { MessageEmbed } = require("discord.js");
const ee = require("../../botconfig/embed.json");
const { check_if_dj } = require("../../handlers/functions");
const FiltersSettings = require("../../botconfig/filters.json");

const getCurrentFilters = (queue) => {
  if (!queue) return [];
  if (Array.isArray(queue.filters?.names)) return queue.filters.names;
  if (queue.filters?.collection) return [...queue.filters.collection.keys()];
  return [];
};

module.exports = {
  name: "addfilter",
  category: "Filtro",
  usage: "addfilter <Filtro1 Filtro2>",
  aliases: ["addfilters", "add", "addf", "addfiltro"],
  description: "Adicione um filtro aos filtros",
  cooldown: 5,
  requiredroles: [],
  alloweduserids: [],
  run: async (client, message, args) => {
    try {
      const { member, guildId, guild } = message;
      const { channel } = member.voice;
      if (!channel) {
        return message.reply({
          embeds: [new MessageEmbed().setColor(ee.wrongcolor).setTitle(`${client.allEmojis.x} **Junte-se ${guild.me.voice.channel ? "__ao meu__" : "a um"} canal de voz primeiro!**`)]
        });
      }
      if (channel.guild.me.voice.channel && channel.guild.me.voice.channel.id != channel.id) {
        return message.reply({
          embeds: [new MessageEmbed()
            .setColor(ee.wrongcolor)
            .setFooter(ee.footertext, ee.footericon)
            .setTitle(`${client.allEmojis.x} Junte-se ao __meu__ canal de voz!`)
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
            .setTitle(`${client.allEmojis.x}**Você não é um DJ e a música não foi requisitada por você!**`)
            .setDescription(`**CARGOS-DJ:**\n> ${check_if_dj(client, member, newQueue.songs[0])}`)
          ]
        });
      }

      const currentFilters = getCurrentFilters(newQueue);
      if (!args.length) {
        return message.reply({
          embeds: [new MessageEmbed()
            .setColor(ee.wrongcolor)
            .setFooter(ee.footertext, ee.footericon)
            .setTitle(`${client.allEmojis.x} **Adicione filtros para incluir.**`)
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
            .setDescription("**Para definir vários filtros, adicione um ESPAÇO (` `) entre!**")
            .addField("**Filtros válidos:**", Object.keys(FiltersSettings).map((f) => `\`${f}\``).join(", "))
          ]
        });
      }

      const toAdd = filters.filter((f) => !currentFilters.includes(f));
      if (!toAdd.length) {
        return message.reply({
          embeds: [new MessageEmbed()
            .setColor(ee.wrongcolor)
            .setFooter(ee.footertext, ee.footericon)
            .setTitle(`${client.allEmojis.x} **Todos esses filtros já estão ativos.**`)
            .addField("**Filtros atuais:**", currentFilters.length ? currentFilters.map((f) => `\`${f}\``).join(", ") : "Nenhum")
          ]
        });
      }

      const updated = [...new Set([...currentFilters, ...toAdd])];
      await newQueue.filters.set(updated);
      return message.reply({
        embeds: [new MessageEmbed()
          .setColor(ee.color)
          .setTimestamp()
          .setTitle(`♨️ **Adicionado ${toAdd.length} filtro(s)!**`)
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

