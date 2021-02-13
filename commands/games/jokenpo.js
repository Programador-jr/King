const Discord = require('discord.js');

module.exports = {
	name:"jokenpo",
	category:"games",

	run: async(client, message, args) => {
		let User = message.mentions.users.first();
    let msa = message.author;
    if(!User) return message.reply("usuário não encontrado!")

    var winner = [
        `${User}`,
        `${msa}`
    ];

    var objeto = [
        "pedra! :rock: ",
        "papel! :roll_of_paper:",
        "tesoura! :scissors:"
    ];

    var objectrand = objeto[Math.floor(Math.random() * objeto.length)]
    var winnerand = winner[Math.floor(Math.random() * winner.length)]
    let embed = new Discord.MessageEmbed()
        .setDescription(`Pedra... Papel... Tesoura!\n\n${winnerand} ganhou o **jokenpo** usando ${objectrand}`)
        .setColor("RANDON")
        .setImage("https://media.discordapp.net/attachments/595001622523019284/746037885894918295/WhichDisastrousAmurratsnake.gif")
        .setFooter("Jo... Ken... Po!")
    
    message.channel.send(embed);
	}
}