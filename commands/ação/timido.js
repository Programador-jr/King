const Discord = require('discord.js');

module.exports = {
	name:"timido",
	category:"ação",
	aliases:["shy"],

	run: async(client, message, args) => {
		var list = [

				'https://i.imgur.com/LcraCIp.gif',
				'https://i.imgur.com/vST8kqa.gif?noredirect',
				'https://i.imgur.com/ammlfLn.gif',
				'https://i.imgur.com/CQit82w.gif',
				'https://i.imgur.com/V8wldlb.gif',
				'https://i.imgur.com/jsXDra1.gif',
				'https://i.pinimg.com/originals/f0/ef/6f/f0ef6feafada1ee18e2ad46a2563ab75.gif',
				'https://i.imgur.com/oGXojFA.gif',
				'https://i.imgur.com/f8627z3.gif',
				'https://i.imgur.com/CwPRegu.gif',
				'https://media.tenor.com/images/925ab58ca7860bfdbea7e8be3c288949/tenor.gif',
				'https://thumbs.gfycat.com/SatisfiedYearlyGonolek-size_restricted.gif',
				'http://cdn.lowgif.com/full/1eba3151cfac3814-shy-anime-gif-3-gif-images-download.gif',
				'https://i.imgur.com/iXCGjAd.gif',
				'http://i.imgur.com/64tzPIh.gif',
				'https://thumbs.gfycat.com/TameDecimalEasteuropeanshepherd-size_restricted.gif',
				'https://media0.giphy.com/media/6CBGoJnEBbEWs/giphy.gif',
				'https://media.tenor.com/images/f942d8d70848555f5914cc3474f7a63f/tenor.gif',
				'https://38.media.tumblr.com/fddb3c86cb6b8ebc3f97124ef685d8f8/tumblr_inline_nqmmpycARm1t8mj2f_500.gif',
				'https://media.tenor.com/images/5f737df63beee63857ce767a877547ff/tenor.gif',
				'https://media.tenor.com/images/fcfe35add598a6b7ef0a61c50735eac0/tenor.gif',
				'https://media.tenor.com/images/e46bdaf536ccc3b70b664a330fe02220/tenor.gif',
				'https://media.tenor.com/images/9fcedb196e6e058ee3aa9aae4772fe0f/tenor.gif',
				'https://media.tenor.com/images/4f04db0e8376d11f8bec17d8e786a07b/tenor.gif',
				'https://image.myanimelist.net/ui/Ik_Vp0LpzawyH5e_tQqsN_z_TfoOK00m4fmV6r3444Low7b-rPb0KElhCR02CkWicPHdhf4LqSppFX2AHEcn_zGvPXo5OhStwJ5JWrY-2holndH8xN9fvv4WwQIq9pzk',
				'https://i0.wp.com/novocom.top/image/bWVkabm9yLWExLnRlbm9yLmNvbQ==/images/8f400c91a5f9ae9fc77045fd001c4cd4/tenor.gif',
				'https://media1.tenor.com/images/f01cd6c8036da9263eac06977f2dfbcb/tenor.gif?itemid=3478340',
		];

		var rand = list[Math.floor(Math.random() * list.length)];

		const embed = new Discord.MessageEmbed()
					.setTitle()
					.setDescription(`${message.author} está envergonhado <:baka:786244388136157214>`)
					.setColor('#00bfff')
					.setImage(rand)
					.setFooter('King')			
	await message.channel.send(embed); 
	}
}