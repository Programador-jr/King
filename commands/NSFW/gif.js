const Discord = require("discord.js");

	module.exports = {
    name: "gif",
		category: "NSFW",
    run: async (client, message, args) => {

			 var superagent = require('superagent');

    if (!message.channel.nsfw) return message.channel.send(new Discord.MessageEmbed()
		.setColor("#ff0000")
		.setTitle('🔐 Você deve usar este comando em uma sala nsfw!')
		); 

    var lo = new Discord.MessageEmbed()
                .setDescription(`Por favor, espere...`)
                .setTimestamp()

    message.channel.send(lo).then(m => {

        superagent.get('https://nekobot.xyz/api/image').query({ type: 'pgif'}).end((err, response) => {

            var embed_nsfw = new Discord.MessageEmbed()
                .setDescription(`**[A imagem não está carregando? Clique aqui](${response.body.message})**`)
								.setColor('	#FF1493')
                .setTimestamp()
                .setImage(response.body.message)
            
            m.edit(embed_nsfw);
        });
    });
}
}