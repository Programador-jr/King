const Discord = require("discord.js");

	module.exports = {
    name: "tapa",
		usage: "tapa <@user>",
		aliases: ["slap"],
		description: "",
    category: "encenação",
    run: async (client, message, args) => {

			var list = [

		'https://media1.giphy.com/media/Gf3AUz3eBNbTW/giphy.gif',
		'https://i.imgur.com/fm49srQ.gif',
		'https://i.pinimg.com/originals/65/57/f6/6557f684d6ffcd3cd4558f695c6d8956.gif',
		'https://i.kym-cdn.com/photos/images/newsfeed/000/940/326/086.gif',
		'https://reallifeanime.files.wordpress.com/2014/06/akari-slap.gif'
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