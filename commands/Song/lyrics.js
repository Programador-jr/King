const {
	MessageEmbed,
	Message
} = require("discord.js");
const {
    KSoftClient
} = require('@ksoft/api');
const config = require(`../../botconfig/config.json`);
const ksoft = new KSoftClient(config.ksoftapi);
const ee = require("../../botconfig/embed.json");
const settings = require("../../botconfig/settings.json");
const {
	lyricsEmbed,
	check_if_dj
} = require("../../handlers/functions");
module.exports = {
	name: "lyrics", //the command name for the Slash Command
	category: "Song",
	usage: "lyrics",
	aliases: ["ly", "songtext", "letra"],
	description: "Envia a letra da música", //the command description for Slash Command Overview
	cooldown: 25,
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
					new MessageEmbed().setColor(ee.wrongcolor).setTitle(`${client.allEmojis.x} **Junte-se ${guild.me.voice.channel ? "__ao meu__" : "a um"} Canal de voz primeiro!**`)
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
				return message.reply({
					embeds: [new MessageEmbed()
						.setColor(ee.wrongcolor)
						.setFooter(ee.footertext, ee.footericon)
						.setTitle(`${client.allEmojis.x} As letras estão desabilitadas!`)
						.setDescription(`**Devido a motivos legais, as letras estão desativadas e não funcionarão por um período de tempo indeterminado!** :cry:`)
					],
				});
				let embeds = [];
				await ksoft.lyrics.get(newQueue.songs[0].name).then(
					async track => {
						if (!track.lyrics) return message.reply({
							content: `${client.allEmojis.x} **Nenhuma letra encontrada!** :cry:`,
						});
						lyrics = track.lyrics;
						embeds = lyricsEmbed(lyrics, newQueue.songs[0]);
					}).catch(e => {
					console.log(e)
					return message.reply({
						content: `${client.allEmojis.x} **Nenhuma letra encontrada!** :cry:\n${String(e).substr(0, 1800)}`,
					});
				})
				message.reply({
					embeds: embeds,
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