const {
  MessageEmbed
} = require("discord.js");
const config = require("../../botconfig/config.json");
const ee = require("../../botconfig/embed.json");
const settings = require("../../botconfig/settings.json");
module.exports = {
  name: "prefix",
  category: "Configurações",
  aliases: ["setprefix"],
  usage: "prefix <novoPrefixo>",
  cooldown: 1,
  description: "Altera o prefixo do bot!",
  memberpermissions: ["MANAGE_GUILD"],
  requiredroles: [],
  alloweduserids: [],

  run: async (client, message, args) => {
    try {
      const guildId = message.guild.id;
      
      if (!args[0]) {
        const currentPrefix = client.settings.get(guildId, "prefix") || config.prefix;
        return message.reply({
          embeds: [
            new MessageEmbed()
            .setColor(ee.wrongcolor)
            .setFooter(ee.footertext, ee.footericon)
            .setTitle(`${client.allEmojis.x} **Por favor, informe um prefixo!**`)
            .setDescription(`**Uso:**\n> \`${currentPrefix}prefix <novoPrefixo>\``)
          ],
        });
      }
      
      const newPrefix = args[0];
      
      client.settings.set(guildId, newPrefix, "prefix");
      
      return message.reply({
        embeds: [
          new MessageEmbed()
          .setColor(ee.color)
          .setFooter(ee.footertext, ee.footericon)
          .setTitle(`${client.allEmojis.check_mark} **O novo prefixo agora é: \`${newPrefix}\`**`)
        ],
      });
    } catch (e) {
      console.log(String(e.stack).bgRed);
    }
  }
};