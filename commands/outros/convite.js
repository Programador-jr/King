const { MessageEmbed } = require("discord.js");

module.exports = {
    name: "convite",
    description: "Para adicionar / convidar o bot para o seu servidor",
    usage: "convite",
    aliases: ["con"],

  run: async function (client, message, args) {
    
    //set the permissions id here (https://discordapi.com/permissions.html)
    var permissions = 37080128;
    
    let invite = new MessageEmbed()
    .setTitle(`Convite ${client.user.username}`)
    .setDescription(`Me quer no seu servidor? Me convide hoje! \n\n [Link do convite](https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=${permissions}&scope=bot)`)
    .setURL(`https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=${permissions}&scope=bot`)
    .setColor("RANDOM")
    return message.channel.send(invite);
  },
};