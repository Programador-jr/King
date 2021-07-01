const {MessageEmbed} = require("discord.js")
const fetch = require('node-fetch')

module.exports = {
  name: "ejetar",
  description: "ejete alguém da nave - Among Us",
  usage: "ejetar <@user>",
  category: "diversão",
  run: async (client, message, args) => {
    const user = message.mentions.users.first()
    const imp = [true, false];
    const imposter = imp[Math.floor(Math.random() * imp.length)];
    const crew = ["black", "blue", "brown", "cyan", "darkgreen", "lime", "orange", "pink", "purple", "red", "white", "yellow"]
    const crewmate = crew[Math.floor(Math.random() * crew.length)];
    
    if(!user) {
      return message.channel.send(`${message.author} lembre-se de mencionar um usuário válido para ejetar!`)
    }
    
    const data = await fetch(`https://vacefron.nl/api//ejected?name=${user.username}&impostor=${imposter}&crewmate=${crewmate}`)
    
    const embed = new MessageEmbed()
      .setAuthor(message.author.username + "#" + message.author.discriminator, message.author.displayAvatarURL())
      .setTitle(`${message.author.username} Ejetou ${user.username}`)
      .setColor('#000000')
      .setDescription(`[Clique aqui se a imagem não carregar!](${data.url})`)
      .setImage(`${data.url}`)
      .setFooter('King');

    message.channel.send(embed);
  }
}