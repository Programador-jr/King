const functions = require("../../functions")
const config = require("../../config.json")
const path = require("path");
module.exports = {

    name: path.parse(__filename).name,
    category: "filtros",
    useage: `<${path.parse(__filename).name}>`,
    description: "*Adiciona um filtro chamado " + path.parse(__filename).name,
    run: async (client, message, args) => {
        //if not a dj, return error
        if (functions.check_if_dj(message))
            return functions.embedbuilder(client, 6000, message, config.colors.no, "DJ-ROLE", `<a:declined:876968121116807208> Você não têm permissão para usar esse comando! você precisa têr: ${functions.check_if_dj(message)}`)

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

        //get the filter from the content
        let filter = path.parse(__filename).name;

        //if its the same filter as the current one, use bassboost6
        if (filter === queue.filter) filter = "bassboost6";

        //set the new filter
        filter = await client.distube.setFilter(message, filter);

        //send information message
        await functions.embedbuilder(client, 3000, message, config.colors.yes, "Adicionando filtro!", filter)
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
