const { MessageEmbed, PermissionFlagsBits } = require("discord.js");
const ee = require("../../botconfig/embed.json");

const ERROR_DELETE_MS = 4000;
const deleteLater = (msg) => {
	if (!msg) return;
	setTimeout(() => msg.delete().catch(() => {}), ERROR_DELETE_MS);
};
const replyError = async (message, payload) => {
	const sent = await message.reply(payload).catch(() => null);
	deleteLater(message);
	deleteLater(sent);
	return sent;
};

module.exports = {
	name: "play",
	category: "Musica",
	aliases: ["p", "pley", "tocar"],
	usage: "play <Search/link>",
	description: "Toca uma musica / lista de reproducao em seu canal de voz",
	cooldown: 2,
	requiredroles: [],
	alloweduserids: [],
		run: async (client, message, args) => {
			try {
				const { member, channelId, guildId } = message;
			const { guild } = member;
			const { channel } = member.voice;
			if (!channel) {
				return replyError(message, {
					embeds: [
						new MessageEmbed()
							.setColor(ee.wrongcolor)
							.setTitle(`${client.allEmojis.x} **Por favor entre em ${guild.me.voice.channel ? "__meu__" : "um"} canal de voz primeiro!**`)
					],
				});
			}

			const me = guild.members.me ?? guild.members.cache.get(client.user.id);
			const perms = channel.permissionsFor(me);
			if (!perms?.has(PermissionFlagsBits.Connect) || !perms?.has(PermissionFlagsBits.Speak)) {
				return replyError(message, {
					embeds: [
						new MessageEmbed()
							.setColor(ee.wrongcolor)
							.setTitle(`${client.allEmojis.x} **Sem permissao para entrar/falar nesse canal.**`)
					],
				});
			}

			if (channel.userLimit != 0 && channel.full) {
				return replyError(message, {
					embeds: [
						new MessageEmbed()
							.setColor(ee.wrongcolor)
							.setFooter(ee.footertext, ee.footericon)
							.setTitle(`Seu canal de voz esta cheio, nao consigo entrar!`)
					],
				});
			}
			if (channel.guild.me.voice.channel && channel.guild.me.voice.channel.id != channel.id) {
				return replyError(message, {
					embeds: [
						new MessageEmbed()
							.setColor(ee.wrongcolor)
							.setFooter(ee.footertext, ee.footericon)
							.setTitle(`Ja estou conectado em outro lugar`)
					],
				});
			}
			if (!args[0]) {
				return replyError(message, {
					embeds: [
						new MessageEmbed()
							.setColor(ee.wrongcolor)
							.setFooter(ee.footertext, ee.footericon)
							.setTitle(`${client.allEmojis.x} **Por favor adicione uma consulta de pesquisa!**`)
					],
				});
			}

			const Text = args.join(" ");
			let newmsg = await message.reply({
				content: "Procurando... ```" + Text + "```"
			}).catch(() => null);

			try {
				await client.lavalink.play(channel, Text, {
					member: member,
					textChannel: guild.channels.cache.get(channelId)
				});
				
				newmsg?.edit({ content: "Tocando: ```" + Text + "```" }).catch(() => {});
			} catch (e) {
				console.log(e.stack ? e.stack : e);
				return replyError(message, {
					content: `${client.allEmojis.x} | Erro:`,
					embeds: [new MessageEmbed().setColor(ee.wrongcolor).setDescription("```" + e + "```")]
				});
			}
		} catch (e) {
			console.log(String(e.stack).bgRed);
		}
	}
};

