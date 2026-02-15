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
	name: "move", //the command name for the Slash Command

	category: "Fila",
	usage: "move <QueMÃºsica> <ParaOnde>",

	description: "Move uma mÃºsica para outro lugar", //the command description for Slash Command Overview
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
					new MessageEmbed().setColor(ee.wrongcolor).setTitle(`${client.allEmojis.x} **Por favor Junte-se ${guild.me.voice.channel ? "__ao meu__" : "a um"} Canal de Voz primeiro!**`)
				],

			})
			if (channel.guild.me.voice.channel && channel.guild.me.voice.channel.id != channel.id) {
				return message.reply({
					embeds: [new MessageEmbed()
						.setColor(ee.wrongcolor)
						.setFooter(ee.footertext, ee.footericon)
						.setTitle(`${client.allEmojis.x} Entre no meu Canal de Voz!`)
						.setDescription(`<#${guild.me.voice.channel.id}>`)
					],
				});
			}
			try {
				let newQueue = client.distube.getQueue(guildId);
				if (!newQueue || !newQueue.songs || newQueue.songs.length == 0) return message.reply({
					embeds: [
						new MessageEmbed().setColor(ee.wrongcolor).setTitle(`${client.allEmojis.x} **Eu nÃ£o estou tocando nada agora!**`)
					],

				})
				if (check_if_dj(client, member, newQueue.songs[0])) {
					return message.reply({
						embeds: [new MessageEmbed()
							.setColor(ee.wrongcolor)
							.setFooter(ee.footertext, ee.footericon)
							.setTitle(`${client.allEmojis.x} **VocÃª nÃ£o Ã© um DJ e nÃ£o Ã© o Solicitante da musica!**`)
							.setDescription(`**CARGO-DJ:**\n> ${check_if_dj(client, member, newQueue.songs[0])}`)
						],
					});
				}
				if (!args[0]) {
					return message.reply({
						embeds: [new MessageEmbed()
							.setColor(ee.wrongcolor)
							.setFooter(ee.footertext, ee.footericon)
							.setTitle(`${client.allEmojis.x} **Por favor, adicione a posicao da musica!**`)
							.setDescription(`**Uso:**\n> \`${client.settings.get(message.guild.id, "prefix")}move <PisiÃ§Ã£oMÃºsica> <ParaPisiÃ§Ã£o>\``)
						],
					});
				}
				if (!args[1]) {
					return message.reply({
						embeds: [new MessageEmbed()
							.setColor(ee.wrongcolor)
							.setFooter(ee.footertext, ee.footericon)
							.setTitle(`${client.allEmojis.x} **Por favor, informe a posicao de destino!**`)
							.setDescription(`**Uso:**\n> \`${client.settings.get(message.guild.id, "prefix")}play <PosicaoMusica> <PosicaoDestino>\``)
						],
					});
				}
				let songIndex = Number(args[0]);
				if (!songIndex) {
					return message.reply({
						embeds: [new MessageEmbed()
							.setColor(ee.wrongcolor)
							.setFooter(ee.footertext, ee.footericon)
							.setTitle(`${client.allEmojis.x} **Adicione uma posiÃ§Ã£o de mÃºsica [NUMERO]!**`)
							.setDescription(`**Uso:**\n> \`${client.settings.get(message.guild.id, "prefix")}move <PosiÃ§Ã£oMÃºsica> <ParaPosiÃ§Ã£o>\``)
						],
					});
				}
				let position = Number(args[1]);
				if (!position) {
					return message.reply({
						embeds: [new MessageEmbed()
							.setColor(ee.wrongcolor)
							.setFooter(ee.footertext, ee.footericon)
							.setTitle(`${client.allEmojis.x} **Adicione um NÃšMERO de posiÃ§Ã£o para mover!**`)
							.setDescription(`**Uso:**\n> \`${client.settings.get(message.guild.id, "prefix")}play <PosiÃ§Ã£oMÃºsica> <ParaPosiÃ§Ã£o\``)
						],
					});
				}
				if (position >= newQueue.songs.length || position < 0) position = -1;
				if (songIndex > newQueue.songs.length - 1) return message.reply({
					embeds: [
						new MessageEmbed().setColor(ee.wrongcolor).setTitle(`${client.allEmojis.x} **Esta mÃºsica nÃ£o existe!**`)
						.setDescription(`**Ta Ãºltima mÃºsica da fila tem o Ã­ndice: \`${newQueue.songs.length}\`**`)
					],

				})
				if (position == 0) return message.reply({
					embeds: [
						new MessageEmbed().setColor(ee.wrongcolor).setTitle(`${client.allEmojis.x} **NÃ£o Ã© possÃ­vel mover a mÃºsica antes de tocÃ¡-la!**`)
					],

				})
				let song = newQueue.songs[songIndex];
				//remove the song
				newQueue.songs.splice(songIndex);
				//Add it to a specific Position
				newQueue.addToQueue(song, position)
				message.reply({
					embeds: [new MessageEmbed()
					  .setColor(ee.color)
					  .setTimestamp()
					  .setTitle(`ðŸ“‘ Movido ** ${song.name} ** para a** \`${position}Âª\` ** lugar logo apÃ³s **_${newQueue.songs[position - 1].name}_!**`)
					  .setFooter(`: ${member.user.tag}`, member.user.displayAvatarURL({dynamic: true}))]
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
