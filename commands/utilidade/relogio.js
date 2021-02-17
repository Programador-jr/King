const Discord = require('discord.js');
const snekfetch = require('snekfetch');
const moment = require('moment');
const clocks = ["🕛", "🕐", "🕑", "🕒", "🕓", "🕔", "🕕", "🕖", "🕗", "🕘", "🕙", "🕚"]

module.exports = {
	name:"relogio",

    run:async (client, message, args) => {
        const location = message.content.split(/\s+/g).slice(1).join(" ");
        if (!location) return message.channel.send('Especifique um local para eu coletar informações!');

        try {
            const res = await snekfetch.get(`https://time.is/${location.replace(/^in/, "")}`);
            if (res.status !== 200) {
                return message.channel.send('❎ | Não pôde conectar-se ao servidor!')
            }

            const text = res.text || res.body.toString();

            const date = text.match(new RegExp('<div id="dd" class="w90 tr" onclick="location=\'/calendar\'" ' + 'title="Clique para o calendário">([^]+?)</div>'))[1]
            const time = text.match(/<div id="twd">([^]+?)<\/div>/)[1].replace(/<span id="ampm" style="font-size:21px;line-height:21px">(AM|PM)<\/span>/, ' $1')
            const place = text.match(/<div id="msgdiv"><h1>Time in ([^]+?) now<\/h1>/)[1]
            const clock = clocks[parseInt(time.split(':')[0], 10) % 12]

            var parsedTime = moment(`${date} ${time}`, 'dddd, MMMM D, YYYY HH:mm:ss A')
            return message.channel.send(`${clock} | A hora em **${place}** is \`${parsedTime.format('dddd, MMMM Do YYYY @ h:mm:ss a')}\`!`)

        } catch (err) {
            console.log(err)
            return message.channel.send(`❎ | Localização **${location}** não foi encontrada!`);
        }

    }
}