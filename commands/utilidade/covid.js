const axios = require('axios');
const { MessageEmbed } = require('discord.js')

module.exports = {
    name: "covid",
		usage: "covid <país>",
		aliases: ["co"],
		description: "Receba atualizações de todo o mundo dos casos de covid 19",
    category: "utilidade",
    run: async (client, message, args) => {
        const baseUrl = "https://corona.lmao.ninja/v2";

        let url, response, corona;

        try {
            url = args[0] ? `${baseUrl}/countries/${args[0]}`:`${baseUrl}/all`
            response = await axios.get(url)
            corona = response.data
        } catch (error) {
            return message.channel.send(`***${args[0]}*** não existe ou os dados não estão sendo coletados`)
        }

        const embed = new MessageEmbed()
            .setTitle(args[0] ? `${args[0].toUpperCase()} Estatísticas` : 'Total de casos de Corvid em todo o mundo')
            .setColor('#fb644c')
            .setThumbnail(args[0] ? corona.countryInfo.flag : 'https://media1.giphy.com/media/SxKiUZFgroqSk3evB7/giphy.gif')
            .addFields(
                {
                    name: 'Total de casos:',
                    value: corona.cases.toLocaleString(),
                    inline: true
                },
                {
                    name: 'Total de mortes:',
                    value: corona.deaths.toLocaleString(),
                    inline: true
                },
                {
                    name: 'Total de recuperados:',
                    value: corona.recovered.toLocaleString(),
                    inline: true
                },
                {
                    name: 'Casos ativos:',
                    value: corona.active.toLocaleString(),
                    inline: true
                },
                {
                    name: '\u200b',
                    value: '\u200b',
                    inline: true
                },
                {
                    name: 'Casos críticos:',
                    value: corona.critical.toLocaleString(),
                    inline: true
                },
                {
                    name: 'Recuperações de hoje:',
                    value: corona.todayRecovered.toLocaleString().replace("-", ""),
                    inline: true
                },
                {
                    name: 'Mortes de hoje:',
                    value: corona.todayDeaths.toLocaleString(),
                    inline: true
                })

        await message.channel.send(embed)
    }
};