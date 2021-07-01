const Discord = require('discord.js');

module.exports = {
	name:"cronometro",
	category: "utilidade",
 run: async( client, message, args) =>{
  let time = args[0]
  if(!time) return message.reply("how minutes \ hours wiil you set your alarm")
  if(ms(time) > ms("1w")) return message.reply("you can't set your alarm bigger than 1 week")

  let alert = args.slice(1).join(" ")
  if(!alert) return message.channel.send("Você têm que especificar o alerta!")
  let embed = new Discord.MessageEmbed()
  .setAuthor(`${message.author.tag} Alarme` , message.author.displayAvatarURL())
  .setColor("#00bfff") 
  .addField("Tempo:" , `\`${time}\`` , true)
  .addField(" Alerta:" , `\`${alert}\`` , true)
  message.channel.send(embed)
  setTimeout(() => {
    let time = new Discord.MessageEmbed()
    .setAuthor(`${message.author.tag} Your alarm has been ended` , message.author.displayAvatarURL())
    .setColor("#00bfff") 
    .addField("Tempo:" , `\`${time}\`` , true)
    .addField(" Alerta:" , `\`${alert}\`` , true)
    .addField("Alerta iniciado em: " , `\`${message.guild.name}\``)
    message.author.send(time)

  }, ms(time))
}
}