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
const FiltersSettings = require("../../botconfig/filters.json");

const getCurrentFilters = (queue) => {
	if (!queue) return [];
	if (Array.isArray(queue.filters?.names)) return queue.filters.names;
	if (queue.filters?.collection) return [...queue.filters.collection.keys()];
	return [];
};
module.exports = {
	name: "removefilter", //the command name for the Slash Command

	category: "Filtro",
	usage: "removefilter <Filtro1 Filtro2>",
	aliases: ["removefilters", "remove", "removef"],

	description: "Remove um filtro da fila", //the command description for Slash Command Overview
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
					new MessageEmbed().setColor(ee.wrongcolor).setTitle(`${client.allEmojis.x} **Por favor junte-se ${guild.me.voice.channel ? "__ao meu__" : "a um"} Canal de voz primeiro!**`)
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
				const currentFilters = getCurrentFilters(newQueue);
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
							.setTitle(`${client.allEmojis.x}**Você não é um DJ e não é Solicitante da musica!**`)
							.setDescription(`**CARGO-DJ:**\n> ${check_if_dj(client, member, newQueue.songs[0])}`)
						],
					});
				}
				if (!args.length) {
					return message.reply({
						embeds: [
							new MessageEmbed()
							.setColor(ee.wrongcolor)
							.setFooter(ee.footertext, ee.footericon)
							.setTitle(`${client.allEmojis.x} **Adicione filtros para remover.**`)
							.addField("**Filtros atuais:**", currentFilters.length ? currentFilters.map(f => `\`${f}\``).join(", ") : "Nenhum")
						],
					})
				}
				let filters = args.map((f) => f.toLowerCase());
				if (filters.some(a => !FiltersSettings[a])) {
					return message.reply({
						embeds: [
							new MessageEmbed()
							.setColor(ee.wrongcolor)
							.setFooter(ee.footertext, ee.footericon)
							.setTitle(`${client.allEmojis.x} **Você adicionou pelo menos um filtro, que é inválido!**`)
							.setDescription("**Para definir vários filtros, adicione um ESPAÇO entre (` `)!**")
							.addField("**All Valid Filters:**", Object.keys(FiltersSettings).map(f => `\`${f}\``).join(", ") + "\n\n**Nota:**\n> *Todos os filtros, começando com o personalizado, têm seu próprio Comando, use-os para definir o valor personalizado que você deseja!*")
						],
					})
				}
				let toRemove = [];
				//add new filters    bassboost, clear    --> [clear] -> [bassboost]   
				filters.forEach((f) => {
					if (currentFilters.includes(f)) {
						toRemove.push(f)
					}
				})
				if (!toRemove || toRemove.length == 0) {
					return message.reply({
						embeds: [
							new MessageEmbed()
							.setColor(ee.wrongcolor)
							.setFooter(ee.footertext, ee.footericon)
							.setTitle(`${client.allEmojis.x} **Você não adicionou um Filtro, que está nos Filtros.**`)
							.addField("**Todos os Filtros __Disponiveis__:**", currentFilters.map(f => `\`${f}\``).join(", "))
						],
					})
				}
				await newQueue.filters.remove(toRemove);
				message.reply({
					embeds: [new MessageEmbed()
					  .setColor(ee.color)
					  .setTimestamp()
					  .setTitle(`♨**Removido ${toRemove.length} ${toRemove.length == filters.length ? "Filtros": `de ${filters.length} Filtros! O resto ainda não fazia parte dos filtros!`}**`)
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

