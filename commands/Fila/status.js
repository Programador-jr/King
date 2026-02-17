const {
	MessageEmbed,
	Message
} = require("discord.js");
const config = require("../../botconfig/config.json");
const ee = require("../../botconfig/embed.json");
const settings = require("../../botconfig/settings.json");
const { getDashboardBaseUrl, getDashboardPort } = require("../../handlers/dashboardConfig");
const {
	check_if_dj
} = require("../../handlers/functions")

const dashboardBaseUrl = getDashboardBaseUrl() || `http://127.0.0.1:${getDashboardPort()}`;
module.exports = {
	name: "status", //the command name for the Slash Command

	category: "Fila",
	aliases: ["stats"],
	usage: "status",

	description: "Mostra o status da fila", //the command description for Slash Command Overview
	cooldown: 10,
	requiredroles: [], //Only allow specific Users with a Role to execute a Command [OPTIONAL]
	alloweduserids: [], //Only allow specific Users to execute a Command [OPTIONAL]
	run: async (client, message, args) => {
		try {
			//things u can directly access in an interaction!
			const {
				member,
				channelId,
				guildId,
				applicationId,
				commandName,
				deferred,
				replied,
				ephemeral,
				options,
				id,
				createdTimestamp
			} = message;
			const {
				guild
			} = member;
			const {
				channel
			} = member.voice;
			if (!channel) return message.reply({
				embeds: [
					new MessageEmbed().setColor(ee.wrongcolor).setTitle(`${client.allEmojis.x} **Por favor entre em ${guild.me.voice.channel ? "__meu__" : "um"} canal de voz primeiro!**`)
				],

			})
			if (channel.guild.me.voice.channel && channel.guild.me.voice.channel.id != channel.id) {
				return message.reply({
					embeds: [new MessageEmbed()
						.setColor(ee.wrongcolor)
						.setFooter(ee.footertext, ee.footericon)
						.setTitle(`${client.allEmojis.x} Entre no __meu__ canal de voz!`)
						.setDescription(`<#${guild.me.voice.channel.id}>`)
					],
				});
			}
			try {
				let newQueue = client.distube.getQueue(guildId);

        const currentFilters = Array.isArray(newQueue.filters) ? newQueue.filters : (Array.isArray(newQueue.filters?.names) ? newQueue.filters.names : []);
				if (!newQueue || !newQueue.songs || newQueue.songs.length == 0) return message.reply({
					embeds: [
						new MessageEmbed().setColor(ee.wrongcolor).setTitle(`${client.allEmojis.x} **Eu nÃ£o estou tocando nada agora!**`)
					],

				})
				var djs = client.settings.get(newQueue.id, `djroles`).map(r => `<@&${r}>`);
				if (djs.length == 0) djs = "`nÃ£o configurado`";
				else djs.join(", ");
				let newTrack = newQueue.songs[0];
				let embed = new MessageEmbed().setColor(ee.color)
					.setDescription(`Veja a [fila no **DASHBOARD** ao vivo!](${dashboardBaseUrl}/queue/${newQueue.id})`)
					.addField(`ðŸ’¡ Requerido por:`, `>>> ${newTrack.user}`, true)
					.addField(`â± DuraÃ§Ã£o:`, `>>> \`${newQueue.formattedCurrentTime} / ${newTrack.formattedDuration}\``, true)
					.addField(`ðŸŒ€ Fila:`, `>>> \`${newQueue.songs.length} musica(s)\`\n\`${newQueue.formattedDuration}\``, true)
					.addField(`ðŸ”Š Volume:`, `>>> \`${newQueue.volume} %\``, true)
					.addField(`â™¾ Loop:`, `>>> ${newQueue.repeatMode ? newQueue.repeatMode === 2 ? `${client.allEmojis.check_mark} \`Fila\`` : `${client.allEmojis.check_mark} \`Musica\`` : `${client.allEmojis.x}`}`, true)
					.addField(`â†ªï¸ ReproduÃ§Ã£o automÃ¡tica:`, `>>> ${newQueue.autoplay ? `${client.allEmojis.check_mark}` : `${client.allEmojis.x}`}`, true)
					.addField(`â” Baixar mÃºsica:`, `>>> [\`Clique aqui\`](${newTrack.streamURL})`, true)
					.addField(`â” Filtros${currentFilters.length > 0 ? "s": ""}:`, `>>> ${newQueue.filters && currentFilters.length > 0 ? `${currentFilters.map(f=>`\`${f}\``).join(`, `)}` : `${client.allEmojis.x}`}`, currentFilters.length > 1 ? false : true)
					.addField(`ðŸŽ§ CARGOS-DJ${client.settings.get(newQueue.id, "djroles").length > 1 ? "s": ""}:`, `>>> ${djs}`, client.settings.get(newQueue.id, "djroles").length > 1 ? false : true)
					.setAuthor(`${newTrack.name}`, `https://c.tenor.com/HJvqN2i4Zs4AAAAj/milk-and-mocha-cute.gif`, newTrack.url)
					.setThumbnail(newTrack.thumbnail || ee.footericon)
					.setFooter(`${newTrack.user.tag}`, newTrack.user.displayAvatarURL({
						dynamic: true
					}));
				message.reply({
					embeds: [embed]
				})
			} catch (e) {
				console.log(e.stack ? e.stack : e)
				message.reply({
					content: `${client.allEmojis.x} | Erro: `,
					embeds: [
						new MessageEmbed().setColor(ee.wrongcolor)
						.setDescription(`\`\`\`${e}\`\`\``)
					],

				})
			}
		} catch (e) {
			console.log(String(e.stack).bgRed)
		}
	}
}

