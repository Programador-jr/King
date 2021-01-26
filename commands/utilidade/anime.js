//LETS GET STARTED
const { get } = require("request-promise-native");
const { MessageEmbed } = require("discord.js")

module.exports = {
name: "anime",
  category: "utilidade",
  description: "Obtenha informações sobre anime",
  usage: "anime <nome_anime>",
  run: (client, message, args) => {
    
    
    
    if(!args.length) {
      return message.channel.send("Por favor, dê o nome do anime")
    }
    //DEFINIR OPÇÕES
    
    let option = {
      url: `https://kitsu.io/api/edge/anime?filter[text]=${args.join(" ")}`,
      method: `GET`,
      headers: {
        'Content-Type': "application/vnd.api+json",
        'Accept': "application/vnd.api+json"

      },
      json: true
    }
    
    
    message.channel.send("Buscando as informações").then(msg => {
      get(option).then(body => {
       try {
        let embed = new MessageEmbed()
        .setTitle(body.data[0].attributes.titles.en)
        .setColor("00BFFF")
        .setDescription(body.data[0].attributes.synopsis)
        .setThumbnail(body.data[0].attributes.posterImage.original)
        .addField("Avaliações", body.data[0].attributes.averageRating)
        .addField("TOTAL DE EPISÓDIOS", body.data[0].attributes.episodeCount)
        //.setImage(body.data[0].attributes.coverImage.large)
        //try it
        
        
        message.channel.send(embed)
        msg.delete();
        
       } catch (err) {
        msg.delete();
         return message.channel.send("Incapaz de encontrar este anime");
       }
        
        
        
      }                 
                       
    )})
    
  }

}