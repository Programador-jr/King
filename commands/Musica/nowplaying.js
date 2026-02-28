const {
	MessageEmbed
} = require("discord.js");
const config = require("../../botconfig/config.json");
const ee = require("../../botconfig/embed.json");
const {
	check_if_dj
} = require("../../handlers/functions")

const getCurrentFilters = (queue) => {
  if (!queue) return [];
  if (Array.isArray(queue.filters?.names)) return queue.filters.names;
  if (queue.filters?.collection) return [...queue.filters.collection.keys()];
  return [];
};

module.exports = {
	name: "nowplaying",
	category: "Musica",
	usage: "nowplaying",
	aliases: ["np", "current", "agora", "now"],
	description: "Mostra a música que está tocando no momento",
	cooldown: 5,
	requiredroles: [],
	alloweduserids: [],
	run: async (client, message, args) => {
		try {
			const { member, guildId, guild } = message;
			const { channel } = member.voice;
			
			if (!channel) return message.reply({
				embeds: [
					new MessageEmbed().setColor(ee.wrongcolor).setTitle(`${client.allEmojis.x} **Por favor junte-se ${guild.me.voice.channel ? "__ao meu__" : "a um"} Canal de voz primeiro!**`)
				]
			});
			
			if (channel.guild.me.voice.channel && channel.guild.me.voice.channel.id != channel.id) {
				return message.reply({
					embeds: [new MessageEmbed()
						.setColor(ee.wrongcolor)
						.setFooter(ee.footertext, ee.footericon)
						.setTitle(`${client.allEmojis.x} Entre no __meu__ canal de voz!`)
						.setDescription(`<#${guild.me.voice.channel.id}>`)
					]
				});
			}
			
			try {
				let newQueue = client.distube.getQueue(guildId);
				
				if (!newQueue || !newQueue.songs || newQueue.songs.length == 0) return message.reply({
					embeds: [
						new MessageEmbed().setColor(ee.wrongcolor).setTitle(`${client.allEmojis.x} **Eu não estou tocando nada agora!**`)
					]
				});
				
				const currentFilters = getCurrentFilters(newQueue);
				let newTrack = newQueue.songs[0];
				
				message.reply({
					embeds: [
						new MessageEmbed()
						.setColor(ee.color)
						.setTitle(newTrack.name)
						.setURL(newTrack.url)
						.addField(`💡 Requerido por:`, `>>> ${newTrack.user}`, true)
						.addField(`⏱️ Duração:`, `>>> \`${newQueue.formattedCurrentTime} / ${newTrack.formattedDuration}\``, true)
						.addField(`🌐 Fila:`, `>>> \`${newQueue.songs.length} Música(s)\`\n\`${newQueue.formattedDuration}\``, true)
						.addField(`🔊 Volume:`, `>>> \`${newQueue.volume} %\``, true)
						.addField(`♾️ Loop:`, `>>> ${newQueue.repeatMode ? newQueue.repeatMode === 2 ? `${client.allEmojis.check_mark} \`Fila\`` : `${client.allEmojis.check_mark} \`Música\`` : `${client.allEmojis.x}`}`, true)
						.addField(`▶️ Autoplay:`, `>>> ${newQueue.autoplay ? `${client.allEmojis.check_mark}` : `${client.allEmojis.x}`}`, true)
						.addField(`🎵 Filtro${currentFilters.length > 0 ? "s" : ""}:`, `>>> ${currentFilters.length > 0 ? `${currentFilters.map(f => `\`${f}\``).join(", ")}` : `${client.allEmojis.x}`}`, currentFilters.length > 1 ? false : true)
						.addField(`👀 Visualizações:`, `>>> \`${newTrack.views}\``, true)
						.addField(`👍 Curtidas:`, `>>> \`${newTrack.likes}\``, true)
						.addField(`👎 Descurtidas:`, `>>> \`${newTrack.dislikes}\``, true)
						.setThumbnail(`https://img.youtube.com/vi/${newTrack.id}/mqdefault.jpg`)
						.setFooter(`Tocando em: ${guild.name}`, guild.iconURL({ dynamic: true }))
						.setTimestamp()
					]
				}).catch((e) => {
					console.log(e.stack ? e.stack : e);
				});
			} catch (e) {
				console.log(e.stack ? e.stack : e);
				message.reply({
					content: `${client.allEmojis.x} | Erro: `,
					embeds: [
						new MessageEmbed().setColor(ee.wrongcolor)
						.setDescription(`\`\`\`${e}\`\`\``)
					]
				});
			}
		} catch (e) {
			console.log(String(e.stack).bgRed);
		}
	}
};
