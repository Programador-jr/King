const Discord = require("discord.js");

	module.exports = {
    name: "dance",
		usage: "dance",
		aliases: ["dançar", "dancar"],
		description: "",
    category: "diversão",
    run: async (client, message, args) => {

			var list = [
				'https://i.imgur.com/iHBQB6X.gif',
				'https://i.imgur.com/EcZibMp.gif',
				'https://steamuserimages-a.akamaihd.net/ugc/398926042169055222/1954C0622BA4CFF255769F3DD3840C9D01D19BEC/',
				'https://i.imgur.com/Crlf6Rq.gif',
				'https://i.pinimg.com/originals/79/78/4b/79784b3ff65b7dd598678f62af8e4825.gif',
				'https://i.imgur.com/ZmjRmjw.gif',
				'https://i.imgur.com/vZIfKDs.gif',
				'https://i.imgur.com/pBm2v7f.gif?noredirect',
				'https://i.imgur.com/tIW2E33.gif',
				'https://media.tenor.com/images/a2ea424348ec7fc22f1a8e4f3108dfcf/tenor.gif',
				'https://i.pinimg.com/originals/6a/0a/e0/6a0ae09d4b593283ab17538900173c6a.gif',
				'https://i.imgur.com/BbIar.gif',
				'https://i.imgur.com/iykYjNL.gif',
				'https://i.imgur.com/LZ38e38.gif',
				'https://i.imgur.com/ib52i1D.gif',
				'https://i.pinimg.com/originals/50/36/33/5036339e01ecebe508a720c28805a7a2.gif',
				'https://i.imgur.com/Ox39WkA.gif'

];

var rand = list[Math.floor(Math.random() * list.length)];

  const embed = new Discord.MessageEmbed()
        .setTitle('')
        .setColor('#8A2BE2')
        .setDescription(` ${message.author} `)
        .setImage(rand)
        .setTimestamp()
        .setFooter('king')
  await message.channel.send(embed);
        
    }
};