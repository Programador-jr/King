const Discord = require("discord.js");

	module.exports = {
    name: "memevideo",
		usage: "memevideo",
		aliases:["video", "videomeme"],
		description: "Gera videos com memes aleátorios",
    category: "diversão",
    run: async (client, message, args) => {

			var list = [
		
				'https://cdn.discordapp.com/attachments/791681520762486814/802626701027704863/WhatsApp_e_viado_240P.mp4',
				''
];      
			var rand = list[Math.floor(Math.random() * list.length)];

			await message.channel.send(list);
    }
};