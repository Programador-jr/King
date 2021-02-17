const { token, default_prefix } = require('./config.json');
const { badwords } = require('./data.json');
const { config } = require('dotenv');
var express = require('express');
var app = express();
const http = require('http');
const discord = require('discord.js'); //Vou usar o Módulo Discord.js
const client = new discord.Client({
	disableEveryone: true, // o que essa coisa de desabilitar faz?
	partials : ["MESSAGE", "CHANNEL", "REACTION"]
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

//VAI USAR O EVENTO AQUI
client.on("guildMemberAdd", async (member) => {
  let chx = db.get(`welchannel_${member.guild.id}`);
  
  if(chx === null) {
    return;
  }
  
  let default_url = `https://cdn.discordapp.com/attachments/696417925418057789/716197399336583178/giphy.gif`
  
  let default_msg = `━━━━━━━━━━━━━━━━━━━━━━━━
  | WELCOME ${member} TO ${member.guild}
        
━━━━━━━━━━━━━━━━━━━━━━━━
 | BE SURE THAT YOU HAVE READ    
           |RULES
━━━━━━━━━━━━━━━━━━━━━━━━
 | USERNAME ${member.username}  
|RANK is ${member.member_count}  ━━━━━━━━━━━━━━━━━━━━━━━━
 | YOU CAN ENJOY IN  CHATTING 
━━━━━━━━━━━━━━━━━━━━━━━━
            THANKS FOR JOINING US
`
  
  let m1 = db.get(`msg_${member.guild.id}`)

const msg = m1
.replace("{member}", member.user)
.replace("{member.guild}", member.guild)
.replace("(:HEART)",`<a:BH:731369456634429493>`)

  
  let url = db.get(`url_${member.guild.id}`)
  if(url === null) url = default_url
  
   let data = await canva.welcome(member, { link: "https://wallpapercave.com/wp/wp5128415.jpg" })
 
    const attachment = new discord.MessageAttachment(
      data,
      "welcome-image.png"
    );

  let wembed = new discord.MessageEmbed()
  .setAuthor(member.user.username, member.user.avatarURL({dynamic: true, size: 2048}))
  .setThumbnail(member.user.displayAvatarURL({dynamic: true, size: 2048}))
  .setColor("RANDOM")
  .setImage()
  .setDescription(msg);
  
  client.channels.cache.get(chx).send(wembed)
  client.channels.cache.get(chx).send(attachment)
})


//NOVO EVENTO

const usersMap = new Map();
const LIMIT = 5;
const TIME = 7000;
const DIFF = 3000;

client.on('message', async(message) => {
    if(message.author.bot) return;
    if(usersMap.has(message.author.id)) {
        const userData = usersMap.get(message.author.id);
        const { lastMessage, timer } = userData;
        const difference = message.createdTimestamp - lastMessage.createdTimestamp;
        let msgCount = userData.msgCount;
        console.log(difference);

        if(difference > DIFF) {
            clearTimeout(timer);
            console.log('Limpo de tempo limite');
            userData.msgCount = 1;
            userData.lastMessage = message;
            userData.timer = setTimeout(() => {
                usersMap.delete(message.author.id);
                console.log('Removido do mapa.')
            }, TIME);
            usersMap.set(message.author.id, userData)
        }
        else {
            ++msgCount;
            if(parseInt(msgCount) === LIMIT) {
                let muterole = message.guild.roles.cache.find(role => role.name === 'mutado');
                if(!muterole) {
                    try{
                        muterole = await message.guild.roles.create({
                            name : "mutado",
                            permissions: []
                        })
                        message.guild.channels.cache.forEach(async (channel, id) => {
                            await channel.createOverwrite(mutadorole, {
                                SEND_MESSAGES: false,
                                ADD_REACTIONS : false
                            })
                        })
                    }catch (e) {
                        console.log(e)
                    }
                }
                message.member.roles.add(mutadorole);
                message.channel.send('Você foi silenciado!');
                setTimeout(() => {
                    message.member.roles.remove(mutadorole);
                    message.channel.send('Você foi reativado!')
                }, TIME);
            } else {
                userData.msgCount = msgCount;
                usersMap.set(message.author.id, userData);
            }
        }
    }
    else {
        let fn = setTimeout(() => {
            usersMap.delete(message.author.id);
            console.log('Removido do mapa.')
        }, TIME);
        usersMap.set(message.author.id, {
            msgCount: 1,
            lastMessage : message,
            timer : fn
        });
    }
})

client.login(token);
