const db = require('quick.db')
const discord = require('discord.js')
const { getInfo } = require("../../handlers/xp.js")
module.exports = {
  name: "level",
  description: "Obtenha o nível de autor ou mencionado",
	aliases:["nivel"],
  usage: "level <@user>",
  category: "utilidade",
  run: (client, message, args) => {
    const user = message.mentions.users.first() || message.author;
    
    if(user.id === client.user.id) { //IF BOT
      return message.channel.send("😉 | Estou no nível 100")
    }
    
    if(user.bot) {
      return message.channel.send("O bot não tem níveis")
    }
    
    let xp = db.get(`xp_${user.id}_${message.guild.id}`) || 0;
    
    const {level, remxp, levelxp} = getInfo(xp);
    if(xp === 0) return message.channel.send(`**${user.tag}** está fora do XP`)
    
    let embed = new discord.MessageEmbed()
    .setAuthor(user.username, message.guild.iconURL())
    .setColor("#ff2050")
    .setThumbnail(user.avatarURL())
    .setDescription(`**NÍVEL** - ${level}
**XP** - ${remxp}/${levelxp}`)
    
 message.channel.send(embed)   
    
    
    
    
  }
}