const { MessageEmbed } = require("discord.js")
const db = require("quick.db")

module.exports = {
  name: "warn",
  category: "moderação",
	aliases: ["advertir", "avisar", "aviso"],
  usage: "warn <@menção> <motivo>",
  description: "Advertir quem não obedece às regras",
  run: async (client, message, args) => {
    
    if(!message.member.hasPermission("ADMINISTRATOR")) {
      return message.channel.send("Você deve ter permissões de administrador para usar este comando!")
    }
    
    const user = message.mentions.members.first()
    
    if(!user) {
      return message.channel.send("Mencione a pessoa a quem deseja advertir `warn @user <motivo>`")
    }
    
    if(message.mentions.users.first().bot) {
      return message.channel.send("Você não pode advertir os bots")
    }
    
    if(message.author.id === user.id) {
      return message.channel.send("Você não pode se advertir")
    }
    
    if(user.id === message.guild.owner.id) {
      return message.channel.send("Seu idiota, como você pode advertir o dono do servidor -_-")
    }
    
    const reason = args.slice(1).join(" ")
    
    if(!reason) {
      return message.channel.send("Forneça um motivo para avisar `warn @user <motivo>`")
    }
    
    let warnings = db.get(`warnings_${message.guild.id}_${user.id}`)
    
    if(warnings === 3) {
      return message.channel.send(`${message.mentions.users.first().username} já atingiu seu limite com 3 avisos`)
    }
    
    if(warnings === null) {
      db.set(`warnings_${message.guild.id}_${user.id}`, 1)
      user.send(`Você foi avertido em **${message.guild.name}** por ${reason}`)
      await message.channel.send(`Você adverteu **${message.mentions.users.first().username}** por ${reason}`)
    } else if(warnings !== null) {
        db.add(`warnings_${message.guild.id}_${user.id}`, 1)
       user.send(`Você foi advertido em **${message.guild.name}** por ${reason}`)
      await message.channel.send(`Você adverteu **${message.mentions.users.first().username}** por ${reason}`)
    }
    
  
  } 
}