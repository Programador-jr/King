const { MessageEmbed, PermissionFlagsBits } = require("discord.js");
const ee = require("../../botconfig/embed.json");
const { spawn } = require("child_process");
const path = require("path");

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

// Funcao para reproduzir com retry em caso de erro de sessao de voz
const playWithRetry = async (client, channel, query, options, maxRetries = 3) => {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            await client.lavalink.play(channel, query, options);
            return; // Sucesso, sair do retry
        } catch (playError) {
            // Verificar se e' o erro específico de sessao de voz
            if (playError.message &&
                playError.message.includes("Conectei ao canal de voz, mas o Discord nao enviou a sessao de voz completa")) {

                if (attempt < maxRetries - 1) {
                    // Tentativa falhou, mas podemos tentar novamente
                    console.log(`[Voice Session Retry] Tentativa ${attempt + 1} falhou. Aguardando antes de tentar novamente...`);
                    await new Promise(resolve => setTimeout(resolve, 2000)); // Esperar 2 segundos
                    continue; // Tentar novamente
                }
            }
            // Se nao for o erro de sessao de voz ou se esgotamos as tentativas, propagar o erro
            throw playError;
        }
    }
    // Se chegamos aqui, todas as tentativas falharam
    throw new Error("Falha ao estabelecer sessao de voz apos varias tentativas");
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
            const member = message.member;
            if (!member) {
                return message.reply({
                    flags: 64,
                    embeds: [new MessageEmbed()
                        .setColor(ee.wrongcolor)
                        .setTitle(client.allEmojis.x + " Este comando só funciona em servidores.")
                    ]
                });
            }
            const guild = member.guild;
            const channel = member.voice.channel;
            if (!channel) {
                return replyError(message, {
                    embeds: [
                        new MessageEmbed()
                            .setColor(ee.wrongcolor)
                            .setTitle(client.allEmojis.x + " **Por favor entre em um canal de voz primeiro!**")
                    ]
                });
            }
            const me = guild.members.me || guild.members.cache.get(client.user.id);
            const perms = channel.permissionsFor(me);
            if (!perms || !perms.has(PermissionFlagsBits.Connect) || !perms.has(PermissionFlagsBits.Speak)) {
                return replyError(message, {
                    embeds: [
                        new MessageEmbed()
                            .setColor(ee.wrongcolor)
                            .setTitle(client.allEmojis.x + " **Sem permissao para entrar/falar nesse canal.**")
                    ]
                });
            }

            if (channel.userLimit !== 0 && channel.full) {
                return replyError(message, {
                    embeds: [
                        new MessageEmbed()
                            .setColor(ee.wrongcolor)
                            .setFooter(ee.footertext, ee.footericon)
                            .setTitle("Seu canal de voz esta cheio, nao consigo entrar!")
                    ]
                });
            }
            if (guild.me.voice.channel && guild.me.voice.channel.id !== channel.id) {
                return replyError(message, {
                    embeds: [
                        new MessageEmbed()
                            .setColor(ee.wrongcolor)
                            .setFooter(ee.footertext, ee.footericon)
                            .setTitle("Ja estou conectado em outro lugar")
                    ]
                });
            }
            if (!args[0] || args.join(" ").trim() === "") {
                return replyError(message, {
                    embeds: [
                        new MessageEmbed()
                            .setColor(ee.wrongcolor)
                            .setFooter(ee.footertext, ee.footericon)
                            .setTitle(client.allEmojis.x + " **Por favor adicione uma consulta de pesquisa valida!**")
                    ]
                });
            }

            const Text = args.join(" ").trim();
            let newmsg = await message.reply({
                content: "Procurando... ```" + Text + "```"
            }).catch(() => null);

            try {
                // DETECTAR SE É CONSULTA DO YOUTUBE
                const isYouTubeQuery =
                    Text.match(/(youtube\.com|youtu.be)/i) ||
                    !Text.match(/^(https?:\/\/)?(soundcloud|bandcamp|twitch|vimeo|nico)\.|^(soundcloud|bandcamp|twitch|vimeo|nico):/i) &&
                    (Text.match(/music\s|audio\s/i) || !Text.startsWith('http'));

                if (isYouTubeQuery) {
                    // USAR YT-DLP DIRETO PARA YOUTUBE
                    try {
                        // Obter caminho do yt-dlp
                        let ytDlpPath = "yt-dlp"; // Assume it's in PATH
                        try {
                            // Tentar obter o caminho do pacote @distube/yt-dlp se estiver instalado localmente
                            const distubeYtDlpPath = require.resolve("@distube/yt-dlp");
                            // O executável yt-dlp está em node_modules/.bin/ quando instalado via npm
                            ytDlpPath = path.join(
                                path.dirname(distubeYtDlpPath),
                                "..",
                                "..",
                                ".bin",
                                `yt-dlp${process.platform === "win32" ? ".exe" : ""}`
                            );
                        } catch (e) {
                            // Se nao conseguir resolver o caminho, manter o padrao "yt-dlp" (assumir que esta no PATH)
                        }

                        // Executar yt-dlp para obter informacoes em formato JSON
                        const info = await new Promise((resolve, reject) => {
                            const args = [
                                Text,
                                "--no-warnings",
                                "--ignore-config",
                                "--prefer-free-formats",
                                "--skip-download",
                                "--simulate",
                                "--dump-single-json",
                                "--no-playlist"
                            ];

                            const child = spawn(ytDlpPath, args, {
                                windowsHide: true
                            });

                            let stdout = "";
                            let stderr = "";

                            child.stdout.on("data", (chunk) => {
                                stdout += chunk.toString();
                            });

                            child.stderr.on("data", (chunk) => {
                                stderr += chunk.toString();
                            });

                            child.on("error", (err) => {
                                reject(new Error(`Failed to spawn yt-dlp: ${err.message}`));
                            });

                            child.on("close", (code) => {
                                if (code !== 0) {
                                    reject(new Error(`yt-dlp exited with code ${code}: ${stderr || stdout || "Unknown error"}`));
                                    return;
                                }
                                try {
                                    const result = JSON.parse(stdout.trim());
                                    resolve(result);
                                } catch (parseErr) {
                                    reject(new Error(`Failed to parse yt-dlp output as JSON: ${parseErr.message}`));
                                }
                            });
                        });

                        if (!info || !info.id) {
                            throw new Error("Falha ao obter informações do YouTube com yt-dlp");
                        }

                        // Obter URL de stream direto de audio
                        let streamUrl = "";
                        if (info.url) {
                            streamUrl = info.url;
                        } else if (Array.isArray(info.formats)) {
                            // Procurar por formato de audio apenas (sem video)
                            const audioOnlyFormats = info.formats.filter(
                                f => f.url &&
                                     /audio/i.test(f.acodec || "") &&    // Tem codec de audio
                                     !/video/i.test(f.vcodec || "")     // NÃO tem codec de video
                            );
                            if (audioOnlyFormats.length > 0) {
                                // Escolher o formato com maior bitrate
                                const bestAudioFormat = audioOnlyFormats.reduce((best, f) =>
                                    (f.bitrate || 0) > (best.bitrate || 0) ? f : best
                                );
                                streamUrl = bestAudioFormat.url;
                            } else {
                                // Se nao encontrar audio apenas, procurar por qualquer formato com audio
                                const audioFormats = info.formats.filter(
                                    f => f.url &&
                                         /audio/i.test(f.acodec || "")    // Tem codec de audio (pode ter video também)
                                );
                                if (audioFormats.length > 0) {
                                    const bestAudioFormat = audioFormats.reduce((best, f) =>
                                        (f.bitrate || 0) > (best.bitrate || 0) ? f : best
                                    );
                                    streamUrl = bestAudioFormat.url;
                                }
                            }
                        }

                        if (!streamUrl) {
                            throw new Error("Nao foi possivel obter URL de stream de audio do YouTube");
                        }

                        // REPRODUZIR USANDO O URL DIRETO DO YT-DLP (como fonte HTTP no Lavalink)
                        // PASSAR COMO OBJETO COM source: "http" PARA GARANTIR QUE O LAVALINK TRATE COMO FONTE HTTP DIRETA
                        await playWithRetry(client, channel, { query: streamUrl, source: "http" }, {
                            member: member,
                            textChannel: guild.channels.cache.get(message.channelId)
                        });
                    } catch (ytDlpError) {
                        console.error("[YouTube yt-dlp Error]", ytDlpError);
                        // Como ultimo recurso, tentar o Lavalink native com retry
                        await playWithRetry(client, channel, Text, {
                            member: member
                        });
                    }
                } else {
                    // USAR LAVALINK NATIVE PARA TODAS AS OUTRAS FONTES COM RETRY
                    await playWithRetry(client, channel, Text, {
                        member: member
                    });
                }

                if (newmsg) {
                    newmsg.edit({ content: "Tocando: ```" + Text + "```" }).catch(() => {});
                }
            } catch (e) {
                console.log(e.stack ? e.stack : e);
                return replyError(message, {
                    content: client.allEmojis.x + " | Erro:",
                    embeds: [new MessageEmbed()
                        .setColor(ee.wrongcolor)
                        .setDescription("```" + e + "```")]
                });
            }
        } catch (e) {
            console.log(String(e.stack).bgRed);
        }
    }
};