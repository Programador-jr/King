const Discord = require('discord.js')

module.exports = {
	name:"reverso",
	run:async (client, message, args, prefix) => {
    if(!args.join(" ")) return message.channel.send(` ${message.author}, eu preciso que você escreva algo após o comando \`${prefix}reverse <texto bacana>\``)
    message.channel.send(`${args.join(" ").split('').reverse().join('')}`)
}
}