const {
	MessageEmbed,
	Message
} = require("discord.js");
const config = require("../../botconfig/config.json");
const ee = require("../../botconfig/embed.json");
const settings = require("../../botconfig/settings.json");
const FiltersSettings = require("../../botconfig/filters.json");
const {
	check_if_dj
} = require("../../handlers/functions")

module.exports = {
	name: "addfilter", //the command name for the Slash Command
	category: "Filtro",
	usage: "addfilter <Filtro1 Filtro2>",
	aliases: ["addfilters", "add", "addf", "addfiltro"],

	description: "Adicione um filtro aos filtros", //the command description for Slash Command Overview
	cooldown: 5,
	requiredroles: [], //Only allow specific Users with a Role to execute a Command [OPTIONAL]
	alloweduserids: [], //Only allow specific Users to execute a Command [OPTIONAL]
	run: async (client, message, args) => {
		try {
			const {
				member,
				guildId,
				guild
			} = message;
			const {
				channel
			} = member.voice;
			if (!channel) return message.reply({
				embeds: [
					new MessageEmbed().setColor(ee.wrongcolor).setTitle(`${client.allEmojis.x} **Junte-se ${guild.me.voice.channel? "__ao meu__": "a um"} canal de voz primeiro!**`)
				],
			})
			if (channel.guild.me.voice.channel && channel.guild.me.voice.channel.id != channel.id) {
				return message.reply({
					embeds: [new MessageEmbed()
						.setColor(ee.wrongcolor)
						.setFooter(ee.footertext, ee.footericon)
						.setTitle(`${client.allEmojis.x} Junte-se ao __meu__ canal de voz!`)
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
							.setTitle(`${client.allEmojis.x}**Você não é um DJ e a música não foi requisitada por você!**`)
							.setDescription(`**CARGOS-DJ:**\n> ${check_if_dj(client, member, newQueue.songs[0])}`)
						],
					});
				}
				let filters = args;
				if (filters.some(a => !FiltersSettings[a])) {
					return message.reply({
						embeds: [
							new MessageEmbed()
							.setColor(ee.wrongcolor)
							.setFooter(ee.footertext, ee.footericon)
							.setTitle(`${client.allEmojis.x} **Você adicionou pelo menos um filtro, que é inválido!**`)
							.setDescription("**Para definir vários filtros, adicione um ESPAÇO (` `) entre! ** ") .addField ("** Todos os filtros válidos:**", Object.keys(FiltersSettings).map(f => `\`${f}\``).join(", ") + "\n\n**Nota:**\n> *Todos os filtros, começando com o personalizado, têm seu próprio Comando, use-os para definir o valor personalizado que você deseja!*")
						],
					})
				}
				let toAdded = [];
				//add new filters
				filters.forEach((f) => {
					if (!newQueue.filters.includes(f)) {
						toAdded.push(f)
					}
				})
				if (!toAdded || toAdded.length == 0) {
					return message.reply({
						embeds: [
							new MessageEmbed()
							.setColor(ee.wrongcolor)
							.setFooter(ee.footertext, ee.footericon)
							.setTitle(`${client.allEmojis.x} **Você não adicionou um Filtro, que ainda não está nos Filtros.**`)
							.addField("**Todos os __Filtros__ Atuais**", newQueue.filters.map(f => `\`${f}\``).join(", "))
						],
					})
				}
				await newQueue.setFilter(toAdded);
				message.reply({
					embeds: [new MessageEmbed()
					  .setColor(ee.color)
					  .setTimestamp()
					  .setTitle(`♨️ **Adicionado ${toAdded.length} ${toAdded.length == filters.length ? "Filtros": `de ${filters.length} Filtros! O Resto já fazia parte dos Filtros!`}**`)
					  .setFooter(`Ação por: ${member.user.tag}`, member.user.displayAvatarURL({dynamic: true}))]
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