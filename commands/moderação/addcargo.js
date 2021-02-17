//Comando criado com a ajuda do codigo original do
// WinG4merBR (https://github.com/BotFoxy/Foxy.git)
const Discord = require('discord.js')

module.exports = {
    name : 'addcargo',
		usage:"addcargo <@user> <@cargo>",
		description:"Adicione um cargo para um membro do servidor",
		aliases:["addrole", "adicionarcargo", "darcargo"],
   run:async (client, message, args) =>{
        let username = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
 
if (!message.member.hasPermission("MANAGE_ROLES")) return message.reply(new Discord.MessageEmbed()
.setColor('#ff0000')
.setTitle("Você não tem permissão `Gerenciar Cargos`")
); 

if (!message.guild.me.hasPermission("MANAGE_ROLES")) return message.reply(new Discord.MessageEmbed()
.setColor('#ff0000')
.setTitle("Eu não tenho permissão `Gerenciar Cargos`")
);

 if(!username) return message.reply(new Discord.MessageEmbed()
 .setColor('#ff0000')
 .setTitle(`Forneça um usuário válido para que eu possa adicionar um cargo a ele.`)
 );
 let cargo = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]) || message.guild.roles.cache.find(x => x.name === args.join(" "))
 
 if(!cargo) return message.reply(new Discord.MessageEmbed()
 .setColor('#ff0000')
 .setTitle(`Forneça um cargo válido para eu que eu possa adicionar ao usuário.`)
 );
 
 username.roles.add(cargo)
 
 const embed = new Discord.MessageEmbed()
 .setDescription(`**O cargo ${cargo} foi adicionado ao usuário ${username}**`)
 .setColor('GREEN')
 
 
 message.channel.send(embed)
    }
}