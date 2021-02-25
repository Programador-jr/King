const Discord = require("discord.js"); 

module.exports = {
  name: "avatar",
  category: "utilidade",
  description: "Exibe o avatar de um usuário",
  usage: "avatar",

run: async (client, message, args) => {

    let user = message.mentions.users.first() || client.users.cache.get(args[0]) || message.author;
  
  let avatar = user.avatarURL({ dynamic: true, format: "png", size: 1024 });

  let embed = new Discord.MessageEmbed() 
    .setColor(`RANDOM`) 
    .setTitle(`Avatar de ${user.username}`)
		.setDescription(`[Download](${message.author.avatarURL({ dynamic: true, size: 1024 })})`)
    .setImage(avatar) 
    .setFooter(`• Autor: ${message.author.tag}`, message.author.displayAvatarURL({format: "png"}));
 await message.channel.send(embed);

		}

};