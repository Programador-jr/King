module.exports = {
  name: "unmute",
  category: "moderação",
  run: async (client, message, args) => {
    if (!message.member.hasPermission("MANAGE_ROLES")) {
      return message.channel.send(
        "Desculpe, mas você não tem permissão para ativar o som de ninguém"
      );
    }

    if (!message.guild.me.hasPermission("MANAGE_ROLES")) {
      return message.channel.send("Eu não tenho permissão para gerenciar funções.");
    }

    const user = message.mentions.members.first();

    if (!user) {
      return message.channel.send(
        "Mencione o membro para quem você deseja ativar o som"
      );
    }
    
    let muterole = message.guild.roles.cache.find(x => x.name === "Mutado")
    
    
 if(user.roles.cache.has(muterole)) {
      return message.channel.send("Dado que o usuário não tem função muda, então o que devo assumir")
    }
    
    
    user.roles.remove(muterole)
    
    await message.channel.send(`**${message.mentions.users.first().username}** não está mudo`)
    
    user.send(`Agora você está sem som de **${message.guild.name}**`)

  }
};