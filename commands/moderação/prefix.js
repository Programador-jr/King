const {MessageEmbed} = require('discord.js');
const db = require("quick.db")
const { default_prefix } = require("../../config.json")

module.exports = {
  name: "prefix",
  category: "moderação",
  usage: "prefix <NovoPrefixo>",
	aliases:["setprefix", "newprefix", "prefixo"],
  description: "Mude meu prefixo neste servidor",
  run: async (client, message, args) => {
	let prefix = await db.get(`prefix_${message.guild.id}`)
    if(prefix === null) prefix = default_prefix;

    //reagir com aprovar emoji
    message.react("✅");

    if(!args[0]) return message.channel.send(new MessageEmbed()
    .setColor("#FF0000")
    .setTitle(`Prefixo Atual: \`${prefix}\``)
    .setFooter('Forneça um novo prefixo')
    );

		if(args[0].length > 3) return message.channel.send(new MessageEmbed()
		.setColor("#FF0000")
    .setFooter("Você não pode enviar prefixo com mais de 3 caracteres")
		);
    
    if(!message.member.hasPermission("ADMINISTRATOR")) return message.reply(new MessageEmbed()
    .setColor("#FF0000")
    .setTitle(`🚫 Você não tem permissão para este comando!`)
    );

    if(args[1]) return message.channel.send(new MessageEmbed()
    .setColor("#FF0000")
    .setTitle(`'❗O prefixo não pode ter dois espaços'`));

    db.set(`prefix_${message.guild.id}`, args[0])
  	 message.channel.send(new MessageEmbed()
    .setColor("#F0EAD6")
    .setTitle(`✅ Prefixo do bot definido para para **\`${args[0]}\`**`))
    
  }
}