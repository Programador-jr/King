const {MessageEmbed} = require("discord.js");

	module.exports = {
    name: "king",
		usage: "king <pergunta>",
		aliases: ["k", "guru", "8ball"],
		description: "Faça uma pergunta para o bot e ele irá responder você da Melhor forma possível.",
    category: "diversão",
    run: async (client, message, args) => {

			let respostas = [
  'Sim.',
	'Não.',
	'Talvez.',
	'Não sei',
	'Quem sabe?',
  'Provavelmente sim',
  'Provavelmente não',
	'Melhor você não saber.',
  'Um dia eu te conto',
  'Vai pertubar outra pessoa, por favor -_-',
  'Eu não sei, tente de novo',
  'Isso é um mistério',
  'Não posso te contar',
  'Meu informante disse que não',
  'Me pergunte mais tarde!',
  'Claro que não!',
  'Não conte comigo para isso',
  'Dúvido muito',
	'Eu acho que sim',
	'Eu acho que não'
]

const BallNum = Math.floor(Math.random() * respostas.length); 
const delay = (msec) => new Promise((resolve) => setTimeout(resolve, msec)); 

if(!args[0])return message.channel.send(new MessageEmbed()
.setColor("#ff0000")
.setTitle("Você deve me faxer uma pergunta ao executar o comando")
)
msg = await message.channel.send('Pergunta difícil, vamos ver...');
await delay(1000); 
msg.edit(respostas[BallNum]);

		}
};