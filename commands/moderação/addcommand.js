const db = require("quick.db")

module.exports = {
  name: "adcmd",
  usage: "adcmd <cmd_nome> <cmd_responder>",
  description: "adicionar comandos personalizados de guilda",
  category: "moderação",
  run: (client, message, args) => {


    if(!message.member.hasPermission("MANAGE_MESSAGES")) return message.channel.send("⚠️ Você precisa  da permissão de `GERÊNCIAR_MENSSAGENS` para usar esse comando")

    let cmdname = args[0]

    if(!cmdname) return message.channel.send(`⚠️ Você tem que dar o nome do comando, \`adcmd <nome_cmd> <resposta_cmd>\``)

    let cmdresponce = args.slice(1).join(" ")

    if(!cmdresponce) return message.channel.send(`⚠️ Você tem que dar uma resposta de comando cmd, \`adcmd <nome_cmd> <resposta>\``)

    let database = db.get(`cmd_${message.guild.id}`)

    if(database && database.find(x => x.name === cmdname.toLowerCase())) return message.channel.send("⚠️ Este nome de comando já foi adicionado nos comandos personalizados da guilda.")

    let data = {
      name: cmdname.toLowerCase(),
      responce: cmdresponce
    }

    db.push(`cmd_${message.guild.id}`, data)

    return message.channel.send("Adicionado **" + cmdname.toLowerCase() + "** como um comando personalizado na guilda.")


  }
}