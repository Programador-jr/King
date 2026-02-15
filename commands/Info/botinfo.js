const {
    MessageEmbed
} = require("discord.js");
const Discord = require("discord.js");
const config = require("../../botconfig/config.json");
const prefix = require("../../botconfig/config.json");
var ee = require("../../botconfig/embed.json");
const settings = require("../../botconfig/settings.json");
const prettyMillisecondsModule = require("pretty-ms");
const prettyMilliseconds = prettyMillisecondsModule.default || prettyMillisecondsModule;
let cpuStat = require("cpu-stat");
let os = require("os");
module.exports = {
    name: "botinfo", //the command name for execution & for helpcmd [OPTIONAL]
    category: "Info",
    usage: "botinfo",
    aliases: ["info",],
    cooldown: 5, //the command cooldown for execution & for helpcmd [OPTIONAL]
    description: "Mostra informações sobre o bot", //the command description for helpcmd [OPTIONAL]
    memberpermissions: [], //Only allow members with specific Permissions to execute a Commmand [OPTIONAL]
    requiredroles: [], //Only allow specific Users with a Role to execute a Command [OPTIONAL]
    alloweduserids: [], //Only allow specific Users to execute a Command [OPTIONAL]
    run: async (client, message, args) => {
 			  let prefix = client.settings.get(message.guild.id, `prefix`);
			  if (prefix === null) prefix = config.prefix;

				 let djs = "";
				  	if (client.settings.get(message.guild.id, `djroles`).join("") === "") djs = "não configurado"
				 		  else
				    	   for (let i = 0; i < client.settings.get(message.guild.id, `djroles`).length; i++) {
				             djs += "<@&" + client.settings.get(message.guild.id, `djroles`)[i] + "> | "
								}

        try {
            cpuStat.usagePercent(function (e, percent, seconds) {
                try {
                    if (e) return console.log(String(e.stack).red);

                    let connectedchannelsamount = 0;
                    let guilds = client.guilds.cache.map((guild) => guild);
                    for (let i = 0; i < guilds.length; i++) {
                        if (guilds[i].me.voice.channel) connectedchannelsamount += 1;
                    }
                    if (connectedchannelsamount > client.guilds.cache.size) connectedchannelsamount = client.guilds.cache.size;

                    const botinfo = new MessageEmbed()
                        .setAuthor(client.user.username, client.user.displayAvatarURL())
                        .setTitle("__**Informações Basicas:**__")
                        .setColor(ee.color)
                        .addField(`<:world:884218357304422420> Servidores`, `\`Total: ${client.guilds.cache.size} servidores\``, true)
                        .addField(`:busts_in_silhouette: Usuarios`, `\`Total: ${client.users.cache.size}\` usuarios`, true)
                        .addField("\u200b", `\u200b`, true)
                        .addField(`<:channel:884228094456627270> Canais`, `\`Total: ${client.channels.cache.size}\``, true)
                        .addField(`<:commands:884244807608827934> Comandos`, `\`Total: ${client.commands.map(cmd => cmd.name).length}\``, true)
                        .addField("\u200b", `\u200b`, true)
                        .addField("<:voice:884221993510133822> Canais de Voz", `\`${client.channels.cache.filter((ch) => ch.type === "GUILD_VOICE" || ch.type === "GUILD_STAGE_VOICE").size}\``, true)
                        .addField("<:voice:884221993510133822> Canais de Voz Conectados", `\`${connectedchannelsamount}\``, true)
                        .addField("\u200b", `\u200b`, true)
                        .addField("<:discord:884218858108489759> Livraria", `\`v${Discord.version}\``, true)
                        .addField("<:node:884214638567387176> Node", `\`${process.version}\``, true)
                        .addField("\u200b", `\u200b`, true)
												.addField(`<:ram:884220163354927154> RAM`, `\`${Math.trunc((process.memoryUsage().heapUsed) / 1024 / 1000)} MB / ${Math.trunc(os.totalmem() / 1024 / 1000)} MB (${Math.round((Math.round(process.memoryUsage().heapUsed / 1024 / 1024) / Math.round(os.totalmem() / 1024 / 1024)) * 100)}%)\``, true)
                        .addField("<:cpu:884219478664175687> CPU", `\`\`\`md\n${os.cpus().map((i) => `${i.model}`)[0]}\`\`\``)
                        .addField("<:cpu:884219478664175687> Uso da CPU", `\`${percent.toFixed(2)}%\``, true)
                        .addField(":gear: Arquitetura", `\`${os.arch()}\``, true)
                        .addField("\u200b", `\u200b`, true)
                        .addField("<:linux:884229003672686612> Sistema operacional", `\`${os.platform()}\``, true)
    								    .addField("\u200b", `\u200b`, true)
												.addField('**Configurações do Servidor:**', `\u200b`, true)
												.addField(`📌 Prefixo do Servidor`, `\`${prefix}\``, true)					.addField(`🎧 Cargos-DJ`, `${djs}`, true)
												.addField("\u200b", `\u200b`)
												.addField(":alarm_clock: Tempo de atividade ", `\`${prettyMilliseconds(client.uptime)}\``, true)								
                        .addField("<:latency:884230247032180806> Latência da API", `\`${client.ws.ping}ms\``, true)
                        .setFooter('Criado por: KingKiller®#1889','https://cdn.discordapp.com/avatars/718669518452293713/1893ff302ddf846e106f47159d308367.webp?size=4096');
                    message.reply({
                        embeds: [botinfo]
                    });

                } catch (e) {
                    console.log(e)
                    let connectedchannelsamount = 0;
                    let guilds = client.guilds.cache.map((guild) => guild);
                    for (let i = 0; i < guilds.length; i++) {
                        if (guilds[i].me.voice.channel) connectedchannelsamount += 1;
                    }
                    if (connectedchannelsamount > client.guilds.cache.size) connectedchannelsamount = client.guilds.cache.size;
                    const botinfo = new MessageEmbed()
                        .setAuthor(client.user.username, client.user.displayAvatarURL())
                        .setTitle("__**Informações Basicas:**__")
                        .setColor(ee.color)
                        .addField(`<:world:884218357304422420> Servidores`, `\`Total: ${client.guilds.cache.size}\``, true)
                        .addField(`<:people:814336053648949268> Usuarios`, `\`Total: ${client.users.cache.size}\``, true)
                        .addField("\u200b", `\u200b`, true)
                        .addField(`<:channel:884228094456627270> Canais`, `\`Total: ${client.channels.cache.size}\``, true)
                        .addField(`<:commands:884244807608827934> Comandos`, `\`Total: ${client.commands.map(cmd => cmd.name).length}\``, true)
                        .addField("\u200b", `\u200b`, true)
                        .addField("<:voice:884221993510133822> Canais de Voz", `\`${client.channels.cache.filter((ch) => ch.type === "GUILD_VOICE" || ch.type === "GUILD_STAGE_VOICE").size}\``, true)
                        .addField("<:voice:884221993510133822> Canais de Voz Conectados", `\`${connectedchannelsamount}\``, true)
                        .addField("\u200b", `\u200b`, true)
                        .addField("<:discord:884218858108489759> Livraria", `\`v${Discord.version}\``, true)
                        .addField("<:node:884214638567387176> Node", `\`${process.version}\``, true)
                        .addField("\u200b", `\u200b`, true)
												.addField(`<:ram:884220163354927154> RAM`, `\`${Math.trunc((process.memoryUsage().heapUsed) / 1024 / 1000)} MB / ${Math.trunc(os.totalmem() / 1024 / 1000)} MB (${Math.round((Math.round(process.memoryUsage().heapUsed / 1024 / 1024) / Math.round(os.totalmem() / 1024 / 1024)) * 100)}%)\``, true)
                        .addField("<:cpu:884219478664175687> CPU", `\`\`\`md\n${os.cpus().map((i) => `${i.model}`)[0]}\`\`\``)
                        .addField("<:cpu:884219478664175687> Uso da CPU", `\`${percent.toFixed(2)}%\``, true)
                        .addField(":gear: Arquitetura", `\`${os.arch()}\``, true)
                        .addField("\u200b", `\u200b`, true)
                        .addField("<:linux:884229003672686612> Sistema operacional", `\`${os.platform()}\``, true)
    								    .addField("\u200b", `\u200b`, true)
												.addField('__**Configurações do Servidor:**__', `\u200b`, true)
												.addField(`📌 Prefixo do Servidor`, `\`${prefix}\``, true)					.addField(`🎧 Cargos-DJ`, `${djs}`, true)
												.addField("\u200b", `\u200b`)
												.addField(":alarm_clock: Tempo de atividade ", `\`${prettyMilliseconds(client.uptime)}\``, true)								
                        .addField("<:latency:884230247032180806> Latência da API", `\`${client.ws.ping}ms\``, true)
                        .setFooter('Criado por: KingKiller®#1889','https://cdn.discordapp.com/avatars/718669518452293713/1893ff302ddf846e106f47159d308367.webp?size=4096');
                    message.reply({
                        embeds: [botinfo]
                    });
                }
            })

            function duration(duration, useMilli = false) {
                let remain = duration;
                let days = Math.floor(remain / (1000 * 60 * 60 * 24));
                remain = remain % (1000 * 60 * 60 * 24);
                let hours = Math.floor(remain / (1000 * 60 * 60));
                remain = remain % (1000 * 60 * 60);
                let minutes = Math.floor(remain / (1000 * 60));
                remain = remain % (1000 * 60);
                let seconds = Math.floor(remain / (1000));
                remain = remain % (1000);
                let milliseconds = remain;
                let time = {
                    days,
                    hours,
                    minutes,
                    seconds,
                    milliseconds
                };
                let parts = []
                if (time.days) {
                    let ret = time.days + ' Dia'
                    if (time.days !== 1) {
                        ret += 's'
                    }
                    parts.push(ret)
                }
                if (time.hours) {
                    let ret = time.hours + ' Hr'
                    if (time.hours !== 1) {
                        ret += 's'
                    }
                    parts.push(ret)
                }
                if (time.minutes) {
                    let ret = time.minutes + ' Min'
                    if (time.minutes !== 1) {
                        ret += 's'
                    }
                    parts.push(ret)

                }
                if (time.seconds) {
                    let ret = time.seconds + ' Seg'
                    if (time.seconds !== 1) {
                        ret += 's'
                    }
                    parts.push(ret)
                }
                if (useMilli && time.milliseconds) {
                    let ret = time.milliseconds + ' ms'
                    parts.push(ret)
                }
                if (parts.length === 0) {
                    return ['instantly']
                } else {
                    return parts
                }
            }
            return;
        } catch (e) {
            console.log(String(e.stack).bgRed)
        }
    }
}
