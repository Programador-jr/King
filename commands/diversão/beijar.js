const Discord = require("discord.js");

	module.exports = {
    name: "beijar",
		usage: "beijar <@user>",
		aliases: ["kiss", "beijo"],
		description: "Dê um web beijo em um membro do servidor",
    category: "diversão",
    run: async (client, message, args) => {

			var list = [
				'https://i.imgur.com/So3TIVK.gif',
				'https://i.imgur.com/lmY5soG.gif',
				'https://i.imgur.com/YbNv10F.gif',
				'https://i.imgur.com/uobBW9K.gif',
				'https://66.media.tumblr.com/3a416d5c991dbef68b6eaf8a06682d3d/tumblr_inline_ol29wgtBjL1u0103a_500.gif',
				'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSeXVx6A7XezridbTUNbs0I93cSJ94oXc_Z4g&usqp=CAU',
				'https://pa1.narvii.com/5826/ad5c1b1fc9b5ebe938c815139813bc0e4c00b046_hq.gif'

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