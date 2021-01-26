const Discord = require("discord.js");

	module.exports = {
    name: "abraçar",
		usage: "abraçar <@user>",
		aliases: ["hug", "abraço", "abracar", "abraco"],
		description: "Dê um web abraço em um membro do servidor ",
    category: "diversão",
    run: async (client, message, args) => {
			var list = [
			'https://i.pinimg.com/originals/08/de/7a/08de7ad3dcac4e10d27b2c203841a99f.gif',
			'https://i.pinimg.com/originals/32/89/d8/3289d80dcec9c95a0b895a479b90e88c.gif',
			'https://33.media.tumblr.com/680b69563aceba3df48b4483d007bce3/tumblr_mxre7hEX4h1sc1kfto1_500.gif',
			'https://i.gifer.com/27tM.gif',
			'https://i.imgur.com/IAxUnda.gif',
			'https://i.imgur.com/tuH4gqZ.gif',
			'https://i.imgur.com/mjuxfiY.gif'
];

var rand = list[Math.floor(Math.random() * list.length)];
let user = message.mentions.users.first() || client.users.cache.get(args[0]);
if (!user) {
return message.reply('lembre-se de mencionar um usuário válido para executar essa ação!');
}

  const embed = new Discord.MessageEmbed()
        .setTitle('')
        .setColor('#8A2BE2')
        .setDescription(`🤗 ${message.author} abraçou ${user}`)
        .setImage(rand)
        .setTimestamp()
        .setFooter('King')
  await message.channel.send(embed);
        
    }
};