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
	name: "move",

	category: "Fila",
	usage: "move <PosiçãoMúsica> <ParaPosição>",

	description: "Move uma música para outro lugar",
	cooldown: 10,
	requiredroles: [],
	alloweduserids: [],
	run: async (client, message, args) => {
		try {
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
			if (!member) return message.reply({
				flags: 64,
				embeds: [new MessageEmbed()
					.setColor(ee.wrongcolor)
					.setTitle(`${client.allEmojis.x} Este comando só funciona em servidores.`)
				]
			});
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
						new MessageEmbed().setColor(ee.wrongcolor).setTitle(`${client.allEmojis.x} **Eu não estou tocando nada agora!**`)
					],

				})
				if (check_if_dj(client, member, newQueue.songs[0])) {
					return message.reply({
						embeds: [new MessageEmbed()
							.setColor(ee.wrongcolor)
							.setFooter(ee.footertext, ee.footericon)
							.setTitle(`${client.allEmojis.x} **Você não é um DJ e não é o Solicitante da música!**`)
							.setDescription(`**CARGO-DJ:**\n> ${check_if_dj(client, member, newQueue.songs[0])}`)
						],
					});
				}
				if (!args[0]) {
					return message.reply({
						embeds: [new MessageEmbed()
							.setColor(ee.wrongcolor)
							.setFooter(ee.footertext, ee.footericon)
							.setTitle(`${client.allEmojis.x} **Por favor, adicione a posição da musica!**`)
							.setDescription(`**Uso:**\n> \`${client.settings.get(message.guild.id, "prefix")}move <PosiçãoMúsica> <ParaPosição>\``)
						],
					});
				}
				if (!args[1]) {
					return message.reply({
						embeds: [new MessageEmbed()
							.setColor(ee.wrongcolor)
							.setFooter(ee.footertext, ee.footericon)
							.setTitle(`${client.allEmojis.x} **Por favor, informe a posição de destino!**`)
							.setDescription(`**Uso:**\n> \`${client.settings.get(message.guild.id, "prefix")}play <PosiçãoMúsica> <PosiçãoDestino>\``)
						],
					});
				}
				let songIndex = Number(args[0]);
				if (!songIndex) {
					return message.reply({
						embeds: [new MessageEmbed()
							.setColor(ee.wrongcolor)
							.setFooter(ee.footertext, ee.footericon)
							.setTitle(`${client.allEmojis.x} **Adicione uma posição de música [NÚMERO]!**`)
							.setDescription(`**Uso:**\n> \`${client.settings.get(message.guild.id, "prefix")}move <PosiçãoMúsica> <ParaPosição>\``)
						],
					});
				}
				let position = Number(args[1]);
				if (!position) {
					return message.reply({
						embeds: [new MessageEmbed()
							.setColor(ee.wrongcolor)
							.setFooter(ee.footertext, ee.footericon)
							.setTitle(`${client.allEmojis.x} **Adicione um NÚMERO de posição para mover!**`)
							.setDescription(`**Uso:**\n> \`${client.settings.get(message.guild.id, "prefix")}play <PosiçãoMúsica> <ParaPosição>\``)
						],
					});
				}
				if (position >= newQueue.songs.length || position < 0) position = -1;
				if (songIndex > newQueue.songs.length - 1) return message.reply({
					embeds: [
						new MessageEmbed().setColor(ee.wrongcolor).setTitle(`${client.allEmojis.x} **Esta música não existe!**`)
						.setDescription(`**A última música da fila tem o índice: \`${newQueue.songs.length}\`**`)
					],

				})
				if (position == 0) return message.reply({
					embeds: [
						new MessageEmbed().setColor(ee.wrongcolor).setTitle(`${client.allEmojis.x} **Não é possível mover a música antes de tocá-la!**`)
					],

				})
				let song = newQueue.songs[songIndex];
				await newQueue.move(songIndex, position);
				message.reply({
					embeds: [new MessageEmbed()
					  .setColor(ee.color)
					  .setTimestamp()
					  .setTitle(`📖 Movido **${song.name}** para a **\`${position}ª\`** posição logo após **_${newQueue.songs[position - 1].name}_!**`)
					  .setFooter(`Ação por: ${member.user.tag}`, member.user.displayAvatarURL({dynamic: true}))]
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
