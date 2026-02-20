const {
  MessageEmbed
} = require("discord.js");
const config = require("../../botconfig/config.json");
var ee = require("../../botconfig/embed.json");
const settings = require("../../botconfig/settings.json");
module.exports = {
  name: "invite", //the command name for execution & for helpcmd [OPTIONAL]

  category: "Info",
  usage: "invite",
  aliases: ["inviteme", "addme", "convite", "convidar" ],

  cooldown: 5, //the command cooldown for execution & for helpcmd [OPTIONAL]
  description: "Envia um link de convite para você", //the command description for helpcmd [OPTIONAL]
  memberpermissions: [], //Only allow members with specific Permissions to execute a Commmand [OPTIONAL]
  requiredroles: [], //Only allow specific Users with a Role to execute a Command [OPTIONAL]
  alloweduserids: [], //Only allow specific Users to execute a Command [OPTIONAL]
  run: async (client, message, args) => {
    try {
      message.reply({
        embeds: [
          new MessageEmbed().setColor(ee.color)
          .setFooter(ee.footertext, ee.footericon)
          .setDescription(`[**Clique aqui para me convidar!**](https://discord.com/oauth2/authorize?client_id=794291443454836766&permissions=8&integration_type=0&scope=applications.commands+bot)`)
        ]
      });
    } catch (e) {
      console.log(String(e.stack).bgRed)
    }
  }
}