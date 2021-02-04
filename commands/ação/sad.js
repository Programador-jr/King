const Discord = require('discord.js');

module.exports = {
	name:"sad",
	category:"encenação",
	aliases:["triste"],

	run: async(client, message, args) => {
		var list = [

				'https://i.imgur.com/Bvc3jIl.gif',
				'https://i.imgur.com/AnU248m.gif',
				'https://pa1.narvii.com/6367/530d0b98259b37f4616a9276502a84eb3962cc1f_hq.gif',
				'https://thumbs.gfycat.com/EnlightenedDimBluegill-size_restricted.gif',
				'https://data.whicdn.com/images/303410944/original.gif',
				'https://uploads.spiritfanfiction.com/fanfics/historias/202006/mais-bonita-do-que-eu-19580928-100620202323.gif',
				'https://i.imgur.com/IOgBpS7.gif',
				'https://uploads.spiritfanfiction.com/fanfics/historias/201804/eu-nunca-acreditei-no-amor-12768509-200420181947.gif',

		];

		var rand = list[Math.floor(Math.random() * list.length)];

		const embed = new Discord.MessageEmbed()
					.setTitle()
					.setDescription(`${message.author} está triste 😔`)
					.setColor('GREY')
					.setImage(rand)
					.setFooter('King')			
	await message.channel.send(embed); 
	}
}