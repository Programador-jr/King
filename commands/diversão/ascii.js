const Discord = require('discord.js');
const figlet = require('figlet');

module.exports = {
	name: "ascii",
	category:"diversão",
	description:"Retorna um texto em formato ascii",
	usage:"ascii <texto>",

	run: async(clent, message, args) => {
		let text = args.join(" ");
		if(!text) {
			return message.channel.send(`Por favor forneça um texto para fazer a conversão em ascii`)
		}
		let maxlen = 20
		if(text.length > 20){
			return message.channel.send(`Por favor forneça um texto com 20 caracteres ou menos`);
		}
		figlet(text, function(err, data){
			message.channel.send(data, {
				code: 'AsciiArt'
			})
		})
	}
}