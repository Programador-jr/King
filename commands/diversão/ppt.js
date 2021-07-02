const Discord = require('discord.js');
const { MessageEmbed } = require("discord.js");

module.exports = {
    name: "ppt",
		usage: "ppt <pedra/papel/tesoura>",
    description: "Pedra papel tesoura",
    category: "diversão",
   run: async (client, message, args) => {
        const replies = ["pedra", "papel", "tesoura"];

        const reply = replies[Math.floor(Math.random() * replies.length)];
				if(!args.join(""))
				return message.channel.send("**pedra , papel ou tesoura? Escolha um -_-**")

        const embed = new MessageEmbed()
            .setTitle("Pedra Papel Tesoura")
            .setColor("GREEN")
            .addField(`Minha escolha`, `${reply}`)
						.addField(`Sua escolha`,`${args.join("")}`)
            .setFooter(message.author.username);

        message.channel.send(embed);
    },
};