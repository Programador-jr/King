const { MessageEmbed } = require("discord.js");
const ee = require("../../botconfig/embed.json");
const filters = require("../../botconfig/filters.json");

module.exports = {
  name: "defaultfilter",
  category: "Configurações",
  aliases: ["dfilter"],
  usage: "defaultfilter <filtro1 filtro2 ...>",
  cooldown: 10,
  description: "Define os filtros padrao aplicados ao iniciar a fila",
  memberpermissions: ["MANAGE_GUILD"],
  requiredroles: [],
  alloweduserids: [],

  run: async (client, message, args) => {
    try {
      const guild = message?.guild;
      if (!guild) return;

      client.settings.ensure(guild.id, {
        defaultvolume: 50,
        defaultautoplay: false,
        defaultfilters: [],
      });

      const normalized = [...new Set((args || []).map((a) => String(a).trim().toLowerCase()).filter(Boolean))];
      const validNames = Object.keys(filters);

      if (!normalized.length) {
        const current = client.settings.get(guild.id, "defaultfilters") || [];
        return message.reply({
          embeds: [
            new MessageEmbed()
              .setColor(ee.color)
              .setFooter(ee.footertext, ee.footericon)
              .setTitle(`${client.allEmojis.check_mark} **Filtros padrao atuais:**`)
              .setDescription(current.length ? current.map((name) => `\`${name}\``).join(", ") : "`nenhum`")
              .addField("**Filtros validos:**", validNames.map((name) => `\`${name}\``).join(", ")),
          ],
        });
      }

      const invalid = normalized.filter((name) => !filters[name]);
      if (invalid.length > 0) {
        return message.reply({
          embeds: [
            new MessageEmbed()
              .setColor(ee.wrongcolor)
              .setFooter(ee.footertext, ee.footericon)
              .setTitle(`${client.allEmojis.x} **Voce adicionou filtro(s) invalido(s).**`)
              .setDescription(`Invalidos: ${invalid.map((name) => `\`${name}\``).join(", ")}`)
              .addField("**Filtros validos:**", validNames.map((name) => `\`${name}\``).join(", ")),
          ],
        });
      }

      client.settings.set(guild.id, normalized, "defaultfilters");
      return message.reply({
        embeds: [
          new MessageEmbed()
            .setColor(ee.color)
            .setFooter(ee.footertext, ee.footericon)
            .setTitle(`${client.allEmojis.check_mark} **Novos filtros padrao salvos:**`)
            .setDescription(normalized.map((name) => `\`${name}\``).join(", ")),
        ],
      });
    } catch (e) {
      console.log(e?.stack || e);
      return message.reply({
        embeds: [
          new MessageEmbed()
            .setColor(ee.wrongcolor)
            .setTitle(`${client.allEmojis.x} **Falha ao salvar filtros padrao.**`),
        ],
      }).catch(() => {});
    }
  },
};
