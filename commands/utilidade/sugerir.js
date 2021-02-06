const { MessageEmbed } = require("discord.js")


module.exports = {
  name: "sugerir",
	aliases: ["sugestão"],
  usage: "sugerir <mensagem>",
  description: "Envie sua sugestão",
  category: "utilidade",
  run: (client, message, args) => {
    
    if(!args.length) {
      return message.channel.send("Por favor, dê a sugestão")
    }
    
    let channel = message.guild.channels.cache.find((x) => (x.name === "sugestão" || x.name === "sugestões"))
    
    
    if(!channel) {
      return message.channel.send("não há canal com nome - sugestões")
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
    

    
    message.channel.send("Enviou sua sugestão para " + channel)
    
  }
}