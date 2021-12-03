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
	name: "loop", //the command name for the Slash Command

	category: "Fila",
	aliases: ["repeat", "repeatmode", "l"],
	usage: "loop <song/queue/off>",

	description: "Ativar/desativar o Song-/ Queue-Loop", //the command description for Slash Command Overview
	cooldown: 5,
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
						.setTitle(`${client.allEmojis.x} Entre no meu Canal de Voz primeiro!`)
						.setDescription(`<#${guild.me.voice.channel.id}>`)
					],
				});
			}
			try {
				let newQueue = client.distube.getQueue(guildId);
				if (!newQueue || !newQueue.songs || newQueue.songs.length == 0) return message.reply({
					embeds: [
						new MessageEmbed().setColor(ee.wrongcolor).setTitle(`${client.allEmojis.x} **Eu não estou tocando nada!**`)
					],

				})
				if (check_if_dj(client, member, newQueue.songs[0])) {
					return message.reply({
						embeds: [new MessageEmbed()
							.setColor(ee.wrongcolor)
							.setFooter(ee.footertext, ee.footericon)
							.setTitle(`${client.allEmojis.x} **Você não é um DJ e não é o Song Requester!**`)
							.setDescription(`**CARGO-DJ:**\n> ${check_if_dj(client, member, newQueue.songs[0])}`)
						],
					});
				}
				if (!args[0]) {
					return message.reply({
						embeds: [new MessageEmbed()
							.setColor(ee.wrongcolor)
							.setFooter(ee.footertext, ee.footericon)
							.setTitle(`${client.allEmojis.x} **Adicione opções válidas!**`)
							.setDescription(`**Use:**\n> \`${client.settings.get(message.guild.id, "prefix")}loop <song/queue/off>\``)
						],
					});
				}
				let loop = String(args[0])
				if (!["off", "song", "queue"].includes(loop.toLowerCase())) {
					return message.reply({
						embeds: [new MessageEmbed()
							.setColor(ee.wrongcolor)
							.setFooter(ee.footertext, ee.footericon)
							.setTitle(`${client.allEmojis.x} **Adicione opções válidas!**`)
							.setDescription(`**Use:**\n> \`${client.settings.get(message.guild.id, "prefix")}loop <song/queue/off>\``)
						],
					});
				}
				if (loop.toLowerCase() == "off") loop = 0;
				else if (loop.toLowerCase() == "song") loop = 1;
				else if (loop.toLowerCase() == "queue") loop = 2;
				await newQueue.setRepeatMode(loop);
				if (newQueue.repeatMode == 0) {
					message.reply({
						embeds: [new MessageEmbed()
						  .setColor(ee.color)
						  .setTimestamp()
						  .setTitle(`${client.allEmojis.x} **Desativou o modo de loop!**`)
						  .setFooter(`Ação por: ${member.user.tag}`, member.user.displayAvatarURL({dynamic: true}))]
					})
				} else if (newQueue.repeatMode == 1) {
					message.reply({
						embeds: [new MessageEmbed()
						  .setColor(ee.color)
						  .setTimestamp()
						  .setTitle(`🔁 **Habilitou o __Loop__- Música** || (Desabilitou o **Loop-Fila**)||`)
						  .setFooter(`Ação por: ${member.user.tag}`, member.user.displayAvatarURL({dynamic: true}))]
						})
				} else {
					message.reply({
						embeds: [new MessageEmbed()
						  .setColor(ee.color)
						  .setTimestamp()
						  .setTitle(`🔂 **Habilitou o __Loop__-Fila! ** || (Desabilitou o ** __Loop-Música__**)||`)
						  .setFooter(`Ação por: ${member.user.tag}`, member.user.displayAvatarURL({dynamic: true}))]
						})
				}
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
