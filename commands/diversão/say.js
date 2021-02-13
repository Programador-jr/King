const discord = require('discord.js');

module.exports = {
	name:"say",
	aliases:["falar", "dizer"],
	category:"diversão",
	run: async (client, message, args) => {
  const sayMessage = args.join(' ');
  message.delete().catch(O_o => {});
	message.channel.send(sayMessage);    	
	}
};