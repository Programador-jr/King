const functions = require("../../functions")
const config = require("../../config.json")
module.exports = {
    name: "loop",
    cooldown: 5,
    category: "MUSIC COMMANDS",
    aliases: ["repeat"],
    useage: "loop <0/1/2> |",
    description: "Enables loop for off / song / queue*\n0 = off\n1 = song\n2 = queue",
    run: async (client, message, args) => {
        ///if not a dj, return error
        if (functions.check_if_dj(message))
            return functions.embedbuilder(client, 6000, message, config.colors.no, "DJ-ROLE", `❌ Você não tem permissão para este comando! Você precisa ter: ${functions.check_if_dj(message)}`)

        //If Bot not connected, return error
        if (!message.guild.me.voice.channel) return functions.embedbuilder(client, 3000, message, config.colors.no, "Nada tocando!")

        //if member not connected return error
        if (!message.member.voice.channel) return functions.embedbuilder(client, 5000, message, config.colors.no, "`" + message.author.tag + "`" + " Você deve entrar em um canal de voz")

        //if they are not in the same channel, return error
        if (message.member.voice.channel.id != message.guild.me.voice.channel.id) return functions.embedbuilder(client, 5000, message, config.colors.no, "`" + message.author.tag + "`" + " Você deve entrar no meu canal de voz: " + ` \`${message.guild.me.voice.channel.name ? message.guild.me.voice.channel.name : ""}\``)

        //if no arguments return error
        if (!args[0]) return functions.embedbuilder(client, 5000, message, config.colors.no, "`" + message.author.tag + "`" + " Por favor, adicione as opções de estilo de loop que deseja alterar", `Opções Válidas:\n\n\`0\`   /   \`1\`   /   \`2\`\n\`off\` / \`musica\` / \`fila\``)

        //set variable
        let loopis = args[0];
        if (args[0].toString().toLowerCase() === "musica") loopis = "1";
        else if (args[0].toString().toLowerCase() === "fila") loopis = "2";
        else if (args[0].toString().toLowerCase() === "off") loopis = "0";
        else if (args[0].toString().toLowerCase() === "s") loopis = "1";
        else if (args[0].toString().toLowerCase() === "m") loopis = "2";
        else if (args[0].toString().toLowerCase() === "disable") loopis = "0";
        loopis = Number(loopis);

        //change loop state
        if (0 <= loopis && loopis <= 2) {
            await client.distube.setRepeatMode(message, parseInt(args[0]));
            await functions.embedbuilder(client, 3000, message, config.colors.yes, "Modo de repetição definido para:", `${args[0].replace("0", "OFF").replace("1", "Repetir música").replace("2", "Repetir fila")}`)
            return;
        } else {
            return functions.embedbuilder(client, 3000, message, config.colors.no, "ERROR", `Use um número entre ** 0 ** e ** 2 ** | * (0: desabilitado, 1: Repete uma música, 2: Repete toda a fila)*`)
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
