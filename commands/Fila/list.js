const {
	MessageEmbed,
	MessageSelectMenu,
	MessageActionRow
} = require("discord.js");
const config = require("../../botconfig/config.json");
const ee = require("../../botconfig/embed.json");
const settings = require("../../botconfig/settings.json");
const {
	check_if_dj
} = require("../../handlers/functions")
module.exports = {
	name: "list", //the command name for the Slash Command

	category: "Fila",
	aliases: ["list", "queue", "queuelist"],
	usage: "list",

	description: "Lista a fila atual", //the command description for Slash Command Overview
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
						new MessageEmbed().setColor(ee.wrongcolor).setTitle(`${client.allEmojis.x} **Eu não estou tocando nada agora!**`)
					],

				})
				let embeds = [];
				let k = 10;
				let theSongs = newQueue.songs;
				//defining each Pages
				for (let i = 0; i < theSongs.length; i += 10) {
					let qus = theSongs;
					const current = qus.slice(i, k)
					let j = i;
					const info = current.map((track) => `**${j++} -** [\`${String(track.name).replace(/\[/igu, "{").replace(/\]/igu, "}").substr(0, 60)}\`](${track.url}) - \`${track.formattedDuration}\``).join("\n")
					const embed = new MessageEmbed()
						.setColor(ee.color)
						.setDescription(`${info}`)
					if (i < 10) {
						embed.setTitle(`📑 **Top ${theSongs.length > 50 ? 50 : theSongs.length} | Fila de ${guild.name}**`)
						embed.setDescription(`**(0) Música atual:**\n> [\`${theSongs[0].name.replace(/\[/igu, "{").replace(/\]/igu, "}")}\`](${theSongs[0].url})\n\n${info}`)
					}
					embeds.push(embed);
					k += 10; //Raise k to 10
				}
				embeds[embeds.length - 1] = embeds[embeds.length - 1]
					.setFooter(ee.footertext + `\n${theSongs.length} Músicas na fila | Duração: ${newQueue.formattedDuration}`, ee.footericon)
				let pages = []
				for (let i = 0; i < embeds.length; i += 3) {
					pages.push(embeds.slice(i, i + 3));
				}
				pages = pages.slice(0, 24)
				const Menu = new MessageSelectMenu()
					.setCustomId("QUEUEPAGES")
					.setPlaceholder("Selecione uma página")
					.addOptions([
						pages.map((page, index) => {
							let Obj = {};
							Obj.label = `Página ${index}`
							Obj.value = `${index}`;
							Obj.description = `Mostra o ${index}/${pages.length - 1} Página!`
							return Obj;
						})
					])
				const row = new MessageActionRow().addComponents([Menu])
				message.reply({
					embeds: [embeds[0]],
					components: [row],
				});
				//Event
				client.on('interactionCreate', (i) => {
					if (!i.isSelectMenu()) return;
					if (i.customId === "QUEUEPAGES" && i.applicationId == client.user.id) {
						i.reply({
							embeds: pages[Number(i.values[0])],
						}).catch(e => {})
					}
				});
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