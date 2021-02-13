const request = require('node-fetch');
const fs = require("fs");
const Discord = require('discord.js');
const booru = require('booru');

module.exports = {
    name: "rule34",
		aliases:["r34"],
    category: "NSFW",
  run: async (bot, message, args) => {
  //command

  //Checks channel for nsfw
  var errMessage =(new Discord.MessageEmbed()
	.setColor('#FF0000')
	.setTitle("🔐 Você deve usar este comando em uma sala nsfw!")
	);
  if (!message.channel.nsfw) {
      message.react('💢');

      return message.reply(errMessage)
      .then(msg => {
      msg.delete({ timeout: 4000 })
      })
      
  }

  if (message.content.toUpperCase().includes('LOLI') || message.content.toUpperCase().includes('GORE')) return message.channel.send('Esse tipo de coisa não é permitido! Nem mesmo em canais NSFW!');

  var query = message.content.split(/\s+/g).slice(1).join(" ");
  booru.search('rule34', [query], {nsfw: true, limit: 1, random: true })
      .then(booru.commonfy)
      .then(images => {
          for (let image of images) {
              const embed = new Discord.MessageEmbed()
							.setTitle("A imagem não está carregando? Clique aqui")
							.setDescription('**Aqui está sua imagem...👀**')
              .setImage(image.common.file_url)
              .setColor('#FF1493')
              .setFooter(`Tags: r34 ${query}`)
              .setURL(image.common.file_url);
          return message.channel.send({ embed });
          }

      }).catch(err => {
          if (err.name === 'booruError') {
              return message.channel.send(`Nenhum resultado encontrado para **${query}**!`);
          } else {
              return message.channel.send(`Nenhum resultado encontrado para **${query}**!`);
          }
})
  }
  };