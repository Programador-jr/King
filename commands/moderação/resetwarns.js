const db = require("quick.db")

module.exports = {
  name: "resetwarns",
	category: "moderação",
  aliases: ["rwarns", "apagaravisos"],
  usage: "rwarns <@user>",
  description: "Redefinir avisos da pessoa mencionada",
  run: async (client, message, args) => {
    
    
    if(!message.member.hasPermission("ADMINISTRATOR")) {
      return message.channel.send("Você deve ter permissões de administrador para usar este comando")
    }
    
    const user = message.mentions.members.first()
    
    if(!user) {
    return message.channel.send("Mencione a pessoa cujo aviso você deseja redefinir")
    }
    
    if(message.mentions.users.first().bot) {
      return message.channel.send("Os bots não podem ter avisos")
    }
    
    if(message.author.id === user.id) {
      return message.channel.send("Você não tem permissão para redefinir seus avisos")
    }
    
    let warnings = db.get(`warnings_${message.guild.id}_${user.id}`)
    
    if(warnings === null) {
      return message.channel.send(`${message.mentions.users.first().username} não tem nenhum aviso`)
    }
    
    db.delete(`warnings_${message.guild.id}_${user.id}`)
    user.send(`Todos os seus avisos são redefinidos por
 ${message.author.username} de ${message.guild.name}`)
    await message.channel.send(`Todos os avisos de
 ${message.mentions.users.first().username}`)
    
  
    
}
}