const discord = require("discord.js");

module.exports = {
  name: "ping",
  category: "utilidade",
  description: "Obter ping do bot",
  usage: "ping",
  run: async (client, message, args) => {
		
		let start = Date.now();

		message.channel.send({embed:
		{description: "Parece que o bot está lento",
		color: "#00FA9A"
		}}).then(m =>{
			let end = Date.now();
			let embed = new discord.MessageEmbed()
			.setAuthor("🏓 | Pong!", message.author.avatarURL())
			.addField("Latência da API", Math.round(client.ws.ping)+"ms", true)
			.addField("latência de Mensagen", end - start + "ms", true)
			.setColor("#00FA9A");
			m.edit(embed).catch(e => message.channel.send(e))
		})
  }
};