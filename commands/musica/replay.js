const functions = require("../../functions")
const config = require("../../config.json")
module.exports = {
  name: "replay",
  category: "MUSIC COMMANDS",
  aliases: ["restart"],
  useage: "replay",
  description: "Replays the current song",
  run: async (client, message, args) => {
    //if not a dj, return error
    if(functions.check_if_dj(message))
    return functions.embedbuilder(client, 6000, message, config.colors.no, "DJ-ROLE", `❌ Você não tem permissão para este comando! Você precisa ter: ${functions.check_if_dj(message)}`)

    //If Bot not connected, return error
    if (!message.guild.me.voice.channel) return functions.embedbuilder(client, 3000, message, config.colors.no, "Nada tocando!")
    
    //if member not connected return error
    if (!message.member.voice.channel) return functions.embedbuilder(client, 5000, message, config.colors.no, "`" + message.author.tag + "`" + " Você deve entrar em um canal de voz")
    
    //if they are not in the same channel, return error
    if (message.member.voice.channel.id != message.guild.me.voice.channel.id) return functions.embedbuilder(client, 5000, message, config.colors.no, "`" + message.author.tag + "`" + " Você deve entrar no meu canal de voz: " + ` \`${message.guild.me.voice.channel.name ? message.guild.me.voice.channel.name : ""}\``)
    
    //get the Queue
    let queue = client.distube.getQueue(message);

    //if no queue, return error
    if (!queue) return embedbuilder("null", message, config.colors.no, "Não há nada jogando!");

    //get current song
    let cursong = queue.songs[0];

    //send information message
    functions.embedbuilder(client, 5000, message, config.colors.yes, "Repetindo a música atual:", `[${cursong.name}](${cursong.url})`, cursong.thumbnail)

    //seek to 0
    return client.distube.seek(message, 0);
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
