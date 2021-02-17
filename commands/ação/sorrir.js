const Discord = require('discord.js');

module.exports = {
	name:"sorrir",
	category:"ação",
	aliases:["smile"],

	run: async(client, message, args) => {
		var list = [

				'https://i.imgur.com/aEoayz7.gif?noredirect',
				'https://i.imgur.com/I5hSuVU.gif?noredirect',
				'https://i.imgur.com/LKdRwZf.gif',
				'https://i.imgur.com/TbPmbTt.gif',
				'https://i.imgur.com/ACZ83Ss.gif',
				'http://i.imgur.com/Y5o48VW.gif',
				'https://i.imgur.com/lUYJXjj.gif',
				'https://i.pinimg.com/originals/63/ca/58/63ca58fb23c0901176abf1787fa3bfce.gif',
				'https://i.imgur.com/DfSRL87.gif',
				'https://i.imgur.com/1DlgrAo.gif',
				'https://i.imgur.com/9uzmcJd.gif',
				'https://media1.tenor.com/images/cf8a83dbdf57ae8b6bd15353d1c2bb86/tenor.gif?itemid=17477956',
				'https://thumbs.gfycat.com/OblongAdoredGoshawk-small.gif',
				'https://i.imgur.com/adLtf5i.gif',
				'https://i.pinimg.com/originals/b6/d8/cd/b6d8cd4cfa75ef5f5fe093ecb880e624.gif',
				'https://i.imgur.com/BYeAoax.gif',
				'https://i.imgur.com/PMISWXv.gif',
				'https://i.imgur.com/LQ1i024.gif',
				'https://i.pinimg.com/originals/82/b3/9c/82b39c323ca376e9bb5844a54973fc42.gif',
		];

		var rand = list[Math.floor(Math.random() * list.length)];

		const embed = new Discord.MessageEmbed()
					.setTitle()
					.setDescription(`${message.author} 😁 `)
					.setColor('#00bfff')
					.setImage(rand)
					.setFooter('King')			
	await message.channel.send(embed); 
	}
}