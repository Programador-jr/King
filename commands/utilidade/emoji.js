const Discord = require("discord.js");

module.exports ={
	name:"idemoji",
	usage:"idemoji <emoji>",
	category:"utilidade",
	aliases:["emoji", "emojiid"],

	run:async (client, message, args) => {
  message.delete();
  if (!args[0])
    return message.channel.send(
      `**${message.author.username}, Use:** ` +
        "`" +
        "k!emoji + figurinha`"
    ); //Troque a exclamação ! da mensagem acima pelo seu prefixo
  let emoji = message.guild.emojis.cache.find(emoji => emoji.name === args[0]);

  if (!emoji) {
    message.channel.send(
      "`" + args[0] + "` **Esse é o id da figurinha solicitada.**"
    );
  } else if (emoji.animated === true) {
    message.channel.send(`<a:${args[0]}:${emoji.id}>`);
  } else {
    message.channel.send(`<:${args[0]}:${emoji.id}>`);
  }
}
};