const Discord = require("discord.js");
module.exports = {
	name: "pussy",
	category: "NSFW",
	run:async (client, message, args) => {

    var superagent = require('superagent');

    if (!message.channel.nsfw) return message.channel.send('Você deve usar este comando em uma sala nsfw 🔞!') 

    var lo = new Discord.MessageEmbed()
                .setDescription(`Por favor, espere...`)
                .setTimestamp()

    message.channel.send(lo).then(m => {

        superagent.get('https://nekobot.xyz/api/image').query({ type: 'pussy'}).end((err, response) => {

            var embed_nsfw = new Discord.MessageEmbed()
								.setTitle('Aqui está sua imagem...👀')
                .setDescription(`**[A imagem não está carregando? Clique aqui](${response.body.message})**`)
                .setTimestamp()
								.setColor('#FF1493')
                .setImage(response.body.message)
            
            m.edit(embed_nsfw);
        });
    });
}
}