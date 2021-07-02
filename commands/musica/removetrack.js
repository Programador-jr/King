const functions = require("../../functions")
const config = require("../../config.json")
module.exports = {
    name: "removetrack",
    category: "MUSIC COMMANDS",
    aliases: ["rt"],
    useage: "removetrack <Queury Number>",
    description: "Removes a Specific Track",
    run: async (client, message, args) => {
        //if not a dj, return error
        if (functions.check_if_dj(message))
            return functions.embedbuilder(client, 6000, message, config.colors.no, "DJ-ROLE", `❌ Você não tem permissão para este comando! Você precisa ter: ${functions.check_if_dj(message)}`)

        //If Bot not connected, return error
        if (!message.guild.me.voice.channel) return functions.embedbuilder(client, 3000, message, config.colors.no, "Nada tocando!")

        //if member not connected return error
        if (!message.member.voice.channel) return functions.embedbuilder(client, 5000, message, config.colors.no, "`" + message.author.tag + "`" + "Você deve entrar em um canal de voz")

        //if they are not in the same channel, return error
        if (message.member.voice.channel.id != message.guild.me.voice.channel.id) return functions.embedbuilder(client, 5000, message, config.colors.no, "`" + message.author.tag + "`" + " Você deve entrar no meu canal de voz: " + ` \`${message.guild.me.voice.channel.name ? message.guild.me.voice.channel.name : ""}\``)

        //get queue
        let queue = client.distube.getQueue(message);
        
        //if no queue return error
        if (!queue) return functions.embedbuilder(client, 3000, message, config.colors.no, "Não há nada tocando!");

        //if no args return
        if (!args[0]) return functions.embedbuilder(client, 3000, message, config.colors.no, "Por favor, adicione a posição da trilha que você deseja remover");
        
        //if args too big
        if (isNaN(args[0]) || Number(args[0]) >= queue.songs.length) return functions.embedbuilder(client, 3000, message, config.colors.no, "Sua posição de música está fora do intervalo! Máx.: " + queue.songs.length);

        //save the current track on a variable
        var track = queue.songs[Number(args[0])]

        //clear the queue
        queue.songs.splice(Number(args[0]), Number(args[0]) + 1);
        
        //Send info message
        functions.embedbuilder(client, 3000, message, config.colors.yes, "Removeu totalmente sua trilha com sucesso", `[${track.name}](${track.url})`)
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
