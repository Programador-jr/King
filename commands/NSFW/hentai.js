const Discord = require("discord.js");
const errors = require('../../assets/json/errors');
module.exports = {
	name: "hentai",
	category: "NSFW",
	run:async (client, message, args) => {
		message.delete({timeout: 5000})
    var superagent = require('superagent');

        var errMessage = errors[Math.round(Math.random() * (errors.length - 1))];
        if (!message.channel.nsfw) {
            message.react('💢');
            return message.channel.send(new Discord.MessageEmbed()
						.setColor('#ff0000')
						.setTitle(errMessage)).then(msg => {
      msg.delete({ timeout: 5000 })
      })
        } 

    var lo = new Discord.MessageEmbed()
                .setDescription(`Por favor, espere...`)
                .setTimestamp()

    message.channel.send(lo).then(m => {

        superagent.get('https://nekobot.xyz/api/image').query({ type: 'hentai'}).end((err, response) => {

            var embed_nsfw = new Discord.MessageEmbed()
                .setTimestamp()
								.setFooter(message.author.username)
								.setTitle('Aqui está sua imagem...👀')
								.setColor('#FF1493')
								.setDescription(`**[A imagem não está carregando? Clique aqui](${response.body.message})**`)
                .setImage(response.body.message)
            
            m.edit(embed_nsfw);
        });
    });
}
}