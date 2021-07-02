const functions = require("../../functions")
const config = require("../../config.json")
module.exports = {
    name: "rewind",
    category: "MUSIC COMMANDS",
    aliases: ["rew", "re", "retroceder"],
    useage: "rewind <DURATION>",
    description: "Rewinds the Song back: seconds",
    run: async (client, message, args) => {
        //if not a dj, return error
        if(functions.check_if_dj(message))
        return functions.embedbuilder(client, 6000, message, config.colors.no, "DJ-ROLE", `❌ Você não tem permissão para este comando! Você precisa ter: ${functions.check_if_dj(message)}`)
    
        //If Bot not connected, return error
        if (!message.guild.me.voice.channel) return functions.embedbuilder(client, 3000, message, config.colors.no, "Nada tocando!")
        
        //if member not connected return error
        if (!message.member.voice.channel) return functions.embedbuilder(client, 5000, message, config.colors.no, "`" + message.author.tag + "`" + "Você deve entrar em um canal de voz")
        
        //if they are not in the same channel, return error
        if (message.member.voice.channel.id != message.guild.me.voice.channel.id) return functions.embedbuilder(client, 5000, message, config.colors.no, "`" + message.author.tag + "`" + "Você deve entrar no meu canal de voz: " + ` \`${message.guild.me.voice.channel.name ? message.guild.me.voice.channel.name : ""}\``)
        
        //get the Queue
        let queue = client.distube.getQueue(message);

        //if no Queue return error message
        if (!queue) return functions.embedbuilder(client, 3000, message, config.colors.no, "Nada tocando!")

        //if no arguments, return error message
        if (!args[0]) return functions.embedbuilder(client, 5000, message, config.colors.no, "`" + message.author.tag + "`" + "Por favor, adicione a quantidade que você deseja retroceder")

        //get seektime
        let seektime = queue.currentTime - Number(args[0]) * 1000;
        if (seektime < 0) seektime = 0;
        if (seektime >= queue.songs[0].duration - queue.currentTime) seektime = 0;
        

        //seek
        client.distube.seek(message, Number(seektime));

        //send information message
        functions.embedbuilder(client, 3000, message, config.colors.yes, "RETROCEDER!", `Retrocedeu a música para \`${args[0]} segundos\``)
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
