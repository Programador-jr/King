const {
  MessageEmbed,
  Message
} = require("discord.js");
const config = require("../../botconfig/config.json");
const ee = require("../../botconfig/embed.json");
const settings = require("../../botconfig/settings.json");
const FiltersSettings = require("../../botconfig/filters.json");

const getCurrentFilters = (queue) => {
  if (!queue) return [];
  if (Array.isArray(queue.filters?.names)) return queue.filters.names;
  if (queue.filters?.collection) return [...queue.filters.collection.keys()];
  return [];
};
const {
  check_if_dj
} = require("../../handlers/functions")

module.exports = {
  name: "filters", //the command name for the Slash Command

  category: "Filtro",
  usage: "filters",
  aliases: ["listfilter", "listfilters", "allfilters"],

  description: "Liste todos os filtros ativos e possíveis!", //the command description for Slash Command Overview
  cooldown: 5,
  requiredroles: [], //Only allow specific Users with a Role to execute a Command [OPTIONAL]
  alloweduserids: [], //Only allow specific Users to execute a Command [OPTIONAL]
  run: async (client, message, args) => {
    try {
      const {
        member,
        guildId,
        guild
      } = message;
      const {
        channel
      } = member.voice;
      try {
        let newQueue = client.distube.getQueue(guildId);
        const currentFilters = getCurrentFilters(newQueue);
        if (!newQueue || !newQueue.songs || newQueue.songs.length == 0) return message.reply({
          embeds: [
            new MessageEmbed()
            .setColor(ee.wrongcolor)
            .setFooter(ee.footertext, ee.footericon)
            .addField("**Todos os filtros disponíveis:**", Object.keys(FiltersSettings).map(f => `\`${f}\``).join(", ") + "\n\n**Nota:**\n> *Todos os filtros, começando com o personalizado, têm seu próprio Comando, use-os para definir o valor personalizado que você deseja!*")
          ],
        })
        return message.reply({
          embeds: [
            new MessageEmbed()
            .setColor(ee.wrongcolor)
            .setFooter(ee.footertext, ee.footericon)
            .addField("**Todos os filtros disponíveis:**", Object.keys(FiltersSettings).map(f => `\`${f}\``).join(", ") + "\n\n**Nota:**\n> *Todos os filtros, começando com o personalizado, têm seu próprio Comando, use-os para definir o valor personalizado que você deseja!*")
            .addField("**Todos os Filtros _disponiveis__:**", currentFilters.map(f => `\`${f}\``).join(", "))
          ],
        })
      } catch (e) {
        console.log(e.stack ? e.stack : e)
        message.reply({
          content: `${client.allEmojis.x} | Erro: `,
          embeds: [
            new MessageEmbed().setColor(ee.wrongcolor)
            .setDescription(`\`\`\`${e}\`\`\``)
          ],

        })
      }
    } catch (e) {
      console.log(String(e.stack).bgRed)
    }
  }
}
