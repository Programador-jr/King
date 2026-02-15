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
	name: "remove", //the command name for the Slash Command

	category: "Fila",
	aliases: ["delete", "del", "rem"],
	usage: "remove <What_song> [Amount]",

	description: "Remove uma(s) + mÃºsica(s)", //the command description for Slash Command Overview
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
					new MessageEmbed().setColor(ee.wrongcolor).setTitle(`${client.allEmojis.x} **Por favor Junte-se ${guild.me.voice.channel ? "__ao meu__" : "a um"} Canal de Voz Primeiro!**`)
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
							.setTitle(`${client.allEmojis.x} **Por favor, adicione a posiÃ§Ã£o da mÃºsica!**`)
							.setDescription(`**Uso:**\n> \`${client.settings.get(message.guild.id, "prefix")}remove <posiÃ§Ã£o-da-mÃºsica> [quantidade]\``)
						],
					});
				}
				let songIndex = Number(args[0]);
				if (!songIndex) {
					return message.reply({
						embeds: [new MessageEmbed()
							.setColor(ee.wrongcolor)
							.setFooter(ee.footertext, ee.footericon)
							.setTitle(`${client.allEmojis.x} **Adicione a posiÃ§Ã£o da mÃºsica [NUMERO]!**`)
							.setDescription(`**Uso:**\n> \`${client.settings.get(message.guild.id, "prefix")}remove <posiÃ§Ã£o-da-mÃºsica> [quantia]\``)
						],
					});
				}
				let amount = Number(args[1] ? args[1] : "1");
				if (!amount) amount = 1;
				if (songIndex > newQueue.songs.length - 1) return message.reply({
					embeds: [
						new MessageEmbed().setColor(ee.wrongcolor).setTitle(`${client.allEmojis.x} **Esta mÃºsica nÃ£o existe!**`)
						.setDescription(`**A Ãºltima mÃºsica da fila tem o Ã­ndice: \`${newQueue.songs.length}\`**`)
					],

				})
				if (songIndex <= 0) return message.reply({
					embeds: [
						new MessageEmbed().setColor(ee.wrongcolor).setTitle(`${client.allEmojis.x} **VocÃª nÃ£o pode remover a mÃºsica atual (0)!**`)
						.setDescription(`**Use o \`${client.settings.get(guild.id, "prefix")}skip\` (Slash)Command em vez disso!**`)
					],

				})
				if (amount <= 0) return message.reply({
					embeds: [
						new MessageEmbed().setColor(ee.wrongcolor).setTitle(`${client.allEmojis.x} **VocÃª precisa remover pelo menos 1 mÃºsica!**`)
					],

				})
				newQueue.songs.splice(songIndex, amount);
				message.reply({
					embeds: [new MessageEmbed()
					  .setColor(ee.color)
					  .setTimestamp()
					  .setTitle(`ðŸ—‘ **Removida ${amount} MÃºsica ${amount> 1? "s": ""} da fila!**`)
					  .setFooter(`AÃ§Ã£o por: ${member.user.tag}`, member.user.displayAvatarURL({dynamic: true}))]
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
