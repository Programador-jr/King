const Discord = require("discord.js"),
os = require('os');
module.exports = {
	name: "info",
	aliases:["i"],
	category: "utilidade",
	description: "Veja as informações detalhadas do bot",
	
	run: async = (client, message, args) => {
    
    let embed = new Discord.MessageEmbed()
        .setTimestamp()
        .addField(`:map: Número de servidores`, `${client.guilds.cache.size}`, true)
        .addField(`:bust_in_silhouette: Numero de usuarios`, `${client.users.cache.size}`, true)  
        .addField(`:speech_balloon:  Numeros de canais`, `${client.channels.cache.size}`, true)
        .addField(`:desktop: Sistema operacional`, `${os.platform()}`, true)
        .addField(`:gear: Arquitetura`, `${os.arch()}`, true)
        .addField(`:rocket:  Processador`, `${os.cpus().map(i => `${i.model}`)[0]}`, true)
        .addField(`:pager: RAM`, `${Math.trunc((process.memoryUsage().heapUsed) / 1024 / 1000)} MB / ${Math.trunc(os.totalmem() / 1024 / 1000)} MB (${Math.round((Math.round(process.memoryUsage().heapUsed / 1024 / 1024) / Math.round(os.totalmem() / 1024 / 1024)) * 100)}%)`, true)
        .addField(`:dividers: Livraria`, `Discord.js ${Discord.version}`, true)
        .addField(`:alarm_clock: Conectado desde`, ""+(Math.round(client.uptime / (1000 * 60 * 60))) + " Hora(s), " + (Math.round(client.uptime / (1000 * 60)) % 60) + " minuto(s) e " + (Math.round(client.uptime / 1000) % 60) + " segundo(s)"+"")
.setColor('#00bfff')
    message.channel.send(embed);
}
}