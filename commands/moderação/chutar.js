const discord = require("discord.js");

module.exports = {
  name: "chutar",
  category: "moderação",
  description: "Expulse qualquer membro do servidor",
	aliases: ["kick", "chute"],
  usage: "chutar <@user> <motivo>",
  run: (client, message, args) => {
    
    if(!message.member.hasPermission("KICK_MEMBERS")) {
      return message.channel.send(`**${message.author.username}**, Você é fraco, lhe falta permissão de Expulsar_membros `)
    }
    
    if(!message.guild.me.hasPermission("KICK_MEMBERS")) {
      return message.channel.send(`**${message.author.username}**, Eu não tenho permissão o suficiente para usar este comando`)
    }

		if(user.id === message.guild.owner.id) {
      return message.channel.send("Seu idiota, como você pode expulsar o dono do servidor -_-")
    }
    
    let target = message.mentions.members.first();
    
    if(!target) {
      return message.channel.send(`**${message.author.username}**, Por favor, mencione a pessoa que você deseja chutar`)
    }
    
    if(target.id === message.author.id) {
     return message.channel.send(`**${message.author.username}**, Você não pode se chutar`)
    }
    
  if(!args[1]) {
    return message.channel.send(`**${message.author.username}**, Por favor, dê um motivo para expulsar`)
  }
    
    let embed = new discord.MessageEmbed()
    .setTitle("Ação: Expulsar")
    .setDescription(`Expulso ${target} (${target.id})`)
    .setColor("#ff2050")
    .setFooter(`Expulso por ${message.author.username}`);
    
    message.channel.send(embed)
    
    target.kick(args[1]);
    
    
    
  }
}