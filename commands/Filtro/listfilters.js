const { MessageEmbed } = require("discord.js");
const ee = require("../../botconfig/embed.json");
const config = require("../../botconfig/config.json");
const FiltersSettings = require("../../botconfig/filters.json");

module.exports = {
  name: "listfilters",
  category: "Filtro",
  usage: "listfilters",
  aliases: ["listfilter", "allfilters", "listarfiltros"],
  description: "Lista apenas os filtros disponiveis.",
  cooldown: 5,
  requiredroles: [],
  alloweduserids: [],
  run: async (client, message) => {
    try {
      const prefix = client.settings.get(message.guild.id, "prefix") || config.prefix;
      const filters = Object.keys(FiltersSettings).sort((a, b) => a.localeCompare(b, "pt-BR"));

      return message.reply({
        embeds: [
          new MessageEmbed()
            .setColor(ee.color)
            .setFooter(ee.footertext, ee.footericon)
            .setTitle("Filtros disponiveis")
            .setDescription(filters.map((name) => `\`${name}\``).join(", "))
            .addField("Uso rapido", `\`${prefix}setfilter <filtro1 filtro2>\`\n\`${prefix}addfilter <filtro1 filtro2>\``)
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
