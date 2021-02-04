const Discord = require('discord.js');

module.exports = {
	name:"bye",
	category:"encenação",
	aliases:["tchau", "adeus", "acenar"],
	
	run: async(client, message, args) => {
		var list = [
		
			'https://i.imgur.com/IMb9rAx.gif',
			'https://i.imgur.com/DKT4tjt.gif?noredirect',
			'https://data.whicdn.com/images/245075010/original.gif',
			'https://i.pinimg.com/originals/3c/de/3e/3cde3e1fe79e02abdc287395f57d8578.gif',
			'https://i.imgur.com/14inA9e.gif',
			'https://i.imgur.com/2tk9rzw.gif',
			'https://pa1.narvii.com/6211/90ef8c4ce7e0bd8737177fbdcc8114f440702c86_hq.gif',
			'https://pa1.narvii.com/7008/31adf590be3c64a4bcb7866406464839e74458ecr1-500-248_hq.gif',
			'https://i.makeagif.com/media/7-19-2018/AHVvti.gif',
			'https://i.pinimg.com/originals/73/5a/ae/735aae6168d430d11af5b0bc3e724134.gif',
		];

		var rand = list[Math.floor(Math.random() * list.length)];

		const embed = new Discord.MessageEmbed()
				.setTitle('')
        .setColor('#00bfff')
        .setDescription(`${message.author} acenou`)
        .setImage(rand)
        .setTimestamp()
        .setFooter('king')
		await message.channel.send(embed);			
	}
}