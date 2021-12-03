const {
  MessageEmbed
} = require("discord.js");
const config = require("../../botconfig/config.json");
const ee = require("../../botconfig/embed.json");
const settings = require("../../botconfig/settings.json");
module.exports = {
  name: "dj", //the command name for execution & for helpcmd [OPTIONAL]

  category: "Configurações",
  aliases: ["djrole", "role", "drole", "djs", "dj-role"],
  Use: "dj <add/remove> <@Role>",

  cooldown: 1, //the command cooldown for execution & for helpcmd [OPTIONAL]
  description: "Gerencia os Djs!", //the command description for helpcmd [OPTIONAL]
  memberpermissions: ["MANAGE_GUILD "], //Only allow members with specific Permissions to execute a Commmand [OPTIONAL]
  requiredroles: [], //Only allow specific Users with a Role to execute a Command [OPTIONAL]
  alloweduserids: [], //Only allow specific Users to execute a Command [OPTIONAL]
  run: async (client, message, args) => {
    try {
      //things u can directly access in an interaction!
      const {
        member,
        channelId,
        guildId,
        applicationId,
        commandName,
        deferred,
        replied,
        ephemeral,
        options,
        id,
        createdTimestamp
      } = message;
      const {
        guild
      } = member;
      if (!args[0]) {
        return message.reply({
          embeds: [new MessageEmbed()
            .setColor(ee.wrongcolor)
            .setFooter(ee.footertext, ee.footericon)
            .setTitle(`${client.allEmojis.x} **Adicione um Método + Função!**`)
            .setDescription(`**Use:**\n> \`${client.settings.get(message.guild.id, "prefix")}botchat <add/remover> <@Role>\``)
          ],
        });
      }
      let add_remove = args[0].toLowerCase();
      if (!["add", "remover"].includes(add_remove)) {
        return message.reply({
          embeds: [new MessageEmbed()
            .setColor(ee.wrongcolor)
            .setFooter(ee.footertext, ee.footericon)
            .setTitle(`${client.allEmojis.x} **Adicione um Método + Função!**`)
            .setDescription(`**Use:**\n> \`${client.settings.get(message.guild.id, "prefix")}botchat <add/remover> <@Role>\``)
          ],
        });
      }
      let Role = message.mentions.channels.first();
      if (!Role) {
        return message.reply({
          embeds: [new MessageEmbed()
            .setColor(ee.wrongcolor)
            .setFooter(ee.footertext, ee.footericon)
            .setTitle(`${client.allEmojis.x} **Adicione um Método + Função!**`)
            .setDescription(`**Use:**\n> \`${client.settings.get(message.guild.id, "prefix")}botchat <add/remover> <@Role>\``)
          ],
        });
      }
      client.settings.ensure(guild.id, {
        djroles: []
      });
      if (add_remove == "add") {
        if (client.settings.get(guild.id, "djroles").includes(Role.id)) {
          return message.reply({
            embeds: [
              new MessageEmbed()
              .setColor(ee.wrongcolor)
              .setFooter(ee.footertext, ee.footericon)
              .setTitle(`${client.allEmojis.x} **Este cargo já é um CARGO-DJ!**`)
            ],
          })
        }
        client.settings.push(guild.id, Role.id, "djroles");
        var djs = client.settings.get(guild.id, `djroles`).map(r => `<@&${r}>`);
        if (djs.length == 0) djs = "`não configurado";
        else djs.join(", ");
        return message.reply({
          embeds: [
            new MessageEmbed()
            .setColor(ee.color)
            .setFooter(ee.footertext, ee.footericon)
            .setTitle(`${client.allEmojis.check_mark} **Um cargo \`${Role.name}\` foi adicionado ao ${client.settings.get(guild.id, "djroles").length - 1} CARGO-DJ!**`)
            .addField(`**CARGO-DJ${client.settings.get(guild.id, "djroles").length > 1 ? "s": ""}:**`, `>>> ${djs}`, true)
          ],
        })
      } else {
        if (!client.settings.get(guild.id, "djroles").includes(Role.id)) {
          return message.reply({
            embeds: [
              new MessageEmbed()
              .setColor(ee.wrongcolor)
              .setFooter(ee.footertext, ee.footericon)
              .setTitle(`${client.allEmojis.x} **Este cargo ainda não é um CARGO-DJ!**`)
            ],
          })
        }
        client.settings.remove(guild.id, Role.id, "djroles");
        var djs = client.settings.get(guild.id, `djroles`).map(r => `<@&${r}>`);
        if (djs.length == 0) djs = "`não configurado`";
        else djs.join(", ");
        return message.reply({
          embeds: [
            new MessageEmbed()
            .setColor(ee.color)
            .setFooter(ee.footertext, ee.footericon)
            .setTitle(`${client.allEmojis.check_mark} **O cargo \`${Role.name}\` foi removido do ${client.settings.get(guild.id, "djroles").length} CARGO-DJ!**`)
            .addField(`**CARGO-DJ${client.settings.get(guild.id, "djroles").length > 1 ? "s": ""}:**`, `>>> ${djs}`, true)
          ],
        })
      }

    } catch (e) {
      console.log(String(e.stack).bgRed)
    }
  }
}