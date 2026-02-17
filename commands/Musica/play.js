const { MessageEmbed, PermissionFlagsBits } = require("discord.js");
const ee = require("../../botconfig/embed.json");
const { Song } = require("distube");
const { resolveQuery, findFallbackTrack, getDirectSoundCloudStreamUrl, isSoundCloudUrl } = require("../../handlers/musicSearch");

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

const createDirectSoundCloudSong = (track, streamUrl, member, fallbackName) => {
	const originalUrl = String(track?.url || "").trim();
	const seed = (originalUrl || `${Date.now()}`).replace(/[^\w]/g, "").slice(0, 24) || `${Date.now()}`;
	const song = new Song(
		{
			plugin: null,
			source: "soundcloud",
			playFromSource: true,
			id: `scdirect${seed}`,
			name: track?.title || fallbackName || "SoundCloud",
			url: originalUrl || streamUrl,
			duration: Number(track?.duration || 0),
			isLive: false,
			thumbnail: track?.thumbnail,
			uploader: { name: track?.author || undefined, url: undefined },
			ageRestricted: false
		},
		{ member }
	);
	song.stream.url = streamUrl;
	return song;
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
					if (resolved?.unsupported) {
					await newmsg?.edit({
						content: `${client.allEmojis.x} **${resolved.message || "Fonte nao suportada."}**`
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
					let selected = { ...resolved };
					const playWithRetry = async () => {
						let retried = false;
						let retriedNoResult = false;
						let retriedSoundCloudRateLimit = false;
						for (;;) {
							try {
								const existingQueue = client.distube.getQueue(guildId);
								if (existingQueue?.stopped) {
									existingQueue.remove();
								}
								let playInput = selected.url;
								if (isSoundCloudUrl(selected.url)) {
									if (!selected.streamUrl) {
										const directStreamUrl = await getDirectSoundCloudStreamUrl(selected.url);
										if (directStreamUrl) {
											selected = { ...selected, streamUrl: directStreamUrl };
										}
									}
									if (selected.streamUrl) {
										playInput = createDirectSoundCloudSong(selected, selected.streamUrl, member, Text);
									}
								}
								await client.distube.play(channel, playInput, {
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
								if (!retriedNoResult && (String(err).includes("NO_RESULT") || code === "NO_RESULT")) {
									try {
										const fallback = await findFallbackTrack(Text);
										if (fallback?.url) {
											selected = {
												url: fallback.url,
												title: fallback.title || selected.title || Text,
												author: fallback.author || selected.author || ""
											};
											retriedNoResult = true;
											continue;
										}
									} catch (_) {
										// ignore fallback errors and throw original one below
									}
								}
								if (
									!retriedSoundCloudRateLimit &&
									(String(err).includes("SOUNDCLOUD_PLUGIN_RATE_LIMITED") || code === "SOUNDCLOUD_PLUGIN_RATE_LIMITED")
								) {
									try {
										const existingQueue = client.distube.getQueue(guildId);
										if (existingQueue) existingQueue.remove();
										const directStreamUrl = await getDirectSoundCloudStreamUrl(selected.url);
										if (directStreamUrl) {
											selected = {
												...selected,
												streamUrl: directStreamUrl
											};
											retriedSoundCloudRateLimit = true;
											continue;
										}
									} catch (_) {
										// ignore stream fallback errors and throw original one below
									}
								}
								throw err;
							}
						}
					};
					await playWithRetry();
					newmsg?.edit({ content: "Tocando: ```" + (selected.title || Text) + "```" }).catch(() => {});
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

