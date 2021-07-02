const functions = require("../../functions")
const config = require("../../config.json")
module.exports = {
  name: `moveme`,
  category: "MUSIC COMMANDS",
  aliases: [`mm`, "mvm", "my", "mvy", "moveyou"],
  description: `Moves you to the BOT, if playing something`,
  usage: `move`,
  run: async (client, message, args, cmduser, text, prefix, player) => {

      //if not a dj, return error - DISABLED - NOT NEEDED
      //if (functions.check_if_dj(message))
      //return functions.embedbuilder(client, 6000, message, config.colors.no, "DJ-ROLE", `❌ You don\'t have permission for this Command! You need to have: ${functions.check_if_dj(message)}`)

      //If Bot not connected, return error
      if (!message.guild.me.voice.channel) return functions.embedbuilder(client, 3000, message, config.colors.no, "Nada tocando!")

      //if member not connected return error
      if (!message.member.voice.channel) return functions.embedbuilder(client, 5000, message, config.colors.no, "`" + message.author.tag + "`" + " Você deve entrar em um canal de voz")

      //if they are not in the same channel, return error
      if (message.member.voice.channel.id != message.guild.me.voice.channel.id) return functions.embedbuilder(client, 5000, message, config.colors.no, "`" + message.author.tag + "`" + " Você deve entrar no meu canal de voz: " + ` \`${message.guild.me.voice.channel.name ? message.guild.me.voice.channel.name : ""}\``)

      //If the Channel is full
      if(botchannel.userLimit >= botchannel.members.length) return functions.embedbuilder(client, 3000, message, config.colors.no, "O canal está cheio, não consigo movê-lo!")

      //move the member
      message.member.voice.setChannel(botchannel);

      //send success message
      return functions.embedbuilder(client, 3000, message, config.colors.yes, `Moveu você para: \`${botchannel.name}\``)
  }
};
/**
 * @INFO
 * Bot Coded by Tomato#6966 | https://github.com/Tomato6966/discord-js-lavalink-Music-Bot-erela-js
 * @INFO
 * Work for Milrato Development | https://milrato.eu
 * @INFO
 * Please mention Him / Milrato Development, when using this Code!
 * @INFO
 */
