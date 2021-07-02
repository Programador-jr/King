const { MessageEmbed } = require("discord.js")
const moment = require("moment")

module.exports = {
  name: "user",
  aliases: ["userinfo"],
  category: "info",
  description: "Obtenha inf",
  run: async (client, message, args) => {
    
    let target
    
    if(message.mentions.users.first()) {
      target = message.mentions.users.first();
    } else if(args[0]) {
        target = message.guild.members.cache.get(args[0]).user;
      } else {
        target = message.author
      }
    
    if (target.presence.status === "dnd") target.presence.status = "<:dnd:812752487688699915>";
    if (target.presence.status === "idle") target.presence.status = "<:idle:812752961800896533>";
    if (target.presence.status === "online") target.presence.status = "<:online:812753463057973248>";
    if (target.presence.status === "offline") target.presence.status = "<:offline:812753903333539841>";
    
    function game() {
      let game;
      if (target.presence.activities.length >= 1) game = `${target.presence.activities[0].type} ${target.presence.activities[0].name}`;
      else if (target.presence.activities.length < 1) game = "Vazio";
      return game;
    }
    
    let x = Date.now() - target.createdAt;
    let y = Date.now() - message.guild.members.cache.get(target.id).joinedAt;
    let created = Math.floor(x / 86400000);
    let joined = Math.floor(y / 86400000);
    
    const member = message.guild.member(target);
    let nickname = member.nickname !== undefined && member.nickname !== null ? member.nickname : "Vazio";
    let status = target.presence.status;
    let avatar = target.avatarURL({ dynamic: true, size: 2048 });
    let aicon = message.author.avatarURL({ dynamic: true, size: 2048 });
    let createdate = moment.utc(target.createdAt).format("DD MM YYYY");
    let joindate = moment.utc(target.joinedAt).format(" DD MM YYYY");
    let flags = target.flags.toArray();
    if(target.flags.toArray() < 1) flags = "Vazio";


    const embed = new MessageEmbed()
    .setAuthor(target.tag, avatar)
    .setThumbnail(avatar)
    .setDescription(
      `
<:arrow2:812770296289427549>** Nickname:** 
${target.username}

<:arrow2:812770296289427549>** ID:** 
${target.id}

<:arrow2:812770296289427549>** Apelido:** 
${nickname}

<:arrow2:812770296289427549>** Criação da conta:** 
${createdate} | ${created} dia(s) atrás

<:arrow2:812770296289427549>** Entrou no servidor em:** 
${joindate} | ${joined} dia(s) atrás

<:arrow2:812770296289427549>** Status:** 
${status}

<:arrow2:812770296289427549>** Atividade:** 
${game()}

<:arrow2:812770296289427549>** Emblemas:** 
${flags}

<:arrow2:812770296289427549>** Cargos:** 
<@&${member._roles.join('> <@&')}>`)

    .setColor("#00bfff")
    .setFooter(`${message.author.username}`, aicon  )
    .setTimestamp()
  
    message.channel.send(embed)
    
  }
}