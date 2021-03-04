const { MessageEmbed } = require('discord.js');
const axios = require('axios');

module.exports = {
    name: "binario",
    category: "diversão",
    run: async (client, message, args) => {
        const url = `http://some-random-api.ml/binary?text=${args}`;

        let response, data;
        try {
            response = await axios.get(url);
            data = response.data;
        } catch (e) {
            return message.channel.send(`Ocorreu um erro, tente novamente!`)
        }

        const embed = new MessageEmbed()
            .setTitle('Texto para binário')
            .setDescription(data.binary)
						.setColor('#00bfff')

        await message.channel.send(embed)
    }
}