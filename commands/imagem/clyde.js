  
const Discord = require('discord.js');
const fetch = require('node-fetch');

module.exports = {
	name:"clyde",
	run:async (client, message, args, prefix) => {
  
    let text = args.join(" ");

        if (!text) {
            return message.channel.send(`${message.author}, Eu preciso que você especifique o texto.`);
        }
            let res = await fetch(encodeURI(`https://nekobot.xyz/api/imagegen?type=clyde&text=${text}`));
            let json = await res.json();
            let attachment = new Discord.MessageAttachment(json.message, "clyde.png");
            message.channel.send(attachment);
}
}