const { MessageEmbed } = require("discord.js");
module.exports = {
  name: "bug",
category: "setup",
run : async function(client, message, args) { 

  if (!args[0]) return message.reply("Por favor especifique o bug.");   
    
  args = args.join(" ");   
  message.reply("Obrigado por enviar o bug!"); 
  
  
  let embed = new MessageEmbed()
  .setTitle(`Bugs relatados`)
  .addDescription(`**Reportado por:** ${message.author.username}#${message.author.discriminator}
  **UserID:** ${message.author.id} 
  **Bugs:** ${args}
  **No servidor**: ${guild.name} ${guild.id}`)
  .setColor("#00bfff"); 
  
  
  client.channels.cache.get('865255179788222485').send(embed)
  
	}
};