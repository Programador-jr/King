const { MessageEmbed, PermissionFlagsBits } = require("discord.js");
const ee = require("../../botconfig/embed.json");
const { resolveQuery } = require("../../handlers/musicSearch");

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
				const resolved = await resolveQuery(Text);
				if (resolved?.unsupported === "youtube_music") {
					await newmsg?.edit({
						content: `${client.allEmojis.x} **YouTube Music nao suportado. Tente usar um link do YouTube**`
					}).catch(() => {});
					deleteLater(message);
					deleteLater(newmsg);
					return;
				}
				if (!resolved?.url) {
					await newmsg?.edit({ content: `${client.allEmojis.x} Nao encontrei resultado para: ` + "```" + Text + "```" }).catch(() => {});
					deleteLater(message);
					deleteLater(newmsg);
					return;
				}
				const playWithRetry = async () => {
					let retried = false;
					for (;;) {
						try {
							const existingQueue = client.distube.getQueue(guildId);
							if (existingQueue?.stopped) {
								existingQueue.remove();
							}
							await client.distube.play(channel, resolved.url, {
								member: member,
								textChannel: guild.channels.cache.get(channelId)
							});
							return;
						} catch (err) {
							const code = err?.code || err?.errorCode || "";
							if (!retried && (String(err).includes("QUEUE_STOPPED") || code === "QUEUE_STOPPED")) {
								const existingQueue = client.distube.getQueue(guildId);
								if (existingQueue) existingQueue.remove();
								retried = true;
								continue;
							}
							throw err;
						}
					}
				};
				await playWithRetry();
				newmsg?.edit({ content: "Tocando: ```" + (resolved.title || Text) + "```" }).catch(() => {});
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

