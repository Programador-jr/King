const discord = require("discord.js");
/***
* @param {Discord.client} bot the discord bot client.
* @param {Discord.messsage} message the initial message sent by the user.
* @param {array} args an array of arguments
 */
module.exports = {
	name:"muteone",
	run : async (bot, message, args) => {
  var a = message.id;
  if (!message.member.hasPermission('MUTE_MEMBERS')) return message.reply("Você não tem permissão para fazer isso!");
  if (!message.member.voice.channel) return message.reply("Você não está em um canal de voz!");
  var user = message.mentions.members.first();

  if (!user) return message.reply("Quem você quer silenciar?");
  let channel = message.member.voice.channel;
  var found = 0;
  for (let memberi of channel.members) {
    if (memberi[1] == user) {
      found++;
    }
  }
  if (found == 1) {
    await user.voice.setMute(true);
    message.channel.send(`${user} muted by ${message.author}`);
    message.channel.messages.fetch(a).then(msg => msg.delete({ timeout: 1000 }));
  }
  else {
    message.channel.send("You are not in the same channel!!");
    message.channel.messages.fetch(a).then(msg => msg.delete({ timeout: 1000 }));
  }
}
}