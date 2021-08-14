const functions = require("../../functions")
const config = require("../../config.json")
module.exports = {
  name: "status",
  category: "MUSIC COMMANDS",
  useage: "status",
  aliases: ["settings", "configuração"],
  description: "Mostra o status / configurações da fila",
  run: async (client, message, args) => {
    //if not a dj, return error  - DISABLED BECAUSE NOT A DJ CMD
    //if(functions.check_if_dj(message))
    //return functions.embedbuilder(client, 6000, message, config.colors.no, "DJ-ROLE", `❌ You don\'t have permission for this Command! You need to have: ${functions.check_if_dj(message)}`)

    //If Bot not connected, return error
    if (!message.guild.me.voice.channel) return functions.embedbuilder(client, 3000, message, config.colors.no, "Nada tocando!")
    
    //if member not connected return error
    if (!message.member.voice.channel) return functions.embedbuilder(client, 5000, message, config.colors.no, "`" + message.author.tag + "`" + " Você deve entrar em um canal de voz")
    
    //if they are not in the same channel, return error
    if (message.member.voice.channel.id != message.guild.me.voice.channel.id) return functions.embedbuilder(client, 5000, message, config.colors.no, "`" + message.author.tag + "`" + " Você deve entrar no meu canal de voz: " + ` \`${message.guild.me.voice.channel.name ? message.guild.me.voice.channel.name : ""}\``)
        
    //get the queue 
    let queue = client.distube.getQueue(message);
    
    //if no queue, return error
    if (!queue) return functions.embedbuilder(client, "null", message, config.colors.no, "Não há nada tocando!");

    //send the curembed from the function
    return message.channel.send(functions.curembed(client, message));
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
