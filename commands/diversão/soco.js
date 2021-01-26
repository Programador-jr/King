const Discord = require("discord.js");

	module.exports = {
    name: "soco",
		usage: "soco <@user>",
		aliases: ["socar", "punch"],
		description: "Dê um belo soco em algum membro do servidor",
    category: "diversão",
    run: async (client, message, args) => {

			var list = [
				'https://i.gifer.com/61i9.gif',
				'https://i.gifer.com/XTAA.gif',
				'https://i.gifer.com/f4.gif',
				'https://i.gifer.com/87hO.gif',
				'https://i.gifer.com/4msN.gif',
				'https://i.gifer.com/C32F.gif',
				'https://i.gifer.com/AgVM.gif',
				'https://i.gifer.com/3fOI.gif',
				'https://i.gifer.com/FHxQ.gif',
				'https://i.kym-cdn.com/photos/images/original/001/891/647/e2c.gif',
				'https://i.pinimg.com/originals/8d/50/60/8d50607e59db86b5afcc21304194ba57.gif',
				'https://i.imgur.com/g91XPGA.gif'

];

var rand = list[Math.floor(Math.random() * list.length)];
let user = message.mentions.users.first() || client.users.cache.get(args[0]);
if (!user) {
return message.reply('lembre-se de mencionar um usuário válido para executar essa ação!');
}

  const embed = new Discord.MessageEmbed()
        .setTitle('')
        .setColor('#8A2BE2')
        .setDescription(`${message.author}  ${user}`)
        .setImage(rand)
        .setTimestamp()
        .setFooter('king')
  await message.channel.send(embed);
        
    }
};