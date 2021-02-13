const Discord = require('discord.js');

module.exports = {
	name:"aplaudir",
	category:"ação",
	aliases:["clap"],

	run: async(client, message, args) => {
		var list = [

				'https://i.gifer.com/7ddb.gif',
				'http://24.media.tumblr.com/tumblr_lxf91q2UG61r6xjb6o1_500.gif',
				'https://thumbs.gfycat.com/RareFantasticGrebe-small.gif',
				'https://i.pinimg.com/originals/d0/5b/2a/d05b2aad6a19944ba378d8e365851f00.gif',
				'https://data.whicdn.com/images/250554054/original.gif',
				'https://pa1.narvii.com/6443/dcb690267167192e538563430a6612a27d0f2388_hq.gif',
				'https://i.pinimg.com/originals/8b/f8/fe/8bf8feb807b3237c48ae65c5daa16042.gif',
				'http://cdn.lowgif.com/full/81f183176c22568c-.gif',
				'https://static.zerochan.net/Black.Goku.full.2664791.gif',
				'https://i.gifer.com/Iec9.gif',
				'https://thumbs.gfycat.com/BruisedTidyAsiaticmouflon-size_restricted.gif',
		];

		var rand = list[Math.floor(Math.random() * list.length)];

		const embed = new Discord.MessageEmbed()
					.setDescription(`${message.author} aplaudiu`)
					.setColor('#00bfff')
					.setImage(rand)
					.setFooter('King')			
	await message.channel.send(embed); 
	}
}