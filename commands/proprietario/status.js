const db = require("quick.db")
const discord = require("discord.js")

module.exports = {
  name: "status",
  description: "Alterar o status do bot",
  usage: "status <aqui>",
  category: "proprietário",
  run: async (client, message, args) => {
    
    //COMANDO SÓ PROPRIETÁRIO
    if(!message.author.id === "718669518452293713") {
      return message.channel.send("Este comando só pode ser usado por KingKiller®#1889")
    }
    //ARGUMENTO
    if(!args.length) {
      return message.channel.send("Por favor, dê uma mensagem de status")
    }
    
 db.set(`status`, args.join(" "))
   await message.channel.send("Atualizado o status do bot")
    process.exit(1);
    
  }
}