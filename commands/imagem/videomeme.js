const Discord = require("discord.js");

	module.exports = {
    name: "memevideo",
		aliases: ["video"],
		description: "Videos de memes aleátorios",
    category: "imagem",
    run: async (client, message, args) => {

			let respostas = [
			'https://img-9gag-fun.9cache.com/photo/apNBz1D_460sv.mp4',
			'https://cdn.discordapp.com/attachments/458025259120197633/806302796567150642/Friezas_biker_gang-1.mp4',
			'https://img-9gag-fun.9cache.com/photo/aRXAYzQ_460sv.mp4',
			'https://img-9gag-fun.9cache.com/photo/aEpnw0O_460sv.mp4',
			'https://img-9gag-fun.9cache.com/photo/anQ1qOq_460svvp9.webm',
]

const BallNum = Math.floor(Math.random() * respostas.length); 
const delay = (msec) => new Promise((resolve) => setTimeout(resolve, msec)); 

msg = await message.channel.send('<a:loading_color:807398178235088965>');
await delay(3000); 
msg.edit(respostas[BallNum]);

		}
};