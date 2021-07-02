const functions = require("../../functions")
const config = require("../../config.json")
module.exports = {
    name: "jump",
    cooldown: 5,
    category: "MUSIC COMMANDS",
    aliases: ["skipto"],
    useage: "jump <Query number>",
    description: "Jump to a song in the Queue",
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

        //if no args return error
        if (!args[0]) return functions.embedbuilder(client, 5000, message, config.colors.no, "`" + message.author.tag + "`" + " Please add the Position to which you want to jump to")

        //get queue
        let queue = client.distube.getQueue(message);
        
        //if no queue return error
        if (!queue) return functions.embedbuilder(client, 3000, message, config.colors.no, "There is nothing playing!");

        if (0 <= Number(args[0]) && Number(args[0]) <= queue.songs.length) {
            functions.embedbuilder(client, 3000, message, config.colors.yes, "SUCESSO", `pulou ${parseInt(args[0])} musicas!`)
            return client.distube.jump(message, parseInt(args[0]))
                .catch(err => message.channel.send("Número da música inválido."));
        } else {
            return functions.embedbuilder(client, 3000, message, config.colors.no, "ERROR", `Use um número entre ** 0 ** e **${DisTube.getQueue(message).length}**   |   *(0: desativado, 1: Repete uma música, 2: Repete toda a fila)*`)
        }
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
