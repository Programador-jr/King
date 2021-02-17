const Discord = require("discord.js");
const errors = require('../../assets/json/errors');
const nekoclient = require('nekos.life');
const neko = new nekoclient();

module.exports = {
	name: "neko",
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
                .setDescription(`Por favor espere...`)
                .setTimestamp()

    message.channel.send(lo).then(m => {

        superagent.get('https://nekobot.xyz/api/image').query({ type: 'hneko'}).end((err, response) => {

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