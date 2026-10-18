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
                // O Lavalink resolve a faixa e mantém a extração de áudio no mesmo serviço.
                // URLs de stream temporárias podem expirar antes de a fila terminar.
                await playWithRetry(client, channel, Text, {
                    member,
                    textChannel: guild.channels.cache.get(message.channelId)
                });

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