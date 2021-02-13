const Discord = require('discord.js');

module.exports = {
	name:"morrer",
	category:"ação",
	aliases:["die"],

	run: async(client, message, args) => {
		var list = [

				'https://i.pinimg.com/originals/60/73/8a/60738afd01ff17db156ceab784244fd1.gif',
				'https://data.whicdn.com/images/300095706/original.gif',
				'https://cdn.zerotwo.dev/WASTED/04f8f44f-b367-4717-b85d-07d7cb00258e.gif',
				'https://cdn.zerotwo.dev/WASTED/f57a03fd-9eb3-49e0-979d-627d76f39eb7.gif',
				'https://i.pinimg.com/originals/11/bb/5e/11bb5e84bcc76e190c23ead6db8ec2d8.gif',
				'https://i.pinimg.com/originals/fc/c7/2f/fcc72ff4660a0a7b4ed1088e3d153ce9.gif',
				'https://cdn.zerotwo.dev/WASTED/b6426ebd-6e54-48f3-839c-a0ffa46a6e53.gif',
				'https://pa1.narvii.com/6010/27c954c9b7051ec75e75b7fc14896b077b7eb0be_hq.gif',
				'https://media1.tenor.com/images/5dee3f831518bb6e8072a0baedc9811a/tenor.gif?itemid=18511957',
				'https://i.makeagif.com/media/5-22-2015/1-XKhU.gif',
				'https://media.tenor.com/images/dc6e7f7f9ecb8276569a80acc1e7c9f7/tenor.gif',
				'https://pa1.narvii.com/6686/573793853a30766bf2b4283ad0ee5673498de63c_hq.gif',
				'http://static.tumblr.com/qwclk8l/ZAlm41aaf/kubodera.gif',
				'https://vidaanimesempre.files.wordpress.com/2014/07/tumblr_m3lepsvq4j1r9x610.gif',
				'http://cdn.lowgif.com/small/a0ec4d4788ee6ecc-chelsea-pior-morte-de-akame-ga-kill-japon-s-para-animes.gif',
				'https://31.media.tumblr.com/1dd8c4f979fb9090eb192d65233a62cf/tumblr_myjwy43BMc1soxa4vo1_500.gif',
		];

		var rand = list[Math.floor(Math.random() * list.length)];

		const embed = new Discord.MessageEmbed()
					.setTitle()
					.setDescription(`${message.author} está morto 😔`)
					.setColor('#ff0000')
					.setImage(rand)
					.setFooter('King')			
	await message.channel.send(embed); 
	}
}