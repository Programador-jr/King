const Discord = require("discord.js")
const config = require("../../config.json")
module.exports = {
    name: "votar",
    aliases: ["rate", "voto", "vote"],
    category: "INFORMATION COMMANDS",
    description: "Votos para King",
    useage: "vote",
    run: async (client, message, args) => {
        return message.reply(
            new Discord.MessageEmbed()
            .setColor(config.colors.yes)
            .setFooter(client.user.username, client.user.displayAvatarURL())
            .setTitle("Voto para King")
            .setURL("")
            .setDescription(`[Todos os votos são apreciados, OBRIGADO! <3]()`)
        )
    }
}
