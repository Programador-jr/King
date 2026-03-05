console.log(`Bem-vindo ao MANIPULADOR LAVALINK`.yellow);
const PlayerMap = new Map();
const getPlayerMapKey = (queueId) => `currentmsg_${queueId}`;
const Discord = require(`discord.js`);
const ee = require(`../botconfig/embed.json`);
const {
  MessageButton,
  MessageActionRow,
  MessageEmbed,
  AttachmentBuilder
} = require(`discord.js`);
const {
  check_if_dj
} = require("./functions");
const { getSongSearchData, getLyricsWithFallback } = require("./lyricsService");
const { addSongPlayed, addMusicTime, addCommandUsed, addUserJoined } = require("../databases/mongodb");
const { getDashboardBaseUrl, getDashboardPort } = require("./dashboardConfig");
let songEditInterval = null;

const MAX_EMBED_LYRICS = 3900;
const dashboardBaseUrl = getDashboardBaseUrl() || `http://127.0.0.1:${getDashboardPort()}`;

const safeSlug = (value) =>
  String(value || "lyrics")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "lyrics";

const replyAndDelete = async (interaction, payload) => {
  try {
    if (interaction.replied || interaction.deferred) {
      const msg = await interaction.followUp(payload);
      setTimeout(() => {
        msg?.delete?.().catch(() => {});
      }, 4000);
    } else {
      const msg = await interaction.reply({ ...payload, fetchReply: true });
      setTimeout(() => {
        msg?.delete?.().catch(() => {});
      }, 4000);
    }
  } catch (e) {
    // ignore
  }
};

const resolveSendableChannel = (target) => {
  if (!target) return null;
  if (typeof target.send === "function") return target;
  if (target.textChannel && typeof target.textChannel.send === "function") return target.textChannel;
  if (target.channel && typeof target.channel.send === "function") return target.channel;
  if (target.message?.channel && typeof target.message.channel.send === "function") return target.message.channel;
  return null;
};

const sendToChannel = async (target, payload, deleteAfterMs = 0) => {
  const channel = resolveSendableChannel(target);
  if (!channel) return null;
  try {
    const sent = await channel.send(payload);
    if (deleteAfterMs > 0 && sent?.delete) {
      setTimeout(() => sent.delete().catch(() => {}), deleteAfterMs);
    }
    return sent;
  } catch (e) {
    console.log(e);
    return null;
  }
};

module.exports = (client) => {
  client.lavalink.on('playSong', async (player, track) => {
    try {
      const guild = client.guilds.cache.get(player.guildId);
      if (!guild) return;
      
      const queue = client.lavalink.getQueue(player.guildId);
      if (!queue || !queue.songs.length) return;
      
      const currentTrack = queue.songs[0];
      
      try {
        guild.me.voice.setDeaf(true).catch((e) => {});
      } catch (e) {}
      
      try {
        const textChannel = client.channels.cache.get(player.textChannelId);
        if (!textChannel) return;
        
        var data = receiveQueueData(queue, currentTrack);
        let currentSongPlayMsg = await textChannel.send(data).then(msg => {
          PlayerMap.set(getPlayerMapKey(player.guildId), msg.id);
          return msg;
        });

        var collector = currentSongPlayMsg.createMessageComponentCollector({
          filter: (i) => i.isButton() && i.user && i.message.author.id == client.user.id,
          time: currentTrack.duration > 0 ? currentTrack.duration * 1000 : 600000
        });

        let lastEdited = false;

        try { clearInterval(songEditInterval) } catch(e) {}
        songEditInterval = setInterval(async () => {
          if (!lastEdited) {
            try {
              var newQueue = client.lavalink.getQueue(player.guildId);
              if (!newQueue || !newQueue.songs.length) {
                clearInterval(songEditInterval);
                return;
              }
              var newTrack = newQueue.songs[0];
              var data = receiveQueueData(newQueue, newTrack);
              await currentSongPlayMsg.edit(data).catch((e) => {});
            } catch (e) {
              clearInterval(songEditInterval);
            }
          }
        }, 10000);

        collector.on('collect', async i => {
          const liveQueue = client.lavalink.getQueue(i.guildId);
          if (!liveQueue || !Array.isArray(liveQueue.songs) || liveQueue.songs.length === 0) {
            return replyAndDelete(i, {
              content: `${client.allEmojis.x} **Nao ha nada tocando agora.**`,
              ephemeral: true
            });
          }
          newQueue = liveQueue;
          if(i.customId != `10` && check_if_dj(client, i.member, newQueue.songs[0])) {
            return replyAndDelete(i, {embeds: [new MessageEmbed()
              .setColor(ee.wrongcolor)
              .setFooter(ee.footertext, ee.footericon)
              .setTitle(`${client.allEmojis.x} **Voce nao e um DJ ou nao e o solicitador da musica!**`)
              .setDescription(`**CARGO-DJ:**\n${check_if_dj(client, i.member, newQueue.songs[0])}`)
            ],
            ephemeral: true});
          }
          lastEdited = true;
          setTimeout(() => { lastEdited = false }, 7000);

          if (i.customId == `1`) {
            let { member } = i;
            const { channel } = member.voice;
            if (!channel) return replyAndDelete(i, { content: `${client.allEmojis.x} **Por favor, junte-se a um canal de voz primeiro!**`, ephemeral: true });
            
            const queue = client.lavalink.getQueue(i.guildId);
            if (!queue || !newQueue.songs || newQueue.songs.length <= 1) {
              return replyAndDelete(i, { content: `${client.allEmojis.x} **Nao ha proxima musica na fila.**`, ephemeral: true });
            }
            
            try {
              await client.lavalink.skip(i.guild.id);
              replyAndDelete(i, { embeds: [new MessageEmbed().setColor(ee.color).setTimestamp().setTitle(`<:next:893930822267195453> **Pulei para a proxima musica!**`).setFooter(`Acao por: ${member.user.tag}`, member.user.displayAvatarURL({dynamic: true}))] });
            } catch (e) {
              throw e;
            }
          }

          if (i.customId == `2`) {
            let { member } = i;
            const { channel } = member.voice;
            if (!channel) return replyAndDelete(i, { content: `${client.allEmojis.x} **Por favor junte-se a um canal de voz primeiro!**`, ephemeral: true });
            
            replyAndDelete(i, { embeds: [new MessageEmbed().setColor(ee.color).setTimestamp().setTitle(`<:stop:893931070410604594> **Parou de tocar e saiu do canal!**`).setFooter(`Acao por: ${member.user.tag}`, member.user.displayAvatarURL({dynamic: true}))] });
            clearInterval(songEditInterval);
            await client.lavalink.stop(i.guild.id);
          }

          if (i.customId == `3`) {
            let { member } = i;
            const { channel } = member.voice;
            if (!channel) return replyAndDelete(i, { content: `${client.allEmojis.x} **Por favor junte-se a um canal de voz primeiro!**`, ephemeral: true });
            
            const queue = client.lavalink.getQueue(i.guildId);
            if (queue.paused) {
              await client.lavalink.resume(i.guild.id);
              replyAndDelete(i, { embeds: [new MessageEmbed().setColor(ee.color).setTimestamp().setTitle(`<:play:893931043571249174> **Despausado!**`).setFooter(`Acao por: ${member.user.tag}`, member.user.displayAvatarURL({dynamic: true}))] });
            } else {
              await client.lavalink.pause(i.guild.id);
              replyAndDelete(i, { embeds: [new MessageEmbed().setColor(ee.color).setTimestamp().setTitle(`<:pause:893930949149097985> **Pausado!**`).setFooter(`Acao por: ${member.user.tag}`, member.user.displayAvatarURL({dynamic: true}))] });
            }
          }

          if (i.customId == `4`) {
            let { member } = i;
            const { channel } = member.voice;
            if (!channel) return replyAndDelete(i, { content: `${client.allEmojis.x} **Por favor junte-se a um canal de voz primeiro!**`, ephemeral: true });
            
            const queue = client.lavalink.getQueue(i.guildId);
            queue.autoplay = !queue.autoplay;
            replyAndDelete(i, { embeds: [new MessageEmbed().setColor(ee.color).setTimestamp().setTitle(`${queue.autoplay ? `${client.allEmojis.check_mark} **Autoplay ativado**`: `${client.allEmojis.x} **Autoplay desativado**`}`).setFooter(`Acao por: ${member.user.tag}`, member.user.displayAvatarURL({dynamic: true}))] });
          }

          if (i.customId == `5`) {
            let { member } = i;
            const { channel } = member.voice;
            if (!channel) return replyAndDelete(i, { content: `${client.allEmojis.x} **Por favor junte-se a um canal de voz primeiro!**`, ephemeral: true });
            
            await client.lavalink.shuffle(i.guild.id);
            replyAndDelete(i, { embeds: [new MessageEmbed().setColor(ee.color).setTimestamp().setTitle(`<:shuffle:893942706269749278> **Aleatorio!**`).setFooter(`Acao por: ${member.user.tag}`, member.user.displayAvatarURL({dynamic: true}))] });
          }

          if (i.customId == `6`) {
            let { member } = i;
            const { channel } = member.voice;
            if (!channel) return replyAndDelete(i, { content: `${client.allEmojis.x} **Por favor junte-se a um canal de voz primeiro!**`, ephemeral: true });
            
            const queue = client.lavalink.getQueue(i.guildId);
            const newMode = queue.repeatMode === 1 ? 0 : 1;
            await client.lavalink.setRepeatMode(i.guild.id, newMode);
            replyAndDelete(i, { embeds: [new MessageEmbed().setColor(ee.color).setTimestamp().setTitle(`${newMode === 1 ? `${client.allEmojis.check_mark} **Loop ativado**`: `${client.allEmojis.x} **Loop desativado**`}`).setFooter(`Acao por: ${member.user.tag}`, member.user.displayAvatarURL({dynamic: true}))] });
          }

          if (i.customId == `7`) {
            let { member } = i;
            const { channel } = member.voice;
            if (!channel) return replyAndDelete(i, { content: `${client.allEmojis.x} **Por favor junte-se a um canal de voz primeiro!**`, ephemeral: true });
            
            const queue = client.lavalink.getQueue(i.guildId);
            const newMode = queue.repeatMode === 2 ? 0 : 2;
            await client.lavalink.setRepeatMode(i.guild.id, newMode);
            replyAndDelete(i, { embeds: [new MessageEmbed().setColor(ee.color).setTimestamp().setTitle(`${newMode === 2 ? `${client.allEmojis.check_mark} **Loop ativado**`: `${client.allEmojis.x} **Loop desativado**`}`).setFooter(`Acao por: ${member.user.tag}`, member.user.displayAvatarURL({dynamic: true}))] });
          }

          if (i.customId == `8`) {
            let { member } = i;
            const { channel } = member.voice;
            if (!channel) return replyAndDelete(i, { content: `${client.allEmojis.x} **Por favor junte-se a um canal de voz primeiro!**`, ephemeral: true });
            
            const queue = client.lavalink.getQueue(i.guildId);
            const newPosition = (queue.currentTime || 0) + 10;
            await client.lavalink.seek(i.guild.id, newPosition);
            replyAndDelete(i, { embeds: [new MessageEmbed().setColor(ee.color).setTimestamp().setTitle(`<:avancar:893930980312760390> **Avancou a musica por 10 Segundos!**`).setFooter(`Acao por: ${member.user.tag}`, member.user.displayAvatarURL({dynamic: true}))] });
          }

          if (i.customId == `9`) {
            let { member } = i;
            const { channel } = member.voice;
            if (!channel) return replyAndDelete(i, { content: `${client.allEmojis.x} **Por favor junte-se a um canal de voz primeiro!**`, ephemeral: true });
            
            const queue = client.lavalink.getQueue(i.guildId);
            const newPosition = Math.max(0, (queue.currentTime || 0) - 10);
            await client.lavalink.seek(i.guild.id, newPosition);
            replyAndDelete(i, { embeds: [new MessageEmbed().setColor(ee.color).setTimestamp().setTitle(`<:voltar:893930880307961886> **Retrocedeu a musica por 10 Segundos!**`).setFooter(`Acao por: ${member.user.tag}`, member.user.displayAvatarURL({dynamic: true}))] });
          }

          if (i.customId == `10`) {
            let { member } = i;
            try {
                if (!i.deferred && !i.replied) {
                    await i.deferReply({ ephemeral: true }).catch(() => {});
                }
                const currentSong = newQueue?.songs?.[0];
                if (!currentSong) {
                    return i.editReply({ content: `${client.allEmojis.x} **Nao achei uma música ativa para buscar letra.**`, embeds: [] }).catch(() => {});
                }

                const query = {
                    title: currentSong.name,
                    artist: ""
                };
                const result = await getLyricsWithFallback(query, { vagalumeApiKey: process.env.VAGALUME_API_KEY || process.env.VAGALUME_KEY || "" });

                if (!result.lyrics) {
                    return i.editReply({ content: `${client.allEmojis.x} **Nao encontrei letra para essa música.**`, embeds: [] }).catch(() => {});
                }

                const sourceLabel = `${result.source}${result.synced ? " (sincronizada)" : ""}`;
                const fullLyrics = [`Fonte: ${sourceLabel}`, `Artista: ${result.artist || query.artist || "desconhecido"}`, `Música: ${result.title || query.title || currentSong.name}`, "", result.lyrics].join("\n");

                const embed = new MessageEmbed()
                    .setColor(ee.color)
                    .setTitle(`Letra - ${result.title || query.title || currentSong.name}`)
                    .setURL(currentSong.url || "https://www.vagalume.com.br/")
                    .setThumbnail(currentSong.thumbnail || ee.footericon)
                    .setFooter(`Musica solicitada por: ${currentSong.user?.tag || member.user.tag}`);

                if (fullLyrics.length <= MAX_EMBED_LYRICS) {
                    embed.setDescription(fullLyrics);
                    return i.editReply({ content: null, embeds: [embed], files: [] }).catch(() => {});
                }

                embed.setDescription(`${[`Fonte: ${sourceLabel}`, `Artista: ${result.artist || query.artist || "desconhecido"}`, `Música: ${result.title || query.title || currentSong.name}`, ""].join("\n")}A letra completa excede o limite de um embed e foi enviada no arquivo abaixo.`);
                const filename = `lyrics-${safeSlug(`${result.artist || query.artist}-${result.title || query.title || currentSong.name}`)}.txt`;
                const file = new AttachmentBuilder(Buffer.from(fullLyrics, "utf8"), { name: filename });
                return i.editReply({ content: null, embeds: [embed], files: [file] }).catch(() => {});
            } catch (e) {
                console.log(e.stack ? String(e.stack).grey : String(e).grey);
                const payload = { content: `${client.allEmojis.x} **Falha ao buscar a letra agora.**`, embeds: [] };
                if (i.deferred || i.replied) return i.editReply(payload).catch(() => {});
                return replyAndDelete(i, { ...payload, ephemeral: true });
            }
          }
        });
      } catch (error) {
        console.error(error);
      }
    } catch (error) {
      console.error(error);
    }
  });

  client.lavalink.on('finishSong', async (player, track) => {
    try {
        const queue = client.lavalink.getQueue(player.guildId);
        if (!queue) return;
        
        const currentSong = track;
        const textChannel = client.channels.cache.get(player.textChannelId);
        if (!textChannel) return;
        
        var embed = new MessageEmbed()
            .setColor(ee.color)
            .setAuthor(`${currentSong.info?.title || "Musica"}`, "https://images-ext-2.discordapp.net/external/Q16BMFNhO29X2_DgKf3tJk2YOsC0jQ0yu6qPyxqwO9w/https/media.discordapp.net/attachments/883978730261860383/883978741892649000/847032838998196234.png", currentSong.info?.uri)
            .setDescription(`Veja a [fila no **DASHBOARD** ao vivo!](${dashboardBaseUrl}/queue/${player.guildId})`)
            .setThumbnail(currentSong.info?.artworkUrl || currentSong.info?.thumbnail || ee.footericon)
            .setFooter(` ${currentSong.info?.requester?.tag || "Desconhecido"}\nA MUSICA ACABOU!`, currentSong.info?.requester?.displayAvatarURL?.({ dynamic: true }) || ee.footericon);
        
        const playerMsgId = PlayerMap.get(getPlayerMapKey(player.guildId));
        if (!playerMsgId) return;
        
        textChannel.messages.fetch(playerMsgId).then(currentSongPlayMsg => {
            if (!currentSongPlayMsg || typeof currentSongPlayMsg.edit !== "function") return;
            currentSongPlayMsg.edit({ embeds: [embed], components: [] }).catch((e) => {});
        }).catch((e) => {});
        
        PlayerMap.delete(getPlayerMapKey(player.guildId));
    } catch (e) {
        console.error(e);
    }
  });

  client.lavalink.on('finish', async (player) => {
    try {
        const textChannel = client.channels.cache.get(player.textChannelId);
        if (!textChannel) return;
        
        textChannel.send({
            embeds: [
                new MessageEmbed()
                    .setColor(ee.color)
                    .setFooter(ee.footertext, ee.footericon)
                    .setTitle("SAINDO DO CANAL")
                    .setDescription("<:queue:893912259535966238> **Nao ha mais musicas restantes**")
                    .setTimestamp()
            ]
        });
        
        await client.lavalink.stop(player.guildId);
    } catch (e) {
        console.error(e);
    }
  });

  client.lavalink.on('empty', async (player) => {
    try {
        const textChannel = client.channels.cache.get(player.textChannelId);
        if (textChannel) {
            sendToChannel(textChannel, `O canal de voz está vazio! Saindo do canal...`);
        }
    } catch (e) {
        console.error(e);
    }
  });

  client.lavalink.on('nodeError', async (node, error) => {
    console.error('[Lavalink Node Error]', error);
  });

  client.lavalink.on('error', async (guildId, error) => {
    console.error('[Lavalink Error]', error);
  });

  function receiveQueueData(newQueue, newTrack) {
    const appliedFilters = Array.isArray(newQueue?.filters?.names)
      ? newQueue.filters.names
      : (newQueue?.filters?.collection ? [...newQueue.filters.collection.keys()] : []);
    var djs = client.settings.get(newQueue.id, `djroles`);
    if(!djs || !Array.isArray(djs)) djs = [];
    else djs = djs.map(r => `<@&${r}>`);
    if(djs.length == 0 ) djs = "`nao configurado`";
    else djs.slice(0, 15).join(", ");
    if(!newTrack) return new MessageEmbed().setColor(ee.wrongcolor).setTitle("NENHUMA MUSICA ENCONTRADA?!?!");
    
    const currentTime = newQueue.currentTime || 0;
    const duration = newTrack.duration || 0;
    const formattedCurrentTime = client.lavalink.formatDuration(currentTime);
    const formattedDuration = newTrack.formattedDuration || client.lavalink.formatDuration(duration);
    
    var embed = new MessageEmbed().setColor(ee.color)
      .setDescription(`Veja a [fila no ** DASHBOARD ** ao vivo!](${dashboardBaseUrl}/queue/${newQueue.id})`)
      .addField(`<:required:893938878380122122> Requerido por:`, `>>> ${newQueue.songs[0]?.user?.tag || "Desconhecido"}`, true)
      .addField(`<:duration:893938822386163723> Duracao:`, `>>> \`${formattedCurrentTime} / ${formattedDuration}\``, true)
      .addField(`<:queue:893912259535966238> Fila:`, `>>> \`${newQueue.songs.length} musica(s)\``, true)
      .addField(`<:volume:893912366905954365> Volume:`, `>>> \`${newQueue.volume || 100} %\``, true)
      .addField(`<:autoplay1:893938933891756073> Loop:`, `>>> ${newQueue.repeatMode ? newQueue.repeatMode === 2 ? `${client.allEmojis.check_mark}\` Fila\`` : `${client.allEmojis.check_mark} \`Musica\`` : `${client.allEmojis.x}`}`, true)
      .addField(`<:autoplay:893912311729897544> Autoplay:`, `>>> ${newQueue.autoplay ? `${client.allEmojis.check_mark}` : `${client.allEmojis.x}`}`, true)
      .addField(`<:download:893912200207548507> Baixar musica:`, `>>> [\`Clique aqui\`](${newTrack.url || newTrack.uri})`, true)
      .addField(
        `<:filter:893938850311835658> Filtro${appliedFilters.length > 0 ? "s": ""}:`,
        `>>> ${appliedFilters.length > 0 ? appliedFilters.map((name) => `\`${name}\``).join(", ") : client.allEmojis.x}`,
        appliedFilters.length > 1 ? false : true
      )
      .addField(`<:dj:893912114203332729> CARGO-DJ:`, `>>> ${djs}`, true)
      .setAuthor(`${newTrack.name}`, `https://images-ext-1.discordapp.net/external/iAtXPtuThJzes9sxragLd-lwLt-oCMNsXYTSqumoenw/https/c.tenor.com/HJvqN2i4Zs4AAAAj/milk-and-mocha-cute.gif`, newTrack.url)
      .setThumbnail(newTrack.thumbnail || ee.footericon)
      .setFooter(` ${newQueue.songs[0]?.user?.tag || "Desconhecido"}`, newQueue.songs[0]?.user?.displayAvatarURL?.({ dynamic: true }) || ee.footericon);
    
    let skip = new MessageButton().setStyle('PRIMARY').setCustomId('1').setEmoji(`<:next:893930822267195453>`).setLabel(`Pular`);
    let stop = new MessageButton().setStyle('DANGER').setCustomId('2').setEmoji(`<:stop:893931070410604594>`).setLabel(`Parar`);
    let pause = new MessageButton().setStyle('PRIMARY').setCustomId('3').setEmoji('<:pause:893930949149097985>').setLabel(`Pausar`);
    let autoplay = new MessageButton().setStyle('PRIMARY').setCustomId('4').setEmoji('<:autoplay2:893968830286692402>').setLabel(`Autoplay`);
    let shuffle = new MessageButton().setStyle('PRIMARY').setCustomId('5').setEmoji('<:shuffle1:893972682633261076>').setLabel(`Aleatorio`);
    
    if (!newQueue.playing || newQueue.paused) {
      pause = pause.setStyle('DANGER').setEmoji('<:play:893931043571249174>').setLabel(`Despausar`);
    }
    if (newQueue.autoplay) {
      autoplay = autoplay.setStyle('SECONDARY');
    }
    
    let queueloop = new MessageButton().setStyle('PRIMARY').setCustomId('7').setEmoji(`<:random:893968760078217236>`).setLabel(`Loop`);
    let forward = new MessageButton().setStyle('PRIMARY').setCustomId('8').setEmoji('<:avancar:893930980312760390>').setLabel(`+10 Seg`);
    let rewind = new MessageButton().setStyle('PRIMARY').setCustomId('9').setEmoji('<:voltar:893930880307961886>').setLabel(`-10 Seg`);
    let lyrics = new MessageButton().setStyle('PRIMARY').setCustomId('10').setEmoji('<:lirycs:893930920212586537>').setLabel(`Letra`);
    
    if (newQueue.repeatMode === 2) {
      queueloop = queueloop.setStyle('SECONDARY');
    }
    
    if (Math.floor(currentTime) < 10) {
      rewind = rewind.setDisabled();
    }
    if (Math.floor(duration - currentTime) <= 10) {
      forward = forward.setDisabled();
    }
    
    const row = new MessageActionRow().addComponents([skip, stop, pause, autoplay, shuffle]);
    const row2 = new MessageActionRow().addComponents([queueloop, forward, rewind, lyrics]);
    
    return { embeds: [embed], components: [row, row2] };
  }
};
