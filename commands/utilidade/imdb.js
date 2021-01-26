const discord = require("discord.js");
const imdb = require("imdb-api");

module.exports = {
name: "imdb",
  description: "Obtenha informações sobre séries e filmes",
  category: "utilidade",
  usage: "imdb <name>",
  run: async (client, message, args, color) => {
    
    if(!args.length) {
      return message.channel.send("Por favor, dê o nome do filme ou série")
    }
    
    const imob = new imdb.Client({apiKey: "5e36f0db"}) //Você precisa colar sua imdb api
    
    let movie = await imob.get({'name': args.join(" ")})
    
    let embed = new discord.MessageEmbed()
    .setTitle(movie.title)
    .setColor("#ff2050")
    .setThumbnail(movie.poster)
    .setDescription(movie.plot)
    .setFooter(`Avaliações: ${movie.rating}`)
    .addField("País:", movie.country, true)
    .addField("Idiomas:", movie.languages, true)
    .addField("Tipo:", movie.type, true);
    
    
    message.channel.send(embed)
    
    
    
  }

}