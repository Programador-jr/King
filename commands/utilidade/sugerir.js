const { MessageEmbed } = require("discord.js")


module.exports = {
  name: "sugerir",
	aliases: ["sugestão"],
  usage: "sugerir <mensagem>",
  description: "Envie sua sugestão",
  category: "utilidade",
  run: (client, message, args) => {
    
		message.delete()

    if(!args.length) {
      return message.channel.send(new MessageEmbed()
			.setColor('#FF0000')
			.setTitle("Por favor, mande a sua sugestão")
			).then(msg => {
      msg.delete({ timeout: 4000 })
      })
    }
    
    let channel = message.guild.channels.cache.find((x) => (x.name === "sugestão" || x.name === "sugestões"))
    
    
    if(!channel) {
      return message.channel.send(new MessageEmbed()
			.setColor('#ff0000')
			.setTitle("não existe um canal com o nome `sugestões` ou `sugestão` nesse servidor")
			).then(msg => {
      msg.delete({ timeout: 4000 })
      })
    }
                                                    
    
    let embed = new MessageEmbed()
    .setAuthor("sugestão de: " + message.author.tag, message.author.avatarURL())
    .setThumbnail(message.author.avatarURL())
    .setColor("#FF0000")
    .setDescription(args.join(" "))
    .setTimestamp()
    
    
    channel.send(embed).then(m => {
      m.react("✅")
      m.react("❌")
    })
    

    
    message.channel.send(`Sugestão enviada para ${channel}`).then(msg => {
      msg.delete({ timeout: 4000 })
			msg.react("<:suzushi:788848956875997205>")
      })
    
  }
}