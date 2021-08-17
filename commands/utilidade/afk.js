const db = require('quick.db')
const { MessageEmbed } = require('discord.js')

module.exports = {
    name : 'afk',
    run : async(client, message, args) => {
        const roleColor =
      message.guild.me.displayHexColor === "#000000"
        ? "#ffffff"
        : message.guild.me.displayHexColor;

        const content = args.join(" ") || "Nenhum motivo fornecido."
        await db.set(`afk-${message.author.id}+${message.guild.id}`, content)

        const embed = new MessageEmbed()
        .setDescription(`Você foi definido como AFK.\n**Motivo:** ${content}`)
        .setColor(roleColor)
        .setAuthor(message.author.tag, message.author.displayAvatarURL({ dynamic : true }))
        message.channel.send(embed)
    }
}