const functions = require("../../functions")
const config = require("../../config.json")
module.exports = {
    name: "sleeptimer",
    category: "utilidade",
    aliases: ["sleep"],
    useage: "sleeptimer <Duração em horas>",
    description: "Define um temporizador de suspensão que interromperá o bot / deixará o canal e o expulsará do canal após as horas de duração que você definiu",
    run: async (client, message, args) => {
        //if not a dj, return error
        if (functions.check_if_dj(message))
            return functions.embedbuilder(client, 6000, message, config.colors.no, "DJ-ROLE", `❌ Você não tem permissão para este comando! Você need to have: ${functions.check_if_dj(message)}`)

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
        
        //if no args return error
        if (!args[0]) return functions.embedbuilder(client, 5000, message, config.colors.no, "`" + message.author.tag + "`" + "Por favor, adicione a quantidade do \"sleep\" que você deseja adicionar, em horas, por favor.")
       
        //send information message 
        functions.embedbuilder(client, "null", message, config.colors.no, "Temporizador definido",` Vou deixar o canal em \`${args[0]} horas\``)
        
        //wait until the time ended
        setTimeout(() => {
            //Send information message
            functions.embedbuilder(client, "null", message, config.colors.no, "PARADO", `Saiu do canal`)
            //kick the user
            message.member.voice.setChannel(null)
            //send information to the user
            message.author.send(`Durma bem, ${message.author} :zzz:`).catch(e=>console.log("zzz"));
            //stop distube
            client.distube.stop(message);
            //leave the channel
            message.member.voice.channel.leave().catch(e=>console.log("zzz"));
        }, Number(args[0]) * 1000 * 60 * 60)
    }
};