const Discord = require("discord.js");
const mapping = {
	' ': ':zero:',
	'0': ':one:',
	'1': ':two:',
	'2': ':two:',
	'3': ':three:',
	'4': ':four:',
	'5': ':five:',
	'6': ':six:',
	'7': ':seven:',
	'8': ':eight:',
	'9': ':nine:',
	'!': ':grey_exclamation:',
	'?': ':grey_question:',
	'#': ':hash:',
	'*': ':asterisk:'
};

'abcdefghijklmnopqrstuvwxyz'.split('').forEach(c =>{
mapping[c] = mapping[c.toUpperCase()] = `:regional_indicator_${c}:`;
});

module.exports = {
	name: "emojify",
	category: "diversão",
	usage: "emojify <texto>",
	description: "Retorna um texto em forma de emoji",

	run: async(client, message, args) =>{
		if(args.length < 1){
			message.channel.send('Por favor forneça um texto para fazer a conversão!');
		}
		await message.delete();
		message.channel.send(args.join(' ').split('').map(c => mapping[c] || c).join(''));
	}
}