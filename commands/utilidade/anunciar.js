const Discord = require ('discord.js')
const { MessageEmbed } = require('discord.js')

module.exports = {
name: "anunciar",
aliases: ["announce", "a"],
category: "Utility",
usage: "embed <text to say>",
description: "Retorna o texto fornecido em embed",
run: async(client, message, args) => {
  if(!message.member.hasPermission("ADMINISTRATION")) return message.channel.send(`VOCÊ NÃO TEM PERMISSÃO`)
 await message.delete()
  let say = message.content.split(" ").slice(1).join(" ")
  if(!say) return message.channel.send(`❌ | `+"Não consigo repetir mensagem em branco")
  let embed = new MessageEmbed()
.setAuthor(message.author.username, message.author.avatarURL())
  .setDescription(`${say}`)
  .setColor("#00bfff")
.setFooter(` ${message.guild}`)
.setTimestamp()
  message.channel.send(embed)
}
}