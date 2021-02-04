const Discord = require("discord.js");

	module.exports = {
    name: "cafune",
		usage: "cafune <@user>",
		aliases: ["pat"],
		description: "Faça um cafuné em alguém do servidor",
    category: "encenação",
    run: async (client, message, args) => {

			var list = [
				'https://i.imgur.com/LUypjw3.gif',
				'https://i.imgur.com/4ssddEQ.gif',
				'https://i.imgur.com/UWbKpx8.gif',
				'https://i.imgur.com/2lacG7l.gif',
				'https://i.imgur.com/TPqMPka.gif',
				'https://i.imgur.com/yRcbAsP.gif?noredirect',
				'https://i.imgur.com/XjsEMiK.gif',
				'https://i.imgur.com/bDMMk0L.gif',
				'https://i.imgur.com/pb0ODYa.gif',
				'https://i.imgur.com/rpClwiH.gif?noredirect',
				'https://i.imgur.com/NNOz81F.gif',
				'https://i.imgur.com/d9CH89Q.gif'
];

var rand = list[Math.floor(Math.random() * list.length)];
let user = message.mentions.users.first() || client.users.cache.get(args[0]);
if (!user) {
return message.reply('lembre-se de mencionar um usuário válido para executar essa ação!');
}

  const embed = new Discord.MessageEmbed()
        .setTitle('')
        .setColor('#00bfff')
        .setDescription(` ${message.author} fez um cafuné em ${user}`)
        .setImage(rand)
        .setTimestamp()
        .setFooter('king')
  await message.channel.send(embed);
        
    }
};