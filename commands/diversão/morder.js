const Discord = require("discord.js");

	module.exports = {
    name: "morder",
		usage: "morder <@user>",
		aliases: ["bite"],
		description: "",
    category: "diversão",
    run: async (client, message, args) => {

			var list = [

				'https://i.imgur.com/xKJw3mX.gif',
				'https://i.imgur.com/wb14mqC.gif',
				'https://pa1.narvii.com/6045/a9bb6d864ebe7e01ed647b78fc652f15116716c4_hq.gif',
				'https://media1.tenor.com/images/6b42070f19e228d7a4ed76d4b35672cd/tenor.gif?itemid=9051585',
				'https://data.whicdn.com/images/151203966/original.gif',
				'https://lh6.googleusercontent.com/proxy/41VecVMfZHB_JyaMkL0bo4R7YPlgh2RRBxTBe7OYoni5zD6yhFf3K2rCoMoPWDO_rGBDV60BHQpXeN9tUOler9Oea6wazAmaWB75JunHJxxBoetTlDyubDrZ8NIQKg=s0-d',
				'https://i.gifer.com/TuLu.gif',
				'https://i.chzbgr.com/full/8241190656/h70C45E69/shes-not-a-vampire',
				'https://anigifs.files.wordpress.com/2011/05/nchij_e22_p5.gif',
				'https://i.imgur.com/fWSIugu.gif',
				'https://i.pinimg.com/originals/f8/4a/57/f84a575892b9b55841498f6acc8d7ee5.gif'
];

var rand = list[Math.floor(Math.random() * list.length)];
let user = message.mentions.users.first() || client.users.cache.get(args[0]);
if (!user) {
return message.reply('lembre-se de mencionar um usuário válido para executar essa ação!');
}

  const embed = new Discord.MessageEmbed()
        .setTitle('')
        .setColor('	#8B0000')
        .setDescription(`${message.author} mordeu ${user}`)
        .setImage(rand)
        .setTimestamp()
        .setFooter('king')
  await message.channel.send(embed);
        
    }
};