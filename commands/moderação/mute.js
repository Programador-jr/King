const { MessageEmbed } = require("discord.js");

module.exports = {
  name: "mute",
  description: "Silenciar qualquer pessoa que quebrar as regras",
  category: "moderação",
  usage: "mute <@user> <motivo>",
  run: async (client, message, args) => {
    if (!message.member.hasPermission("MANAGE_ROLES")) {
      return message.channel.send(
        "Você é fraco lhe falta permissãom de `Grenciar_servidor`"
      );
    }

    if (!message.guild.me.hasPermission("MANAGE_ROLES")) {
      return message.channel.send("Eu não tenho permissão para gerenciar cargos.");
    }

    const user = message.mentions.members.first();
    
    if(!user) {
      return message.channel.send("Mencione o membro que deseja silenciar")
    }
    
    if(user.id === message.author.id) {
      return message.channel.send("Não vou silenciar você -_-");
    }
    
    
    let reason = args.slice(1).join(" ")
    
    
    if(!reason) {
      return message.channel.send("Por favor, dê um motivo para silenciar o membro")
    }
    
  //HORA DE DEIXAR A FUNÇÃO MUTADO
    
    let muterole = message.guild.roles.cache.find(x => x.name === "Mutado")
    
    
      if(!muterole) {
      return message.channel.send("Este servidor não tem cargo com nome `muted`")
    }
    
    
   if(user.roles.cache.has(muterole)) {
      return message.channel.send("O usuário fornecido já está silenciado")
    }
    
  
    
    
    user.roles.add(muterole)
    
await message.channel.send(`Você silenciou **${message.mentions.users.first().username}** For \`${reason}\``)
    
    user.send(`Você está mudo em **${message.guild.name}** Para \`${reason}\``)
    
    
//ESTAMOS FEITOS AQUI
    
  }
};