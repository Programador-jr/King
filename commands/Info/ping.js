const { MessageEmbed } = require('discord.js');
var ee = require(`../../botconfig/embed.json`)
module.exports = {
        name: "ping",
        description: "Exibe a latência do usuário e do bot",
        category: "Info",

    run: async (client, message, args) => {

			let start = Date.now();

        message.channel.send("**Parece que o bot está lento...**").then(m => {

						let end = Date.now();
            let ping = m.createdTimestamp - message.createdTimestamp
            const embed = new MessageEmbed()
								.setAuthor("🏓 | Pong!", message.author.avatarURL())
                .setColor("#00FA9A")
 								.addField("Latência da API", `\`${Math.round(client.ws.ping)}ms\``, true)
								.addField("latência do Usuário", `\`${end - start}ms\``, true)
								.setFooter(ee.footertext, ee.footericon);
            message.channel.send({ embeds: [embed]})
            m.delete()
        })
    }
};