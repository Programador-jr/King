const db = require("quick.db")

module.exports = {
  name: "delcmd",
  usage: "delcmd <nome_cmd>",
	aliases:["excluircomando", "delcommand", "deletecommand"],
  description: "Exclua o comando personalizado",
  category: "moderação",
  run: (client, message, args) => {

    let cmdname = args[0]

    if(!cmdname) return message.channel.send("⚠️ Me dê o nome do comando, `delcmd <nome_cmd>`")

    let database = db.get(`cmd_${message.guild.id}`)

    if(database) {
      let data = database.find(x => x.name === cmdname.toLowerCase())

      if(!data) return message.channel.send("⚠️ Incapaz de encontrar este comando.")

      let value = database.indexOf(data)
      delete database[value]

      var filter = database.filter(x => {
        return x != null && x != ''
      })

      db.set(`cmd_${message.guild.id}`, filter)
      return message.channel.send(`Excluiu o omando**${cmdname}**!`)


    } else {
      return message.channel.send("⚠️ Desculpe, mas não consigo encontrar esse comando!")
    


  }
  }
}