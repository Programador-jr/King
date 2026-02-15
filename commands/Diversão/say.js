const discord = require('discord.js');

module.exports = {
	name:"say",
	aliases:["falar", "dizer"],
	category: "Divers\u00e3o",
	description: "Envia no canal a mensagem informada por voce.",
	cooldown: "3",
	run: async (client, message, args) => {
  const sayMessage = args.join(' ');
  message.delete().catch(O_o => {});
	message.channel.send(sayMessage);    	
	}
};
