const db = require("quick.db")
const { default_prefix } = require("../../config.json")

module.exports = {
  name: "prefix",
  category: "moderação",
  usage: "prefix <novo-prefixo>",
  description: "Mude meu prefixo neste servidor",
  run: async (client, message, args) => {
    //PERMISSION
    if(!message.member.hasPermission("ADMINISTRATOR")) {
      return message.channel.send("Você não tem permissão para alterar o prefixo")
    }
    
    if(!args[0]) {
      return message.channel.send("Por favor, dê o prefixo que você deseja definir")
    } 
    
    if(args[1]) {
      return message.channel.send("Você não pode definir como prefixo um argumento duplo")
    }
    
    if(args[0].length > 3) {
      return message.channel.send("Você não pode enviar prefixo com mais de 3 caracteres")
    }
    
    if(args.join("") === default_prefix) {
      db.delete(`prefix_${message.guild.id}`)
     return await message.channel.send("Prefixo redefinido ✅")
    }
    
    db.set(`prefix_${message.guild.id}`, args[0])
  await message.channel.send(`Prefixo do bot definido para ${args[0]}`)
    
  }
}