const Discord = require('discord.js')

module.exports = {
	name:"vaporwave",
	run:async (client, message, args, default_prefix) => {
    if(!args.join(" ")) return message.channel.send(`${message.author}, eu preciso que você escreva algo após o comando`)
    const vaporwavefield = args.join(" ").split(" / ")[0].split('').map(char => {
        const code = char.charCodeAt(0);

        return code >= 33 && code <= 126 ? String.fromCharCode((code - 33) + 65281) : char;
    }).join("");
    message.channel.send(`${vaporwavefield}`)
}
}