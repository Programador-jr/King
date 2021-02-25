const {MessageEmbed} = require('discord.js');
const fetch = require('node-fetch');

module.exports = {
	name:"supreme",
	run:async (client, message, args) => {
		
		let say = message.content.split(" ").slice(1).join(" ")
			if(!say) return message.channel.send("não posso repetir mensagens em branco")
			const data = await fetch(`https://elevicky.sirv.com/supreme.jpg?w=425&h=130&scale.option=ignore&text.0.text=${say}&text.0.color=fefefe`)

			const embed = new MessageEmbed()
					.setAuthor(message.author.username + "#" + message.author.discriminator,message.author.displayAvatarURL())
					.setFooter(message.author.username)
					.setColor("RED")
					.setDescription(`[A imagem não está carregando? clique aqui](${data.url})`)
					.setImage(`${data.url}`)
					.setTimestamp();

			message.channel.send(embed);		
	}
}