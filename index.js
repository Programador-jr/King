const { token, default_prefix } = require('./config.json');
const emojis = ["👍", "👎", "❔", "🤔", "🙄", "❌"];
const isPlaying = new Set();
const { Client, MessageEmbed } = require("discord.js");
const { Aki } = require("aki-api");
const { badwords } = require('./data.json');
const { config } = require('dotenv');
var express = require('express');
var app = express();
const http = require('http');
const discord = require('discord.js'); //Vou usar o Módulo Discord.js
const client = new discord.Client({
	disableEveryone: false, // o que essa coisa de desabilitar faz?
});

//Faz o bot ficar online
app.get("/", (request, response) => {
  response.sendStatus(200); //responde quando recebe ping
  console.log("ping recebido!");


});
app.listen(process.env.PORT);


const db = require('quick.db'); //STAREMOS USANDO O QUICK.DB
const { addexp } = require('./handlers/xp.js');
client.commands = new discord.Collection();
client.aliases = new discord.Collection();

const { CanvasSenpai } = require('canvas-senpai');
const canva = new CanvasSenpai();

['command'].forEach(handler => {
	require(`./handlers/${handler}`)(client);
});

//é função URL - START

function is_url(str) {
	let regexp = /^(?:(?:https?|ftp):\/\/)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?$/;
	if (regexp.test(str)) {
		return true;
	} else {
		return false;
	}
}

//FINISH

//STOP
client.on('message', async message => {
	if (message.author.bot) return;
	//START



	//END
	if (!message.guild) return;
	let prefix = db.get(`prefix_${message.guild.id}`);
	if (prefix === null) prefix = default_prefix;

	if (!message.content.startsWith(prefix)) return;

	if (!message.member)
		message.member = await message.guild.fetchMember(message);

	const args = message.content
		.slice(prefix.length)
		.trim()
		.split(/ +/g);
	const cmd = args.shift().toLowerCase();

	if (cmd.length === 0) return;

	let cmdx = db.get(`cmd_${message.guild.id}`);

	if (cmdx) {
		let cmdy = cmdx.find(x => x.name === cmd);
		if (cmdy) message.channel.send(cmdy.responce);
	}

	// Pegue o comando
	let command = client.commands.get(cmd);
	// Se nenhum for encontrado, tente encontrá-lo pelo alias
	if (!command) command = client.commands.get(client.aliases.get(cmd));

	// Se um comando for finalmente encontrado, execute o comando
	if (command) command.run(client, message, args);

	return addexp(message);
});


//AKINATOR
client.on("message", async message => {
    if (message.author.bot || !message.guild) return;

    if (!message.content.startsWith(default_prefix + "aki")) return;

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
            .setDescription(`**${aki.answers[0].name}**\n${aki.answers[0].description}\nRanking**#${aki.answers[0].ranking}**\n\n[yes (**y**) / no (**n**)]`)
            .setImage(aki.answers[0].absolute_picture_path)
            .setColor("#00bfff"));

          const filter = m => /(yes|no|y|n)/i.test(m.content) && m.author.id == message.author.id;

          message.channel.awaitMessages(filter, {
              max: 1,
              time: 30000,
              errors: ["time"]
            })
            .then(collected => {
              const isWinner = /yes|y/i.test(collected.first().content);
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

client.login(token);
