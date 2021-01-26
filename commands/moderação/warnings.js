const db = require("quick.db")

module.exports = {
  name: "warnings",
	aliases: ["advertencias", "avisos"],
  description: "Receba os avisos seus ou da pessoa mencionada",
  category: "moderação",
  run: (client, message, args) => {
    const user = message.mentions.members.first() || message.author
    
  
    let warnings = db.get(`warnings_${message.guild.id}_${user.id}`)
    
    
    if(warnings === null) warnings = 0;
    
    
    message.channel.send(`${user} tem **${warnings} ** aviso (s)`)
  
  
  }
}