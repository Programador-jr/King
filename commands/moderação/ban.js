const discord = require("discord.js");

module.exports = {
  name: "ban",
  category: "moderação",
  description: "Banir qualquer pessoa do servidor ",
  usage: "ban <@user> <motivo>",
  run: async (client, message, args) => {
    
    if(!message.member.hasPermission("BAN_MEMBERS")) {
      return message.channel.send(`**${message.author.username}**, Você não tem permissão para banir alguém`)
    }
    
    if(!message.guild.me.hasPermission("BAN_MEMBERS")) {
      return message.channel.send(`**${message.author.username}**, Eu não tenho permissão para banir alguém`)
    }

		if(user.id === message.guild.owner.id) {
      return message.channel.send("Seu idiota, como você pode banir o dono do servidor -_-")
    }
    
    const target = message.mentions.members.first();
    
    if(!target) {
      return message.channel.send(`**${message.author.username}**, Mencione a pessoa que você deseja banir.`)
    }
    
    if(target.id === message.author.id) {
      return message.channel.send(`**${message.author.username}**, Você não pode se banir!`)
    }
    
   
    
   if(!args[1]) {
     return message.channel.send(`**${message.author.username}**, Por favor, dê um motivo para banir um membro`)
   }
    
    let embed = new discord.MessageEmbed()
    .setTitle("Ação : Ban")
    .setDescription(`Banido ${target} (${target.id})`)
    .setColor("#ff2050")
    .setThumbnail(target.avatarURL)
    .setFooter(`Banido por ${message.author.tag}`);
    
    message.channel.send(embed)
    target.ban(args[1])
    
    
    
  }
}