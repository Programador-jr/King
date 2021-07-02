const functions = require("../../functions")
const config = require("../../config.json")
module.exports = {
    name: "avançar",
    category: "MUSIC COMMANDS",
    aliases: ["fwd", "for"],
    useage: "forward <DURATION>",
    description: "Forwards the Song forward: seconds",
    run: async (client, message, args) => {
        //if not a dj, return error
        if (functions.check_if_dj(message))
            return functions.embedbuilder(client, 6000, message, config.colors.no, "DJ-ROLE", `❌ Você não tem permissão para este comando! Você precisa ter: ${functions.check_if_dj(message)}`)

        //If Bot not connected, return error
        if (!message.guild.me.voice.channel) return functions.embedbuilder(client, 3000, message, config.colors.no, "Nada tocando!")

        //if member not connected return error
        if (!message.member.voice.channel) return functions.embedbuilder(client, 5000, message, config.colors.no, "`" + message.author.tag + "`" + " Você deve entrar em um canal de voz")

        //if they are not in the same channel, return error
        if (message.member.voice.channel.id != message.guild.me.voice.channel.id) return functions.embedbuilder(client, 5000, message, config.colors.no, "`" + message.author.tag + "`" + " Você deve entrar no meu canal de voz: " + ` \`${message.guild.me.voice.channel.name ? message.guild.me.voice.channel.name : ""}\``)

        //get queue
        let queue = client.distube.getQueue(message);
        
        //if no queue return error
        if (!queue) return functions.embedbuilder(client, 3000, message, config.colors.no, "Não há nada tocando!");

        //get the seektime
        let seektime = queue.currentTime + Number(args[0]) * 1000;
        if (seektime >= queue.songs[0].duration * 1000) seektime = queue.songs[0].duration * 1000 - 1;
        
        //seek 
        client.distube.seek(message, Number(seektime));
        
        //Send info message
        functions.embedbuilder(client, 3000, message, config.colors.yes, "AVANÇADO!", `Avançou a musica por \`${Number(args[0])} segundos\``)
    }
};
