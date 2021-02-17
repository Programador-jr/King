const math = require('mathjs');

const Discord = require('discord.js');

module.exports = {
    name: "calculadora",
    aliases: ['calc', 'calcular', 'mat'],
		category:"utilidade",
 run:async (client, message, args) => {

        if(!args[0]) return message.channel.send('Por favor digite algo!');

        let resp;

        try {
            resp = math.evaluate(args.join(" "))
        } catch (e) {
            return message.channel.send('Por favor digite um número válido!')
        }
        let error = new Discord.MessageEmbed()
        .setColor('0079d8')
        .setTitle(':(')
        .setDescription('\n\n Seu PC teve um problema e precisa ser reiniciado. Estamos apenas coletando algumas informações de erro e, em seguida, reiniciaremos para você.')
        .setImage('https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Bsodwindows10.png/1200px-Bsodwindows10.png')
        if(args == 'NaN') return message.channel.send(error)
        const embed = new Discord.MessageEmbed()
            .setColor('GREEN')
            .setTitle('Calculadora')
            .addField('Questão', `\`\`\`css\n${args.join(' ')}\`\`\``)
            .addField('Resposta', `\`\`\`css\n${resp}\`\`\``)

        message.channel.send(embed);

    }
}