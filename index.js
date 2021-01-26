const { token, default_prefix } = require('./config.json');
const { badwords } = require('./data.json');
const { config } = require('dotenv');
const discord = require('discord.js'); //Vou usar o Módulo Discord.js
const client = new discord.Client({
	disableEveryone: true // o que essa coisa de desabilitar faz?
});

const db = require('quick.db'); //STAREMOS USANDO O QUICK.DB
const { addexp } = require('./handlers/xp.js');
client.commands = new discord.Collection();
client.aliases = new discord.Collection();

const { CanvasSenpai } = require('canvas-senpai');
const canva = new CanvasSenpai();

['command'].forEach(handler => {
	require(`./handlers/${handler}`)(client);
});

client.on('ready', () => {
	let activities = [
			`use k!help para obter ajuda!`,
			`em ${client.channels.cache.size} canais!`,
			`para ${client.users.cache.size} usuários!`
		],
		i = 0;
	setInterval(
		() =>
			client.user.setActivity(`${activities[i++ % activities.length]}`, {
				type: 'STREAMING'
			}),
		1000 * 60
	);
	client.user.setStatus('online').catch(console.error);
	console.log('Estou Online!');
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

//VAI USAR O EVENTO AQUI

client.on('guildMemberAdd', async member => {
	let chx = db.get(`welchannel_${member.guild.id}`);

	if (chx === null) {
		return;
	}

	let data = await canva.welcome(member, {
		link:
			'https://img.freepik.com/vetores-gratis/abstrato-amarelo-em-quadrinhos-zoom_1409-923.jpg?size=626&ext=jpg'
	});

	const attachment = new discord.MessageAttachment(data, 'welcome-image.png');

	client.channels.cache
		.get(chx)
		.send(
			'**${member.user}**, bem-vindo(a) ao servidor **${guild.name}**! Atualmente estamos com **${member.guild.memberCount} membros**, divirta-se conosco! :heart:'
		);
});

client.login(token);
