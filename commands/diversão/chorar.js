const Discord = require("discord.js");

	module.exports = {
    name: "chorar",
		usage: "chorar",
		aliases: ["cry"],
		description: " ",
    category: "diversão",
    run: async (client, message, args) => {

			var list = [
				'https://i.pinimg.com/originals/3c/69/16/3c691659f01aba24f6a6deed24305989.gif',
				'https://68.media.tumblr.com/0e42f221a783ae10e79fd8c710b59898/tumblr_o1usx7DyI91s7fey2o1_500.gif',
				'https://data.whicdn.com/images/320214384/original.gif',
				'https://i.gifer.com/Qsop.gif',
				'https://data.whicdn.com/images/286544836/original.gif',
				'https://mrwgifs.com/wp-content/uploads/2013/05/Dramatic-Crying-In-Anime-Gif.gif',
				'https://i.imgur.com/CwUSjuy.gif',
				'https://i.imgur.com/XbxsKOw.gif',
				'https://i.imgur.com/OLSFcu5.gif',
				'https://i.imgur.com/PLuOu89.gif',
				'https://i.imgur.com/Ok2GXkV.gif',
				'https://i.imgur.com/5qw84ue.gif',
				'https://gifimage.net/wp-content/uploads/2017/09/anime-happy-cry-gif-3.gif'
];

	var rand = list[Math.floor(Math.random() * list.length)];
	
  const embed = new Discord.MessageEmbed()
        .setTitle('')
        .setColor('#8A2BE2')
        .setDescription(`${message.author} está se sentido triste <a:YVPepeSad:802632473183911958>`)
        .setImage(rand)
        .setTimestamp()
        .setFooter('king')
  await message.channel.send(embed);
        
    }
};