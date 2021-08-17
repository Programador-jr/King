const canvacord = require("canvacord");
const c = require("colors");
const ranking = require("./ranking");
const ScrapeYt = require("scrape-yt");
const spotify = require("spotify-url-info")
const YTDL = require("discord-ytdl-core");
const config = require("./config.json");
var express =  require ('express');
var app = express();
const {
		Client,
    Collection
} = require("discord.js");
const Discord = require('discord.js');
const fs = require("fs");
const DisTube = require("distube");
require('canvas').registerFont("Genta.ttf", {
    family: "Genta"
}); //loading a font
//creating the client
const client = new Client({
    fetchAllMembers: false,
    restTimeOffset: 0,
    shards: "auto",
    disableEveryone: true,
		intents: 32767
});

client.commands = new Collection();
client.queue = new Map();
client.aliases = new Collection();
const cooldowns = new Collection();
//audiosetups


const https = require('https-proxy-agent');
const proxy = 'http://123.123.123.123:8080';
const agent = https(proxy);
client.distube = new DisTube(client, {
    youtubeCookie: config.cookie,
    requestOptions: {
        agent
    },
    searchSongs: true,
    emitNewSongOnly: true,
    highWaterMark: 1024 * 1024 * 64,
    leaveOnEmpty: true,
    leaveOnFinish: true,
    leaveOnStop: true,
    searchSongs: false,
    youtubeDL: true,
    updateYouTubeDL: false,
    customFilters: config.customs
})

app.get("/", (request, response) => {
  response.sendStatus(200); //responde quando recebe ping
  console.log(c.green("ping recebido!"));


});
app.listen(process.env.PORT);

client.on("message", async message => {

    //Do not detect bots
    if (message.author.bot) return;

    //If '<prefix>download' is typed
    if (message.content.startsWith(config.prefix + "baixar")) {

        //Require args
        let args = message.content.split(' ').slice(1);

        //If no args is provided
        if (!args[0]) return message.channel.send(`⛔ | ${message.author}, Insira o URL de uma música no YouTube!`);

        //New infos & stream
        let infos;
        let stream;

        try {
            //The bot is trying to find the music provided
            stream = YTDL(args.join(" "), { encoderArgs: ['-af','dynaudnorm=f=200'], fmt: 'mp3', opusEncoded: false });
            infos = await ScrapeYt.search(args.join(" "));
        } catch (e) {
            //If the music is not found
            return message.channel.send(`⛔ | ${message.author}, Não encontrei nada para : ${args.join(" ")} !`);
        }

        try {
            //Confirmation message
            message.channel.send(`:notes: | ${message.author},  Vou tentar enviar ${infos[0].title} quando o download terminar...`);

            //Saving the file in the folder 'download'
            stream.pipe(createWriteStream(__dirname + `/download/${infos[0].title}.mp3`)).on('finish', () => {

                //Sending the mp3 file
                try {
                    message.channel.send(`🎵 | ${message.author}, musica : ${infos[0].title} em mp3.`, new Discord.MessageAttachment(__dirname + `/download/${infos[0].title}.mp3`, `${infos[0].title}.mp3`))
                } catch (e) {
                    return message.channel.send(`⛔ | ${message.author}, Não consegui mandar a música ... talvez seja muito pesada para o Discord? Ou talvez eu não tenha as permissões necessárias para fazer upload deste tipo de arquivo neste servidor...`);
                }

            })
        } catch (e) {
            //If the music is not found
            return message.channel.send(`⛔ | ${message.author}, Não encontrei nada para : ${args.join(" ")} ! Talvez seja impossível recuperar esta música ...`);
        }
    }

});

client.setMaxListeners(0);
require('events').defaultMaxListeners = 0;
//Externalfiles setups
client.categories = fs.readdirSync("./commands/");
["command"].forEach(handler => {
    require(`./handlers/${handler}`)(client);
});
require("./handlers/slashcommands")(client);


require("./handlers/setups")(client)
const functions = require("./functions")
//databases setups
const Enmap = require("enmap");
client.settings = new Enmap({
    name: "settings",
    dataDir: "./databases/settings"
});
client.infos = new Enmap({
    name: "infos",
    dataDir: "./databases/infos"
});
client.custom = new Enmap({
    name: "custom",
    dataDir: "./databases/playlist"
});
client.custom2 = new Enmap({
    name: "custom",
    dataDir: "./databases/playlist2"
});
client.points = new Enmap({
	 name: "points" });
function escapeRegex(str) {
    try {
      return str.replace(/[.*+?^${}()|[\]\\]/g, `\\$&`);
    } catch (e) {
      console.log(String(e.stack).bgRed)
    }
  }
//registering a command setup
client.on("message", async message => {
    if (message.author.bot) return;
    if (!message.guild) return;
    //GET THE PREFIX

    let prefix = client.settings.get(message.guild.id, `prefix`);
    if (prefix === null) prefix = config.prefix; //if not prefix set it to standard prefix in the config.json file
    const prefixRegex = new RegExp(`^(<@!?${client.user.id}>|${escapeRegex(prefix)})\\s*`);
    if (!prefixRegex.test(message.content)) return;
    const [, matchedPrefix] = message.content.match(prefixRegex);
    prefix = matchedPrefix;

    if (!message.content.startsWith(prefix) && message.content.includes(client.user.id))
        if (!message.guild.me.permissionsIn(message.channel).has("EMBED_LINKS"))
            message.reply(new Discord.MessageEmbed().setColor(config.colors.yes).setAuthor(`${message.author.username}, Meu prefixo é ${prefix}, Para começar: ${prefix}help`, message.author.displayAvatarURL({
                dynamic: true
            }), "https://kingbot.cf"));
        else
            message.reply(`${message.author.username}, Meu prefixo é ${prefix}, para começar ${prefix}help`)
    if (!message.content.startsWith(prefix)) return;

    //if not allowed to send embeds, return that
    if (!message.guild.me.permissionsIn(message.channel).has("EMBED_LINKS"))
        return message.reply("**:x: Estou perdendo a permissão para `EMBED_LINKS`**")

    //CHECK IF IN A BOT CHANNEL OR NOT
    if (client.settings.get(message.guild.id, `botchannel`).toString() !== "") {
        if (!client.settings.get(message.guild.id, `botchannel`).includes(message.channel.id) && !message.member.hasPermission("ADMINISTRATOR")) {
            let leftb = "";
            for (let i = 0; i < client.settings.get(message.guild.id, `botchannel`).length; i++) {
                leftb += "<#" + client.settings.get(message.guild.id, `botchannel`)[i] + "> / "
            }
            return functions.embedbuilder(client, 5000, message, config.colors.no, `Não no bate-papo do bot! `,` Há uma configuração de bate-papo do bot nesta GUILDA! tente usar os comandos do bot aqui: 
            > ${leftb}`)
        }
    }

    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const cmd = args.shift().toLowerCase();

    if (cmd.length === 0) return;
    let command = client.commands.get(cmd);
    if (!command) command = client.commands.get(client.aliases.get(cmd));
    if (command) {
        if (!cooldowns.has(command.name)) {
            cooldowns.set(command.name, new Collection());
        }

        const now = Date.now();
        const timestamps = cooldowns.get(command.name);
        const cooldownAmount = (command.cooldown || 2) * 1000;

        if (timestamps.has(message.author.id)) {
            const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000;
                return message.reply(
                    `Por favor aguarde ${timeLeft.toFixed(1)} mais alguns segundo(s) antes de reutilizar o comando \`${command.name}\``
                );
            }
        }

        timestamps.set(message.author.id, now);
        setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

        client.infos.set("global", Number(client.infos.get("global", "cmds")) + 1, "cmds");

        message.react("✅").catch(e => console.log("NÃO PODEREI REAGIR F"))

        try {
            command.run(client, message, args);
        } catch (error) {
            console.error(error)
            functions.embedbuilder(client, 5000, message, "RED", "ERROR: ", "```" + error.toString().substr(0, 100) + "```" + "\n\n**Erro enviado ao meu proprietário!**")
            functions.errorbuilder(error.stack.toString().substr(0, 2000))
        }
    } else
        return message(``)
});


ranking(client); 
client.login(process.env.TOKEN);

process.on('unhandledRejection', (reason, p) => {
    console.log('=== rejeição não tratada ==='.toUpperCase());
});
process.on("uncaughtException", (err, origin) => {
    console.log('=== exceção não capturada ==='.toUpperCase());
})
process.on('uncaughtExceptionMonitor', (err, origin) => {
    console.log('=== monitor de exceção não capturado ==='.toUpperCase());
});
process.on('beforeExit', (code) => {
    console.log('=== antes de sair ==='.toUpperCase());
});
process.on('exit', (code) => {
    console.log('=== sair ==='.toUpperCase());
});
process.on('multipleResolves', (type, promise, reason) => {
    console.log('=== várias resoluções ==='.toUpperCase());
});