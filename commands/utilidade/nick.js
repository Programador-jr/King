const discord = require("discord.js");

/***
* @param {Discord.client} bot the discord bot client.
* @param {Discord.messsage} message the initial message sent by the user.
* @param {array} args an array of arguments
 */

module.exports = {
	name:"nick",
	run:async (client, message, args) => {
  var a = message.id;
  var nickname = args.join(' ');
  if (!message.member.hasPermission('CHANGE_NICKNAME')) return message.reply("Você não tem permissão para fazer isso!");
  message.member.setNickname(nickname).catch(err => {
    return message.reply("Desculpe, não posso fazer isso no momento");
  });
  await message.channel.messages.fetch(a).then(msg => msg.delete({ timeout: 1000 }));
}
}