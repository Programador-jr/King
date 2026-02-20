const {
  MessageEmbed
} = require("discord.js");
const config = require("../../botconfig/config.json");
var ee = require("../../botconfig/embed.json");
const settings = require("../../botconfig/settings.json");
module.exports = {
  name: "source", //the command name for execution & for helpcmd [OPTIONAL]

  category: "Info",
  usage: "source",
  aliases: ["github"],

  cooldown: 5, //the command cooldown for execution & for helpcmd [OPTIONAL]
  description: "Envia a você informações de código-fonte", //the command description for helpcmd [OPTIONAL]
  memberpermissions: [], //Only allow members with specific Permissions to execute a Commmand [OPTIONAL]
  requiredroles: [], //Only allow specific Users with a Role to execute a Command [OPTIONAL]
  alloweduserids: [], //Only allow specific Users to execute a Command [OPTIONAL]
  run: async (client, message, args) => {
    try {
      message.reply({
        embeds: [
          new MessageEmbed().setColor(ee.color)
          .setFooter(ee.footertext, ee.footericon)
          .setDescription(`**AO UTILIZAR O CÓDIGO FONTE, __DÊ OS DEVIDOS CREDITOS__!** :heart:\n\n[Link para a fonte](https://github.com/Programador-jr/King)`)
        ]
      });
    } catch (e) {
      console.log(String(e.stack).bgRed)
    }
  }
}