const Discord = require('discord.js');
const snekfetch = require('snekfetch');

module.exports = {
	name:"steam",

	  args: [{
        key: 'query',
        prompt: 'Por favor, forneça-me um jogo para pesquisar!',
       type: 'string',                
			 default: 'Doki Doki Literature Club'
	 }],
  run:async (client, message, args) => {
            const { query } = args;
            const search = await snekfetch
				.get('https://store.steampowered.com/api/storesearch')
				.query({
					cc: 'br',
					l: 'pt',
					term: query
                });
                
            if (!search.body.items.length) return msg.say(`Nenhum resultado encontrado para **${query}**!`);
            
            const { id, tiny_image } = search.body.items[0];
            
			const { body } = await snekfetch
				.get('https://store.steampowered.com/api/appdetails')
                .query({ appids: id });
                
			const { data } = body[id.toString()];
			const current = data.price_overview ? `$${data.price_overview.final / 100}` : 'Grátis';
			const original = data.price_overview ? `$${data.price_overview.initial / 100}` : 'Grátis';
			const price = current === original ? current : `~~${original}~~ ${current}`;
			const platforms = [];
			if (data.platforms) {
				if (data.platforms.windows) platforms.push('Windows');
				if (data.platforms.mac) platforms.push('Mac');
				if (data.platforms.linux) platforms.push('Linux');
			}

            const embed = new Discord.MessageEmbed()
                .setColor(0x101D2F)
                .setAuthor('Steam', 'https://i.imgur.com/xxr2UBZ.png', 'http://store.steampowered.com/')
                .setTitle(data.name)
				.setURL(`http://store.steampowered.com/app/${data.steam_appid}`)
                .setImage(tiny_image)
				.addField('❯\u2000Preço', `•\u2000 ${price}`, true)
				.addField('❯\u2000Pontos', `•\u2000 ${data.metacritic ? data.metacritic.score : '???'}`, true)
				.addField('❯\u2000Recomendações', `•\u2000 ${data.recommendations ? data.recommendations.total : '???'}`, true)
				.addField('❯\u2000Plataformas', `•\u2000 ${platforms.join(', ') || 'None'}`, true)
				.addField('❯\u2000Data de lançamento', `•\u2000 ${data.release_date ? data.release_date.date : '???'}`, true)
				.addField('❯\u2000Contagem de DLC', `•\u2000 ${data.dlc ? data.dlc.length : 0}`, true)
				.addField('❯\u2000Desenvolvedores', `•\u2000 ${data.developers ? data.developers.join(', ') || '???' : '???'}`, true)
				.addField('❯\u2000Editoras', `•\u2000 ${data.publishers ? data.publishers.join(', ') || '???' : '???'}`, true);
		return message.channel.send({ embed });
	}
};