const Discord = require("discord.js");

	module.exports = {
    name: "beijar",
		usage: "beijar <@user>",
		aliases: ["kiss", "beijo"],
		description: "Dê um web beijo em um membro do servidor",
    category: "encenação",
    run: async (client, message, args) => {

			var list = [
				'https://i.imgur.com/So3TIVK.gif',
				'https://i.imgur.com/lmY5soG.gif',
				'https://i.imgur.com/YbNv10F.gif',
				'https://i.imgur.com/uobBW9K.gif',
				'https://66.media.tumblr.com/3a416d5c991dbef68b6eaf8a06682d3d/tumblr_inline_ol29wgtBjL1u0103a_500.gif',
				'https://i.imgur.com/ABwjzgD.gif',
				'https://pa1.narvii.com/5826/ad5c1b1fc9b5ebe938c815139813bc0e4c00b046_hq.gif',
				'https://i.imgur.com/XBmddwd.gif',
				'https://cutewallpaper.org/21/kissing-anime-pictures/Koi-To-Uso-Anime-GIF-KoiToUso-Anime-Kiss-Discover-and-Share-GIFs.gif',
				'https://i.imgur.com/ino4kbN.gif',
				'https://cutewallpaper.org/21/cute-anime-kiss/Anime-Cute-GIF-Anime-Cute-Kiss-Discover-and-Share-GIFs.gif'

];

var rand = list[Math.floor(Math.random() * list.length)];
let user = message.mentions.users.first() || client.users.cache.get(args[0]);
if (!user) {
return message.reply('lembre-se de mencionar um usuário válido para executar essa ação!');
}

  const embed = new Discord.MessageEmbed()
        .setTitle('')
        .setColor('#8A2BE2')
        .setDescription(`🥰 ${message.author} beijou ${user}`)
        .setImage(rand)
        .setTimestamp()
        .setFooter('king')
  await message.channel.send(embed);
        
    }
};