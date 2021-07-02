const config = require("../config.json")
const {prefix } = require('../config.json');
const emojis = ["👍", "👎", "❔", "🤔", "🙄", "❌"];
const isPlaying = new Set();
const { Client, MessageEmbed } = require("discord.js");
const { Aki } = require("aki-api");
console.log("Loading Setups")
const functions = require("../functions");
module.exports = (client) => {
    const guildonlycounter = new Map();
    let stateswitch = false;
		
		//AKINATOR
client.on("message", async message => {
    if (message.author.bot || !message.guild) return;

    if (!message.content.startsWith(prefix + "aki")) return;

    if (isPlaying.has(message.author.id)) {
      return message.channel.send(":x: | Um jogo já está em andamento..");
    }

    isPlaying.add(message.author.id);

    const aki = new Aki("pt"); // Lista completa de idiomas em: https://github.com/jgoralcz/aki-api

    await aki.start();

    const msg = await message.channel.send(new MessageEmbed()
      .setTitle(`${message.author.username}, Questão ${aki.currentStep + 1}`)
      .setColor("#00bfff")
      .setDescription(`**${aki.question}**\n${aki.answers.map((an, i) => `${an} | ${emojis[i]}`).join("\n")}`));

    for (const emoji of emojis) await msg.react(emoji);

    const collector = msg.createReactionCollector((reaction, user) => emojis.includes(reaction.emoji.name) && user.id == message.author.id, {
      time: 60000 * 6
    });

    collector
      .on("end", () => isPlaying.delete(message.author.id))
      .on("collect", async ({
        emoji,
        users
      }) => {
        users.remove(message.author).catch(() => null);

        if (emoji.name == "❌") return collector.stop();

        await aki.step(emojis.indexOf(emoji.name));

        if (aki.progress >= 70 || aki.currentStep >= 78) {

          await aki.win();

          collector.stop();

          message.channel.send(new MessageEmbed()
            .setTitle("Este é o seu personagem?")
            .setDescription(`**${aki.answers[0].name}**\n${aki.answers[0].description}\nRanking**#${aki.answers[0].ranking}**\n\n[sim (**y**) / não (**n**)]`)
            .setImage(aki.answers[0].absolute_picture_path)
            .setColor("#00bfff"));

          const filter = m => /(sim|não|s|n)/i.test(m.content) && m.author.id == message.author.id;

          message.channel.awaitMessages(filter, {
              max: 1,
              time: 30000,
              errors: ["time"]
            })
            .then(collected => {
              const isWinner = /sim|s/i.test(collected.first().content);
              message.channel.send(new MessageEmbed()
                .setTitle(isWinner ? "Excelente! Acertei mais uma vez":"Uh. você é o vencedor!")
                .setColor("#00bfff")
                .setDescription("Eu amo brincar com você"));
            }).catch(() => null);
        
        } else {
          msg.edit(new MessageEmbed()
            .setTitle(`${message.author.username}, Questão ${aki.currentStep + 1}`)
            .setColor("#00bfff")
            .setDescription(`**${aki.question}**\n${aki.answers.map((an, i) => `${an} | ${emojis[i]}`).join("\n")}`));
        }
      });
  })

  //FIM


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
	client.user.setStatus('online').catch(console.error);
	console.logyu
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
            .setColor(config.colors.yes)
            .setTitle('Menu de Ajuda - OBRIGADO POR ME CONVIDAR!')
            .addField("**__BOT BY:__**", `
                >>> <@442355791412854784> \`Tomato#6966\` [\`Website\`](https://kingbot.cf) [\`CONVITE\`]()
                `)
            .addField("**__Música - fontes suportadas__**", `
                >>> \`Youtube\`, \`Soundcloud\`, [\`Mais\`](https://links.musicium.eu), ...
                `)
            .setFooter(`Para ver as descrições dos comandos e o tipo de uso, use ${config.prefix}help [CMD Name]`, client.user.displayAvatarURL())

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
                channel.send("Não ative meu som !, mutei meu som novamente! Isso protege os dados para que você tenha uma experiência mais rápida e suave")
                newState.setDeaf(true);
            } catch (error) {
                try {
                    const channel = newState.member.guild.channels.cache.find(
                        channel =>
                        channel.type === "text" &&
                        channel.permissionsFor(newState.member.guild.me).has("SEND_MESSAGES")
                    );
                    channel.send("Não ative meu som !, mutei meu som novamente! Isso protege os dados para que você tenha uma experiência mais rápida e suave")
                    newState.setDeaf(true);
                } catch (error) {
                    newState.setDeaf(true);
                }
            }
        }
    });
    console.log("Configurações carregadas")
}
