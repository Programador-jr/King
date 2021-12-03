const {
	MessageEmbed,
	Message
} = require("discord.js");
const config = require("../../botconfig/config.json");
const ee = require("../../botconfig/embed.json");
const settings = require("../../botconfig/settings.json");
const {
	check_if_dj
} = require("../../handlers/functions")
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
				if (!newQueue || !newQueue.songs || newQueue.songs.length == 0) return message.reply({
					embeds: [
						new MessageEmbed().setColor(ee.wrongcolor).setTitle(`${client.allEmojis.x} **Eu não estou tocando nada agora!**`)
					],

				})
				var djs = client.settings.get(newQueue.id, `djroles`).map(r => `<@&${r}>`);
				if (djs.length == 0) djs = "`não configurado`";
				else djs.join(", ");
				let newTrack = newQueue.songs[0];
				let embed = new MessageEmbed().setColor(ee.color)
					.setDescription(`Veja a [fila no **DASHBOARD** ao vivo!](https://king-v13.kingprogrammer.repl.co/queuedashboard${newQueue.id})`)
					.addField(`💡 Requerido por:`, `>>> ${newTrack.user}`, true)
					.addField(`⏱ Duração:`, `>>> \`${newQueue.formattedCurrentTime} / ${newTrack.formattedDuration}\``, true)
					.addField(`🌀 Fila:`, `>>> \`${newQueue.songs.length} song(s)\`\n\`${newQueue.formattedDuration}\``, true)
					.addField(`🔊 Volume:`, `>>> \`${newQueue.volume} %\``, true)
					.addField(`♾ Loop:`, `>>> ${newQueue.repeatMode ? newQueue.repeatMode === 2 ? `${client.allEmojis.check_mark} \`Queue\`` : `${client.allEmojis.check_mark} \`Song\`` : `${client.allEmojis.x}`}`, true)
					.addField(`↪️ Reprodução automática:`, `>>> ${newQueue.autoplay ? `${client.allEmojis.check_mark}` : `${client.allEmojis.x}`}`, true)
					.addField(`❔ Baixar música:`, `>>> [\`Clique aqui\`](${newTrack.streamURL})`, true)
					.addField(`❔ Filtros${newQueue.filters.length > 0 ? "s": ""}:`, `>>> ${newQueue.filters && newQueue.filters.length > 0 ? `${newQueue.filters.map(f=>`\`${f}\``).join(`, `)}` : `${client.allEmojis.x}`}`, newQueue.filters.length > 1 ? false : true)
					.addField(`🎧 CARGOS-DJ${client.settings.get(newQueue.id, "djroles").length > 1 ? "s": ""}:`, `>>> ${djs}`, client.settings.get(newQueue.id, "djroles").length > 1 ? false : true)
					.setAuthor(`${newTrack.name}`, `https://c.tenor.com/HJvqN2i4Zs4AAAAj/milk-and-mocha-cute.gif`, newTrack.url)
					.setThumbnail(`https://img.youtube.com/vi/${newTrack.id}/mqdefault.jpg`)
					.setFooter(`${newTrack.user.tag}`, newTrack.user.displayAvatarURL({
						dynamic: true
					}));
				message.reply({
					embeds: [embed]
				})
			} catch (e) {
				console.log(e.stack ? e.stack : e)
				message.reply({
					content: `${client.allEmojis.x} | Error: `,
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
