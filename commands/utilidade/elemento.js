const { MessageEmbed } = require('discord.js');
const request = require('request');

// Too fix the Literal String (My eyes get irritated)
const { stripIndents } = require('common-tags');

module.exports = {
	name: 'elemento',
	description: 'Search about elements from the periodic table',
	guildOnly: true,
	aliases: ['e'],
	usage: ['name of the element'],
  	example: 'Hydrogen',
	cooldown: 2,
	run:async (client, message, args) => {
		let element = args.join(" ");
		if(!element) return message.channel.send("No element provided!");
		const url = 'https://chemistrydata.herokuapp.com/elements/' + element;
		//const result = `${url}${element.split(/ +/g).join('')}`;

		request({url: url, json: true}, (err, res, body) => {
			if (typeof body.symbol == 'undefined') return message.channel.send("Can't find that element!")

			let embed = new RichEmbed()
			  .setTitle(`${element.slice(0,1).toUpperCase()}${element.slice(1)}`)
			  .setColor('#7289da')
			  //.setThumbnail(body.spectral_img)
			  .setDescription(body.summary)
			  .addField("Basics", stripIndents`
              **Number: **${body.number}
              **Symbol: **${body.symbol}
              **Appearance: **${body.appearance}
              **Atomic Mass: **${body.atomic_mass}
              **Boil: **${body.boil}
			  **Category: **${body.category}
              **Color: **${body.color}
              **Density: **${body.density}
              **Discovered By: **${body.discovered_by}
			  **Named By: **${body.named_by}
              `)
			  .addField("Data", stripIndents`
              **Melt: **${body.melt}
              **Molar Heat: **${body.molar_heat}
              **Period: **${body.period}
			  **Phase: **${body.phase}
              `)
			  .addField("Scientific", stripIndents`
              **XPos: **${body.xpos}
              **YPos: **${body.ypos}
              **Shells: **${body.shells}
			  **Electron Configuration: **${body.electron_configuration}
              **Electron Affinity: **${body.electron_affinity}
			  **Electronegativity Pauling: **${body.electronegativity_pauling}
              **Ionization Energies: **${body.ionization_energies}
              `)
			  .setFooter(`Source: ${body.source}`)
			  .setTimestamp(new Date())

        message.channel.send(embed)
		});
	},
};