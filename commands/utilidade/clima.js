const weather = require('weather-js');
const discord = require('discord.js')

module.exports = {
  name: "clima",
  description: "Veja o clima de qualquer lugar",
  category: "utilidade",
  usage: "clima <estado/país>",
  run: (client, message, args) => {
    
    
    if(!args.length) {
      return message.channel.send("Por favor, forneça uma localização")
    }
    
 weather.find({search: args.join(" "), degreeType: 'C'}, function(err, result) {
try {
 
let embed = new discord.MessageEmbed()
.setTitle(`Clima - ${result[0].location.name}`)
.setColor("#1E90FF")
.setDescription("As unidades de temperatura podem ser diferentes em algum momento")
.addField("Temperatura", `${result[0].current.temperature}℃`, true)
.addField("Previsão", result[0].current.skytext, true)
.addField("Umidade", result[0].current.humidity, true)
.addField("Velocidade do vento", result[0].current.windspeed, true)//What about image
.addField("Tempo de Observação", result[0].current.observationtime, true)
.addField("Exibição de vento", result[0].current.winddisplay, true)
.setThumbnail(result[0].current.imageUrl);
   message.channel.send(embed)
} catch(err) {
  return message.channel.send("Incapaz de obter os dados de determinada localização")
}
});   
    //VAMOS VERIFICAR PKG
    
  }
}