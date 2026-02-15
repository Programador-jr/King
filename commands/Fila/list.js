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
						new MessageEmbed().setColor(ee.wrongcolor).setTitle(`${client.allEmojis.x} **Eu n\u00E3o estou tocando nada agora!**`)
					],

				})
				let embeds = [];
				let k = 10;
				let theSongs = newQueue.songs;
				//defining each Pages
				for (let i = 0; i < theSongs.length; i += 10) {
					let qus = theSongs;
					const current = qus.slice(i, k)
					let j = i + 1;
					const info = current.map((track) => `**${j++} -** [\`${String(track.name).replace(/\[/igu, "{").replace(/\]/igu, "}").substr(0, 60)}\`](${track.url}) - \`${track.formattedDuration}\``).join("\n")
					const embed = new MessageEmbed()
						.setColor(ee.color)
						.setDescription(`${info}`)
					if (i < 10) {
						embed.setTitle(`\u{1F4D1} **Top ${theSongs.length > 50 ? 50 : theSongs.length} | Fila de ${guild.name}**`)
						embed.setDescription(`**(1) M\u00FAsica atual:**\n> [\`${theSongs[0].name.replace(/\[/igu, "{").replace(/\]/igu, "}")}\`](${theSongs[0].url})\n\n${info}`)
					}
					embeds.push(embed);
					k += 10; //Raise k to 10
				}
				embeds[embeds.length - 1] = embeds[embeds.length - 1]
					.setFooter(ee.footertext + `\n${theSongs.length} M\u00FAsicas na fila | Dura\u00E7\u00E3o: ${newQueue.formattedDuration}`, ee.footericon)
				let pages = []
				for (let i = 0; i < embeds.length; i += 2) {
					pages.push(embeds.slice(i, i + 2));
				}
				pages = pages.slice(0, 24)
				const Menu = new MessageSelectMenu()
					.setCustomId("QUEUEPAGES")
					.setPlaceholder("Selecione uma p\u00E1gina")
					.addOptions(
						pages.map((page, index) => {
							let Obj = {};
							Obj.label = `P\u00E1gina ${index + 1}`;
							Obj.value = `${index}`;
							Obj.description = `Mostra a p\u00E1gina ${index + 1}/${pages.length}`;
							return Obj;
						})
					)
				const row = new MessageActionRow().addComponents([Menu])
				const queueMessage = await message.reply({
					embeds: pages[0],
					components: [row],
				});

				const collector = queueMessage.createMessageComponentCollector({
					time: 180000
				});

				collector.on("collect", async (interaction) => {
					if (!interaction.isSelectMenu() || interaction.customId !== "QUEUEPAGES") {
						return interaction.deferUpdate().catch(() => {});
					}

					if (interaction.user.id !== message.author.id) {
						return interaction.reply({
							content: `${client.allEmojis.x} Apenas quem executou o comando pode trocar a p\u00E1gina.`,
							ephemeral: true
						}).catch(() => {});
					}

					const pageIndex = Number(interaction.values?.[0] ?? 0);
					const selectedPage = pages[pageIndex] || pages[0];
					return interaction.update({
						embeds: selectedPage,
						components: [row]
					}).catch(() => {});
				});
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

