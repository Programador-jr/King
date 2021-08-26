const mongoose = require('mongoose');
const mongoCurrency = require('discord-mongo-currency');
const db = require("quick.db")
const config = require("../config.json")
const {prefix } = require('../config.json');
const c = require('colors')
const emojis = ["👍", "👎", "❔", "🤔", "🙄", "❌"];
const isPlaying = new Set();
const { Client, MessageEmbed } = require("discord.js");
const { Aki } = require("aki-api");
console.log(c.brightRed("Carregando Configurações"))
const functions = require("../functions");
module.exports = (client) => {
    const guildonlycounter = new Map();
    let stateswitch = false;

client.on("guildCreate", guild => {
   guild.owner.send("Obrigado por me adicionar use k!help para ver meus comandos ou acesse meu Website https://kingbot.cf")
	  console.log(c.red(`Adicionado a uma nova guilda: ${guild.name} (id: ${guild.id}). A guilda contem ${guild.memberCount} membros!`));
});		
		
		client.on('ready', () => {
	console.log(c.green(`Logado em ${client.user.tag} atualmente em ${client.guilds.cache.size} Guildas`))
	 	const Guilds = 
	client.guilds.cache.array().map((G, I) => 
	`${I+1}. ${G.name} - ${G.id}`).join("\n");
		if (!Guilds) return console.log("Nenhuma Guilda");
			return console.log(c.red(Guilds));			
});

client.on("guildCreate", guild => {

  const { MessageEmbed } = require("discord.js");

  const ID = "865255179788222485";

  const channel = client.channels.cache.get(ID);

  const sowner = guild.owner.user;

  if (!channel) return;

  const embed = new MessageEmbed()

    .setTitle("**I Joined a Server!**")

    .addField(`**SERVER NAME**`, `\`\`\`${guild.name}\`\`\``)

    .addField(`**SERVER ID**`, `\`\`\`${guild.id}\`\`\``)

    .addField(`**SERVER OWNER**`, `\`\`\`${sowner.tag}\`\`\``)

    .addField(`**OWNER ID**`, `\`\`\`${sowner.id}\`\`\``)
 
    .addField(`**CREATED ON**`, `\`\`\`${guild.createdAt}\`\`\``)
  
    .addField(`**MEMBERS**`, `\`\`\`${guild.memberCount}\`\`\``)
  
    .setTimestamp()

    .setColor("32CD32")

    .setFooter(`Servers Count - ${client.guilds.cache.size}`);

  channel.send(embed);

});


client.on('ready', () => {
    let status = [
        { name: `❓ Se você precisa de ajuda use ${prefix}help`, type: "PLAYING" },
        { name: `Me adicione usando ${prefix}convite`, type: "WATCHING" },
				{ name: `para ${client.users.cache.size} usuários | ${client.guilds.cache.size} servidores e ${client.channels.cache.size} canais`, type: "STREAMING", url: "https://www.twitch.tv/nocopyrightsounds"}

    ];
    setInterval(() => {
        let randomStatus = status[Math.floor(Math.random() * status.length)];
        client.user.setPresence({ activity: randomStatus });
		}, 10000 * 30);
	client.user.setStatus('online').catch(console.err);
	console.log(err)
});

    client.on("guildCreate", guild => {
        client.settings.delete(guild.id, "prefix");
        client.settings.delete(guild.id, "djroles");
        client.settings.delete(guild.id, "playingembed");
        client.settings.delete(guild.id, "playingchannel");
        client.settings.delete(guild.id, "botchannel");
        client.custom.delete(guild.id, "playlists");
        client.custom.ensure(guild.id, {
            playlists: [],
        });
        client.settings.ensure(guild.id, {
            prefix: config.prefix,
            djroles: [],
            playingembed: "",
            playingchannel: "",
            botchannel: [],
        });
        getAll(client, guild)
    })
    //When a Channel got deleted, try to remove it from the BOTCHANNELS     
    client.on("channelDelete", function (channel) {
        client.settings.remove(channel.guild.id, channel.id, `botchannel`);
    });
    //When a Role got deleted, try to remove it from the DJROLES
    client.on("roleDelete", function (role) {
        client.settings.remove(role.guild.id, role.id, `djroles`);
    });
    client.on("message", async message => {
        client.custom.ensure(message.guild.id, {
            playlists: [],
        });
        client.custom2.ensure(message.author.id, {
            myplaylists: [],
        });
        client.infos.ensure("global", {
            cmds: 0,
            songs: 0,
            filters: 0,
        })
        client.settings.ensure(message.guild.id, {
            prefix: config.prefix,
            djroles: [],
            playingembed: "",
            playingchannel: "",
            botchannel: [],
        });
        if (message.author.bot) return;
        if (!message.guild) return;
        //create the database for the OWN user
        client.custom2.ensure(message.author.id, {
            myplaylists: [],
        });

    });
    const {
        MessageEmbed
    } = require("discord.js");
    const {
        stripIndents
    } = require("common-tags");

    function getAll(client, guild) {
        const embed = new MessageEmbed()
            .setColor('#00bfff')
            .setTitle('Menu de Ajuda - OBRIGADO POR ME CONVIDAR!')
            .addField("**__BOT DE:__**", `
                >>> \`KingKiller®#1889\` [\`Website\`](https://kingbot.cf) [\`CONVITE\`](https://discord.com/oauth2/authorize?client_id=794291443454836766&permissions=37080128&scope=bot)
                `)
            .addField("**__Música - fontes suportadas__**", `
                >>> \`Youtube\`, \`Soundcloud\`, [\`Mais\`](https://links.musicium.eu), ...
                `)
            .setFooter(`Para ver as descrições dos comandos e o tipo de uso, use ${config.prefix}ajuda [CMD Name]`, client.user.displayAvatarURL())

        const commands = (category) => {
            return client.commands
                .filter(cmd => cmd.category === category)
                .map(cmd => `\`${cmd.name}\``)
                .join(", ");
        }

        const info = client.categories
            .map(cat => stripIndents `**__${cat[0].toUpperCase() + cat.slice(1)}__** \n> ${commands(cat)}`)
            .reduce((string, category) => string + "\n\n" + category);
        const channel = guild.channels.cache.find(
            channel =>
            channel.type === "text" &&
            channel.permissionsFor(guild.me).has("SEND_MESSAGES")
        );
        return channel.send(embed.setDescription(`*use o Prefixo **\`${config.prefix}\`** na frente de CADA comando, para usá-lo corretamente!*\n` + info));
    }
    client.on('voiceStateUpdate', (oldState, newState) => {
        if (newState.id === client.user.id && oldState.serverDeaf === true && newState.serverDeaf === false) {
            try {
                const channel = newState.member.guild.channels.cache.find(
                    channel =>
                    channel.type === "text" &&
                    (channel.name.includes("cmd") || channel.name.includes("command") || channel.name.includes("bot")) &&
                    channel.permissionsFor(newState.member.guild.me).has("SEND_MESSAGES")
                );
                channel.send("Não ative meu som!, mutei meu som novamente! Isso protege os dados para que você tenha uma experiência mais rápida e suave")
                newState.setDeaf(true);
            } catch (error) {
                try {
                    const channel = newState.member.guild.channels.cache.find(
                        channel =>
                        channel.type === "text" &&
                        channel.permissionsFor(newState.member.guild.me).has("SEND_MESSAGES")
                    );
                    channel.send("Não ative meu som!, mutei meu som novamente! Isso protege os dados para que você tenha uma experiência mais rápida e suave")
                    newState.setDeaf(true);
                } catch (error) {
                    newState.setDeaf(true);
                }
            }
        }
    });
    console.log(c.green("Configurações carregadas"))
		mongoose.connect(process.env.Database, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
}).then(console.log(c.yellow('Conectado ao MongoDB.')))
}
