const Discord = require("discord.js");
module.exports = {
	name: "lewd",
	category: "NSFW",
	run:async (client, message, args) => {

    var superagent = require('superagent');

  var errMessage =(new Discord.MessageEmbed()
	.setColor('#FF0000')
	.setTitle("🔐 Você deve usar este comando em uma sala nsfw!")
	);
  if (!message.channel.nsfw) {
      message.react('💢');

      return message.reply(errMessage)
      .then(msg => {
      msg.delete({ timeout: 4000 })
      })
      
  }
    var lo = new Discord.MessageEmbed()
                .setDescription(`Por favor, espere...`)
                .setTimestamp()

    message.channel.send(lo).then(m => {

        superagent.get('https://nekobot.xyz/api/image').query({ type: 'lewd'}).end((err, response) => {

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