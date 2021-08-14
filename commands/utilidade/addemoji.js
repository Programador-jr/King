const Discord = require('discord.js');

module.exports = {
	name: "addemoji",
	aliases:["adicionaremoji"],
	category:"utilidade",
	run: async (client, message, args) => {

function converter(bytes) {
    let formatos = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes == 0) return '0B';
    let i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    if(i <= 2) return Math.round(bytes / Math.pow(1024, i), 2) + formatos[i];
    if((bytes / Math.pow(1024, i)).toFixed(3).includes(".00")) return Math.round(bytes / Math.pow(1024, i), 2) + formatos[i];
    if((bytes / Math.pow(1024, i)).toFixed(3).includes(".0")) return ((bytes / Math.pow(1024, i)).toFixed(3) + formatos[i]).replace("0","")
    return (bytes / Math.pow(1024, i)).toFixed(3) + formatos[i];
}

isEmoji = function(emoji) {
const e = Discord.Util.parseEmoji(emoji)

if (e.id === null) {
return {
    name: e.name,
    id: e.id,
    animated: e.animated,
    response: false
    }
} else {
return {
    name: e.name,
    id: e.id,
    animated: e.animated,
    response: true
    }
}
}

if(!['571375744635109394'].includes(message.author.id) && !message.member.permissions.has('MANAGE_EMOJIS')) {
  return message.channel.send('**❌ | Você não pode usar este comando**\n**Permissão necessária: [\`GERENCIAR_EMOJIS\`]**')
  }
 if(!message.guild.me.permissions.has('MANAGE_EMOJIS')) {
  return message.channel.send('**❌ | Eu não posso usar este comando**\n**Permissão necessária: [\`GERENCIAR_EMOJIS\`]**')
  }

let link = message.content.match("https://")
let nome = ""
let emoji = args[0]
if (!link) {
    if (!emoji && !message.attachments.first() && !link) return message.channel.send("**❌ | Você precisa especificar um (link) um (emoji) uma (imagem) ou (random)**");
    
if(emoji === "random"){
  
let al = client.emojis.cache.random()
const emoji3 = await message.guild.emojis.create(al.url, al.name);

const embed2 = new Discord.MessageEmbed()
.setTitle("✅ | Sucesso")
.setColor("#8b6eff")
.setDescription(`**O usuário ${message.author} adicionou o emoji**\n**[(${emoji3}) | (${emoji3.id})] ao servidor com o nome:** \`${emoji3.name}\``) 
 return message.channel.send(embed2)
}

    if (message.attachments.first()) {
link = message.attachments.first().url

nome = args[0]
if(!nome) return message.channel.send("**❌ | (imagem) você esqueceu de especificar um nome**")

let treco = message.attachments.first().size
let peso = converter(treco)
if(treco > 256000) return message.channel.send(`**❌ | Esta (imagem) pesa \`${peso}\` e necessário ser menor que \`256KB\`**`)

} else if (isEmoji(args[0]).response === true) {
link = emoji.url;
link = `https://cdn.discordapp.com/emojis/${isEmoji(args[0]).id}.${isEmoji(args[0]).animated ? "gif" : "png"}?v=1&size=64`

nome = args.slice(1).join("")
if(!nome) return message.channel.send("**❌ | (emoji) você esqueceu de especificar um nome**")

} else {
return message.channel.send("**❌ | Você precisa especificar um (link) um (emoji) uma (imagem) ou (random)**");
}
} else if (link && !message.attachments.first() && isEmoji(args[0]).response === false) {
link = args[0]
nome = args.slice(1).join("")
if(!nome) return message.channel.send("**❌ | (link) você esqueceu de especificar um nome**")

const a = new Discord.MessageAttachment(link,  "foto.gif")
message.channel.send(a).then((s) => {
if(s.attachments.first().size >= 256000) {
message.channel.send("**❌ | Este (link) pesa `"+converter(s.attachments.first().size)+"` e necessário ser menor que \`256KB\`**")
}
size = s.attachments.first().size
s.delete()
})

if(!link.endsWith('.gif') && !link.endsWith('.png') && !link.endsWith('.jpg') && !link.endsWith('.webp') && !link.endsWith('.jpeg')) return message.channel.send("**❌ | A sua imagem/link deve terminar com**\n**[**\`.gif\`**|**\`.png\`**|**\`.jpg\`**|**\`.webp\`**]**")
}

const emoji2 = await message.guild.emojis.create(link, nome);

const embed = new Discord.MessageEmbed()
.setTitle("✅ | Sucesso")
.setColor("#8b6eff")
.setDescription(`**O usuário ${message.author} adicionou o emoji**\n**[(${emoji2}) | (${emoji2.id})] ao servidor com o nome:** \`${nome}\``) 
 message.channel.send(embed)
}
}

