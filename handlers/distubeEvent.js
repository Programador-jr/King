console.log(`Bem-vindo ao MANIPULADOR DE SERVICO /--/`.yellow);
const PlayerMap = new Map()
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
const ytAuthWarnAt = new Map();

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

const sendToDistubeChannel = async (target, payload, deleteAfterMs = 0) => {
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
  try {
    client.distube
      .on(`playSong`, async (queue, track) => {
        try {
          addSongPlayed(queue.id, track);
          
          client.guilds.cache.get(queue.id).me.voice.setDeaf(true).catch((e) => {
            console.log(e.stack ? String(e.stack).grey : String(e).grey)
          })
        } catch (error) {
          console.log(error)
        }
          try {
            var newQueue = client.distube.getQueue(queue.id)
            var newTrack = track;
            var data = receiveQueueData(newQueue, newTrack)
            //Send message with buttons
            let currentSongPlayMsg = await queue.textChannel.send(data).then(msg => {
              PlayerMap.set(getPlayerMapKey(queue.id), msg.id);
            return msg;
          })
          //create a collector for the thinggy
          var collector = currentSongPlayMsg.createMessageComponentCollector({
            filter: (i) => i.isButton() && i.user && i.message.author.id == client.user.id,
            time: track.duration > 0 ? track.duration * 1000 : 600000
          }); //collector for 5 seconds
          //array of all embeds, here simplified just 10 embeds with numbers 0 - 9
          let lastEdited = false;

          /**
           * @INFORMATION - EDIT THE SONG MESSAGE EVERY 10 SECONDS!
           */
          try{clearInterval(songEditInterval)}catch(e){}
          songEditInterval = setInterval(async () => {
            if (!lastEdited) {
              try{
                var newQueue = client.distube.getQueue(queue.id)
                var newTrack = newQueue.songs[0];
                var data = receiveQueueData(newQueue, newTrack)
                await currentSongPlayMsg.edit(data).catch((e) => {
                  console.log(e.stack ? String(e.stack).grey : String(e).grey)
                })
              }catch (e){
                clearInterval(songEditInterval)
              }
            }
          }, 10000)

          collector.on('collect', async i => {
            const liveQueue = client.distube.getQueue(i.guild.id);
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
                .setTitle(`${client.allEmojis.x} **Você não é um DJ ou não é o solicitador da música!**`)
                .setDescription(`**CARGO-DJ:**\n${check_if_dj(client, i.member, newQueue.songs[0])}`)
              ],
              ephemeral: true});
            }
            lastEdited = true;
            setTimeout(() => {
              lastEdited = false
            }, 7000)
            //skip
            if (i.customId == `1`) {
              let { member } = i;
              //get the channel instance from the Member
              const { channel } = member.voice
              //if the member is not in a channel, return
              if (!channel)
                return replyAndDelete(i, {
                  content: `${client.allEmojis.x} **Por favor, junte-se a um canal de voz primeiro!**`,
                  ephemeral: true
                })
              //get the player instance
              const queue = client.distube.getQueue(i.guild.id);
              //if no player available return aka not playing anything
              if (!queue || !newQueue.songs || newQueue.songs.length == 0) {
                return i.reply({
                  content: `${client.allEmojis.x} Nada há nada tocando ainda`,
                  ephemeral: true
                })
              }
              //if not in the same channel as the player, return Error
              if (channel.id !== newQueue.voiceChannel.id)
                return replyAndDelete(i, {
                  content: `${client.allEmojis.x} **Por favor entre no __meu__ canal de voz primeiro! <#${channel.id}>**`,
                  ephemeral: true
                })
              if (newQueue.songs.length <= 1 && !newQueue.autoplay) {
                return replyAndDelete(i, {
                  content: `${client.allEmojis.x} **Nao ha proxima musica na fila.**`,
                  ephemeral: true
                })
              }
              try {
                await client.distube.skip(i.guild.id)
                replyAndDelete(i, {
                  embeds: [new MessageEmbed()
                    .setColor(ee.color)
                    .setTimestamp()
                    .setTitle(`<:next:893930822267195453> **Pulei para a proxima musica!**`)
                    .setFooter(`Acao por: ${member.user.tag}`, member.user.displayAvatarURL({dynamic: true}))]
                })
              } catch (e) {
                if (String(e).includes("NO_UP_NEXT") || e?.errorCode === "NO_UP_NEXT") {
                  return replyAndDelete(i, {
                    content: `${client.allEmojis.x} **Nao ha proxima musica na fila.**`,
                    ephemeral: true
                  })
                }
                throw e;
              }
            }
            //stop
            if (i.customId == `2`) {
              let { member } = i;
              //get the channel instance from the Member
              const { channel } = member.voice
              //if the member is not in a channel, return
              if (!channel)
                return replyAndDelete(i, {
                  content: `${client.allEmojis.x} **Por favor junte-se a um canal de voz primeiro!**`,
                  ephemeral: true
                })

              //if not in the same channel as the player, return Error
              if (channel.id !== newQueue.voiceChannel.id)
                return replyAndDelete(i, {
                  content: `${client.allEmojis.x} **Por favor entre no __meu__ canal de voz primeiro! <#${channel.id}>**`,
                  ephemeral: true
                })
                //stop the track
                replyAndDelete(i, {
                  embeds: [new MessageEmbed()
                    .setColor(ee.color)
                    .setTimestamp()
                    .setTitle(`<:stop:893931070410604594> **Parou de tocar e saiu do canal!**`)
                    .setFooter(`Acao por: ${member.user.tag}`, member.user.displayAvatarURL({dynamic: true}))]
                })
                clearInterval(songEditInterval);
                //edit the current song message
                await client.distube.stop(i.guild.id)
            }
            //pause/resume
            if (i.customId == `3`) {
              let { member } = i;
              //get the channel instance from the Member
              const { channel } = member.voice
              //if the member is not in a channel, return
              if (!channel)
                return replyAndDelete(i, {
                  content: `${client.allEmojis.x} **Por favor junte-se a um canal de voz primeiro!**`,
                  ephemeral: true
                })
              //if not in the same channel as the player, return Error
              if (channel.id !== newQueue.voiceChannel.id)
                return replyAndDelete(i, {
                  content: `${client.allEmojis.x} **Por favor entre no __meu__ canal de voz primeiro! <#${channel.id}>**`,
                  ephemeral: true
                })
              try {
                if (newQueue.paused) {
                  await client.distube.resume(i.guild.id);
                  var data = receiveQueueData(client.distube.getQueue(queue.id), newQueue.songs[0])
                  currentSongPlayMsg.edit(data).catch((e) => {
                    //console.log(e.stack ? String(e.stack).grey : String(e).grey)
                  })
                  replyAndDelete(i, {
                    embeds: [new MessageEmbed()
                      .setColor(ee.color)
                      .setTimestamp()
                      .setTitle(`<:play:893931043571249174> **Despausado!**`)
                      .setFooter(`Acao por: ${member.user.tag}`, member.user.displayAvatarURL({dynamic: true}))]
                  })
                } else {
                  await client.distube.pause(i.guild.id);
                  var data = receiveQueueData(client.distube.getQueue(queue.id), newQueue.songs[0])
                  currentSongPlayMsg.edit(data).catch((e) => {
                    //console.log(e.stack ? String(e.stack).grey : String(e).grey)
                  })
                  replyAndDelete(i, {
                    embeds: [new MessageEmbed()
                      .setColor(ee.color)
                      .setTimestamp()
                      .setTitle(`<:pause:893930949149097985> **Pausado!**`)
                      .setFooter(`Acao por: ${member.user.tag}`, member.user.displayAvatarURL({dynamic: true}))]
                  })
                }
              } catch (e) {
                if (String(e).includes("PAUSED") || e?.errorCode === "PAUSED") {
                  return replyAndDelete(i, { content: `${client.allEmojis.x} **A fila ja esta pausada.**`, ephemeral: true })
                }
                if (String(e).includes("RESUMED") || e?.errorCode === "RESUMED") {
                  return replyAndDelete(i, { content: `${client.allEmojis.x} **A fila ja esta tocando.**`, ephemeral: true })
                }
                throw e;
              }
            }
            //autoplay
            if (i.customId == `4`) {
              let { member } = i;
              //get the channel instance from the Member
              const { channel } = member.voice
              //if the member is not in a channel, return
              if (!channel)
                return replyAndDelete(i, {
                  content: `${client.allEmojis.x} **Por favor junte-se a um canal de voz primeiro!**`,
                  ephemeral: true
                })
              //if not in the same channel as the player, return Error
              if (channel.id !== newQueue.voiceChannel.id)
                return replyAndDelete(i, {
                  content: `${client.allEmojis.x} **Por favor entre no __meu__ canal de voz primeiro! <#${channel.id}>**`,
                  ephemeral: true
                })
              //pause the player
              await newQueue.toggleAutoplay()
              if (newQueue.autoplay) {
                var data = receiveQueueData(client.distube.getQueue(queue.id), newQueue.songs[0])
                currentSongPlayMsg.edit(data).catch((e) => {
                  //console.log(e.stack ? String(e.stack).grey : String(e).grey)
                })
              } else {
                var data = receiveQueueData(client.distube.getQueue(queue.id), newQueue.songs[0])
                currentSongPlayMsg.edit(data).catch((e) => {
                  //console.log(e.stack ? String(e.stack).grey : String(e).grey)
                })
              }
              //Send PRIMARY Message
              replyAndDelete(i, {
                embeds: [new MessageEmbed()
                  .setColor(ee.color)
                  .setTimestamp()
                  .setTitle(`${newQueue.autoplay ? `${client.allEmojis.check_mark} **Autoplay ativado**`: `${client.allEmojis.x} **Autoplay desativado**`}`)
                  .setFooter(`Acao por: ${member.user.tag}`, member.user.displayAvatarURL({dynamic: true}))]
                })
            }
            //Shuffle
            if(i.customId == `5`){
              let { member } = i;
              //get the channel instance from the Member
              const { channel } = member.voice
              //if the member is not in a channel, return
              if (!channel)
                return replyAndDelete(i, {
                  content: `${client.allEmojis.x} **Por favor junte-se a um canal de voz primeiro!**`,
                  ephemeral: true
                })
              //if not in the same channel as the player, return Error
              if (channel.id !== newQueue.voiceChannel.id)
                return replyAndDelete(i, {
                  content: `${client.allEmojis.x} **Por favor entre no __meu__ canal de voz primeiro! <#${channel.id}>**`,
                  ephemeral: true
                })
              //pause the player
              await newQueue.shuffle()
              //Send PRIMARY Message
              replyAndDelete(i, {
                embeds: [new MessageEmbed()
                  .setColor(ee.color)
                  .setTimestamp()
                  .setTitle(`<:shuffle:893942706269749278> **Aleatorio ${newQueue.songs.length} musicas!**`)
                  .setFooter(`Acao por: ${member.user.tag}`, member.user.displayAvatarURL({dynamic: true}))]
              })
            }
            //Songloop
            if(i.customId == `6`){
              let { member } = i;
              //get the channel instance from the Member
              const { channel } = member.voice
              //if the member is not in a channel, return
              if (!channel)
                return replyAndDelete(i, {
                  content: `${client.allEmojis.x} **Por favor junte-se a um canal de voz primeiro!**`,
                  ephemeral: true
                })
              //if not in the same channel as the player, return Error
              if (channel.id !== newQueue.voiceChannel.id)
                return replyAndDelete(i, {
                  content: `${client.allEmojis.x} **Por favor entre no __meu__ canal de voz primeiro! <#${channel.id}>**`,
                  ephemeral: true
                })
              //Disable the Repeatmode
              if(newQueue.repeatMode == 1){
                await newQueue.setRepeatMode(0)
              } 
              //Enable it
              else {
                await newQueue.setRepeatMode(1)
              }
              replyAndDelete(i, {
                embeds: [new MessageEmbed()
                  .setColor(ee.color)
                  .setTimestamp()
                  .setTitle(`${newQueue.repeatMode == 1 ? `${client.allEmojis.check_mark} **Loop ativado**`: `${client.allEmojis.x} **Loop desativado**`}`)
                  .setFooter(`Acao por: ${member.user.tag}`, member.user.displayAvatarURL({dynamic: true}))]
              })
              var data = receiveQueueData(client.distube.getQueue(queue.id), newQueue.songs[0])
              currentSongPlayMsg.edit(data).catch((e) => {
                //console.log(e.stack ? String(e.stack).grey : String(e).grey)
              })
            }
            //Queueloop
            if(i.customId == `7`){
              let { member } = i;
              //get the channel instance from the Member
              const { channel } = member.voice
              //if the member is not in a channel, return
              if (!channel)
                return replyAndDelete(i, {
                  content: `${client.allEmojis.x} **Por favor junte-se a um canal de voz primeiro!**`,
                  ephemeral: true
                })
              //if not in the same channel as the player, return Error
              if (channel.id !== newQueue.voiceChannel.id)
                return replyAndDelete(i, {
                  content: `${client.allEmojis.x} **Por favor entre no __meu__ canal de voz primeiro! <#${channel.id}>**`,
                  ephemeral: true
                })
              //Disable the Repeatmode
              if(newQueue.repeatMode == 2){
                await newQueue.setRepeatMode(0)
              } 
              //Enable it
              else {
                await newQueue.setRepeatMode(2)
              }
              replyAndDelete(i, {
                embeds: [new MessageEmbed()
                  .setColor(ee.color)
                  .setTimestamp()
                  .setTitle(`${newQueue.repeatMode == 2 ? `${client.allEmojis.check_mark} **Loop ativado**`: `${client.allEmojis.x} **Loop desativado**`}`)
                  .setFooter(`Acao por: ${member.user.tag}`, member.user.displayAvatarURL({dynamic: true}))]
                })
              var data = receiveQueueData(client.distube.getQueue(queue.id), newQueue.songs[0])
              currentSongPlayMsg.edit(data).catch((e) => {
                //console.log(e.stack ? String(e.stack).grey : String(e).grey)
              })
            }
            //Forward
            if(i.customId == `8`){
              let { member } = i;
              //get the channel instance from the Member
              const { channel } = member.voice
              //if the member is not in a channel, return
              if (!channel)
                return replyAndDelete(i, {
                  content: `${client.allEmojis.x} **Por favor junte-se a um canal de voz primeiro!**`,
                  ephemeral: true
                })
              //if not in the same channel as the player, return Error
              if (channel.id !== newQueue.voiceChannel.id)
                return replyAndDelete(i, {
                  content: `${client.allEmojis.x} **Por favor entre no __meu__ canal de voz primeiro! <#${channel.id}>**`,
                  ephemeral: true
                })
              let seektime = newQueue.currentTime + 10;
              if (seektime >= newQueue.songs[0].duration) seektime = newQueue.songs[0].duration - 1;
              await newQueue.seek(Number(seektime))
              collector.resetTimer({time: (newQueue.songs[0].duration - newQueue.currentTime) * 1000})
              replyAndDelete(i, {
                embeds: [new MessageEmbed()
                  .setColor(ee.color)
                  .setTimestamp()
                  .setTitle(`<:avancar:893930980312760390> **Avancou a musica por \`10 Segundos\`!**`)
                  .setFooter(`Acao por: ${member.user.tag}`, member.user.displayAvatarURL({dynamic: true}))]
              })
              var data = receiveQueueData(client.distube.getQueue(queue.id), newQueue.songs[0])
              currentSongPlayMsg.edit(data).catch((e) => {
                //console.log(e.stack ? String(e.stack).grey : String(e).grey)
              })
            }
            //Rewind
            if(i.customId == `9`){
              let { member } = i;
              //get the channel instance from the Member
              const { channel } = member.voice
              //if the member is not in a channel, return
              if (!channel)
                return replyAndDelete(i, {
                  content: `${client.allEmojis.x} **Por favor junte-se a um canal de voz primeiro!**`,
                  ephemeral: true
                })
              //if not in the same channel as the player, return Error
              if (channel.id !== newQueue.voiceChannel.id)
                return replyAndDelete(i, {
                  content: `${client.allEmojis.x} **Por favor entre no __meu__ canal de voz primeiro! <#${channel.id}>**`,
                  ephemeral: true
                })
              let seektime = newQueue.currentTime - 10;
              if (seektime < 0) seektime = 0;
              if (seektime >= newQueue.songs[0].duration - newQueue.currentTime) seektime = 0;
              await newQueue.seek(Number(seektime))
              collector.resetTimer({time: (newQueue.songs[0].duration - newQueue.currentTime) * 1000})
              replyAndDelete(i, {
                embeds: [new MessageEmbed()
                  .setColor(ee.color)
                  .setTimestamp()
                  .setTitle(`<:voltar:893930880307961886> **Retrocedeu a musica por \`10 Segundos\`!**`)
                  .setFooter(`Acao por: ${member.user.tag}`, member.user.displayAvatarURL({dynamic: true}))]
              })
              var data = receiveQueueData(client.distube.getQueue(queue.id), newQueue.songs[0])
              currentSongPlayMsg.edit(data).catch((e) => {
                //console.log(e.stack ? String(e.stack).grey : String(e).grey)
              })
            }
            //Lyrics
            if(i.customId == `10`){let { member } = i;
              //get the channel instance from the Member
              const { channel } = member.voice
              //if the member is not in a channel, return
              if (!channel)
                return replyAndDelete(i, {
                  content: `${client.allEmojis.x} **Por favor junte-se a um canal de voz primeiro!**`,
                  ephemeral: true
                })
              //if not in the same channel as the player, return Error
              if (channel.id !== newQueue.voiceChannel.id)
                return replyAndDelete(i, {
                  content: `${client.allEmojis.x} **Por favor entre no __meu__ canal de voz primeiro! <#${channel.id}>**`,
                  ephemeral: true
                })
              try {
                if (!i.deferred && !i.replied) {
                  await i.deferReply({ ephemeral: true }).catch(() => {});
                }
                const currentSong = newQueue?.songs?.[0];
                if (!currentSong) {
                  return i.editReply({
                    content: `${client.allEmojis.x} **Nao achei uma música ativa para buscar letra.**`,
                    embeds: []
                  }).catch(() => {});
                }

                const query = getSongSearchData(currentSong);
                const result = await getLyricsWithFallback(query, {
                  vagalumeApiKey: process.env.VAGALUME_API_KEY || process.env.VAGALUME_KEY || "",
                });

                if (!result.lyrics) {
                  return i.editReply({
                    content: `${client.allEmojis.x} **Nao encontrei letra para essa música.**`,
                    embeds: []
                  }).catch(() => {});
                }

                const sourceLabel = `${result.source}${result.synced ? " (sincronizada)" : ""}`;
                const fullLyrics = [
                  `Fonte: ${sourceLabel}`,
                  `Artista: ${result.artist || query.artist || "desconhecido"}`,
                  `Música: ${result.title || query.title || currentSong.name}`,
                  "",
                  result.lyrics
                ].join("\n");

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

                embed.setDescription(
                  `${[
                    `Fonte: ${sourceLabel}`,
                    `Artista: ${result.artist || query.artist || "desconhecido"}`,
                    `Música: ${result.title || query.title || currentSong.name}`,
                    "",
                  ].join("\n")}A letra completa excede o limite de um embed e foi enviada no arquivo abaixo.`
                );
                const filename = `lyrics-${safeSlug(`${result.artist || query.artist}-${result.title || query.title || currentSong.name}`)}.txt`;
                const file = new AttachmentBuilder(Buffer.from(fullLyrics, "utf8"), { name: filename });
                return i.editReply({ content: null, embeds: [embed], files: [file] }).catch(() => {});
              } catch (e) {
                console.log(e.stack ? String(e.stack).grey : String(e).grey);
                const payload = {
                  content: `${client.allEmojis.x} **Falha ao buscar a letra agora.**`,
                  embeds: []
                };
                if (i.deferred || i.replied) {
                  return i.editReply(payload).catch(() => {});
                }
                return replyAndDelete(i, { ...payload, ephemeral: true });
              }
            }
          });
        } catch (error) {
          console.error(error)
        }
      })
      .on(`addSong`, (queue, song) => {
        return queue.textChannel.send({
        embeds: [
          new MessageEmbed()
          .setColor(ee.color)
          .setThumbnail(song?.thumbnail || (song?.id ? `https://img.youtube.com/vi/${song.id}/mqdefault.jpg` : ee.footericon))
          .setFooter(" " + song.user.tag, song.user.displayAvatarURL({
            dynamic: true
          }))
          .setTitle(`${client.allEmojis.check_mark} **Musica adicionada a fila de reproducao!**`)
          .setDescription(`<:queue:893912259535966238> Musica: [\`${song.name}\`](${song.url})  -  \`${song.formattedDuration}\``)
          .addField(`<:duration:893938822386163723> **Tempo estimado:**`, `\`${queue.songs.length - 1} musica${queue.songs.length > 0 ? "s" : ""}\` - \`${(Math.floor((queue.duration - song.duration) / 60 * 100) / 100).toString().replace(".", ":")}\``)
          .addField(`<:queue:893912259535966238> **Duracao da fila:**`, `\`${queue.formattedDuration}\``)
        ]
      })
      })
      .on(`addList`, (queue, playlist) => queue.textChannel.send({
        embeds: [
          new MessageEmbed()
          .setColor(ee.color)
          .setThumbnail((playlist?.thumbnail?.url || playlist?.thumbnail) ? (playlist.thumbnail?.url || playlist.thumbnail) : `https://img.youtube.com/vi/${playlist.songs[0].id}/mqdefault.jpg`)
          .setFooter("" + playlist.user.tag, playlist.user.displayAvatarURL({
            dynamic: true
          }))
          .setTitle(`${client.allEmojis.check_mark} **Playlist adicionada a fila!**`)
          .setDescription(`<:queue:893912259535966238> Playlist: [\`${playlist.name}\`](${playlist.url ? playlist.url : ""})  -  \`${playlist.songs.length} Musica${playlist.songs.length > 0 ? "s" : ""}\``)
          .addField(`<:duration:893938822386163723> **Tempo estimado:**`, `\`${queue.songs.length - - playlist.songs.length} musica${queue.songs.length > 0 ? "s" : ""}\` - \`${(Math.floor((queue.duration - playlist.duration) / 60 * 100) / 100).toString().replace(".", ":")}\``)
          .addField(`<:queue:893912259535966238> **Duracao da fila:**`, `\`${queue.formattedDuration}\``)
        ]
      }))
      // DisTubeOptions.searchSongs = true
      .on(`searchResult`, (message, result) => {
        let i = 0
        message.channel.send(`**Escolha uma opcao abaixo**\n${result.map((song) => `**${++i}**. ${song.name} - \`${song.formattedDuration}\``).join(`\n`)}\n*Digite qualquer outra coisa ou aguarde 60 segundos para cancelar*`)
      })
      // DisTubeOptions.searchSongs = true
      .on(`searchCancel`, message => message.channel.send(`Pesquisa cancelada`).catch((e)=>console.log(e)))
      .on(`error`, (error, queue, song) => {
        const target = queue?.textChannel || queue || song;
        const rawError = String(error?.message || error || "");
        const isYoutubeAuthError =
          /Sign in to confirm you.?re not a bot/i.test(rawError) ||
          /Use --cookies-from-browser or --cookies/i.test(rawError);

        if (isYoutubeAuthError) {
          const queueId = String(queue?.id || song?.id || "global");
          const now = Date.now();
          const lastWarn = ytAuthWarnAt.get(queueId) || 0;
          if (now - lastWarn >= 12000) {
            ytAuthWarnAt.set(queueId, now);
            sendToDistubeChannel(
              target,
              `${client.allEmojis.x} YouTube bloqueou a reproducao. Configure cookies validos e tente novamente.`,
              4000
            );
          }
          if (queue && typeof queue.stop === "function") {
            queue.stop().catch(() => {});
          }
          console.error(error);
          return;
        }

        sendToDistubeChannel(target, `Um erro encontrado: ${rawError}`, 4000);
        console.error(error)
      })
      .on(`empty`, channel => sendToDistubeChannel(channel, `O canal de voz está vazio! Saindo do canal...`))
      .on(`searchNoResult`, message => message.channel.send(`nenhum resultado encontrado!`).catch((e)=>console.log(e)))
      .on(`finishSong`, (queue, song) => {
        var embed = new MessageEmbed().setColor(ee.color)
        .setAuthor(`${song.name}`, "https://images-ext-2.discordapp.net/external/Q16BMFNhO29X2_DgKf3tJk2YOsC0jQ0yu6qPyxqwO9w/https/media.discordapp.net/attachments/883978730261860383/883978741892649000/847032838998196234.png", song.url)
        .setDescription(`Veja a [fila no **DASHBOARD** ao vivo!](${dashboardBaseUrl}/queue/${queue.id})`)
        .setThumbnail(`https://img.youtube.com/vi/${song.id}/mqdefault.jpg`)
        .setFooter(` ${song.user.tag}
A MUSICA ACABOU!`, song.user.displayAvatarURL({
          dynamic: true
        }));
        const playerMsgId = PlayerMap.get(getPlayerMapKey(queue.id));
        if (!playerMsgId) return;
        queue.textChannel.messages.fetch(playerMsgId).then(currentSongPlayMsg=>{
          if (!currentSongPlayMsg || typeof currentSongPlayMsg.edit !== "function") return;
          currentSongPlayMsg.edit({embeds: [embed], components: []}).catch((e) => {
            console.log(e.stack ? String(e.stack).grey : String(e).grey)
          })
        }).catch((e) => {
          console.log(e.stack ? String(e.stack).grey : String(e).grey)
        })
        PlayerMap.delete(getPlayerMapKey(queue.id));
      })
      .on(`finish`, queue => {
        queue.textChannel.send({
          embeds: [
            new MessageEmbed().setColor(ee.color).setFooter(ee.footertext, ee.footericon)
            .setTitle("SAINDO DO CANAL")
            .setDescription("<:queue:893912259535966238> **Nao ha mais musicas restantes**")
            .setTimestamp()
          ]
        })
      })
      .on(`initQueue`, queue => {
        try {
          client.settings.ensure(queue.id, {
            defaultvolume: 50,
            defaultautoplay: false,
            defaultfilters: [`bassboost6`, `clear`]
          })
          let data = client.settings.get(queue.id)
          queue.autoplay = Boolean(data.defaultautoplay);
          queue.volume = Number(data.defaultvolume);
          const defaultFilters = Array.isArray(data.defaultfilters) ? data.defaultfilters.filter(Boolean) : [];
          // Avoid calling queue.filters.set() here; it triggers queue.play() before any song exists.
          if (defaultFilters.length) {
            const filtersToApply = defaultFilters.filter((name) => name !== "clear" && Object.hasOwn(queue.distube.filters, name));
            queue.filters.collection.clear();
            for (const name of filtersToApply) {
              queue.filters.collection.set(name, { name, value: queue.distube.filters[name] });
            }
          }
        } catch (error) {
          console.error(error)
        }
      });
  } catch (e) {
    console.log(String(e.stack).bgRed)
  }

  function receiveQueueData(newQueue, newTrack) {
    const currentFilters = Array.isArray(newQueue?.filters?.names)
      ? newQueue.filters.names
      : (newQueue?.filters?.collection ? [...newQueue.filters.collection.keys()] : []);
    const appliedFilters = Array.isArray(currentFilters) ? currentFilters : [];
    var djs = client.settings.get(newQueue.id, `djroles`);
    if(!djs || !Array.isArray(djs)) djs = [];
    else djs = djs.map(r => `<@&${r}>`);
    if(djs.length == 0 ) djs = "`nao configurado`";
    else djs.slice(0, 15).join(", ");
    if(!newTrack) return new MessageEmbed().setColor(ee.wrongcolor).setTitle("NENHUMA MUSICA ENCONTRADA?!?!")
    var embed = new MessageEmbed().setColor(ee.color)
      .setDescription(`Veja a [fila no ** DASHBOARD ** ao vivo!](${dashboardBaseUrl}/queue/${newQueue.id})`)
      .addField(`<:required:893938878380122122> Requerido por:`, `>>> ${newTrack.user}`, true)
      .addField(`<:duration:893938822386163723> Duracao:`, `>>> \`${newQueue.formattedCurrentTime} / ${newTrack.formattedDuration}\``, true)
      .addField(`<:queue:893912259535966238> Fila:`, `>>> \`${newQueue.songs.length} musica(s)\`\n\`${newQueue.formattedDuration}\``, true)
      .addField(`<:volume:893912366905954365> Volume:`, `>>> \`${newQueue.volume} %\``, true)
      .addField(`<:autoplay1:893938933891756073> Loop:`, `>>> ${newQueue.repeatMode ? newQueue.repeatMode === 2 ? `${client.allEmojis.check_mark}\` Fila\`` : `${client.allEmojis.check_mark} \`Musica\`` : `${client.allEmojis.x}`}`, true)
      .addField(`<:autoplay:893912311729897544> Autoplay:`, `>>> ${newQueue.autoplay ? `${client.allEmojis.check_mark}` : `${client.allEmojis.x}`}`, true)
      .addField(`<:download:893912200207548507> Baixar musica:`, `>>> [\`Clique aqui\`](${newTrack.url || newTrack.streamURL})`, true)
      .addField(`<:filter:893938850311835658> Filtro${appliedFilters.length > 0 ? "s": ""}:`, `>>> ${newQueue.filters && appliedFilters.length > 0 ? `${appliedFilters.map(f=>`\`${f}\``).join(`, `)}` : `${client.allEmojis.x}`}`, appliedFilters.length > 1 ? false : true)
			.addField(`<:dj:893912114203332729> CARGO-DJ${client.settings.get(newQueue.id, "djroles").length > 1 ? "s": ""}:`, `>>> ${djs}`, client.settings.get(newQueue.id, "djroles").length > 1 ? false : true)
      .setAuthor(`${newTrack.name}`, `https://images-ext-1.discordapp.net/external/iAtXPtuThJzes9sxragLd-lwLt-oCMNsXYTSqumoenw/https/c.tenor.com/HJvqN2i4Zs4AAAAj/milk-and-mocha-cute.gif`, newTrack.url)
      .setThumbnail(`https://img.youtube.com/vi/${newTrack.id}/mqdefault.jpg`)
      .setFooter(` ${newTrack.user.tag}`, newTrack.user.displayAvatarURL({
        dynamic: true
      }));
    let skip = new MessageButton().setStyle('PRIMARY').setCustomId('1').setEmoji(`<:next:893930822267195453>`).setLabel(`Pular`)
    let stop = new MessageButton().setStyle('DANGER').setCustomId('2').setEmoji(`<:stop:893931070410604594>`).setLabel(`Parar`)
    let pause = new MessageButton().setStyle('PRIMARY').setCustomId('3').setEmoji('<:pause:893930949149097985>').setLabel(`Pausar`)
    let autoplay = new MessageButton().setStyle('PRIMARY').setCustomId('4').setEmoji('<:autoplay2:893968830286692402>').setLabel(`Autoplay`)
    let shuffle = new MessageButton().setStyle('PRIMARY').setCustomId('5').setEmoji('<:shuffle1:893972682633261076>').setLabel(`Aleatorio`)
    if (!newQueue.playing) {
      pause = pause.setStyle('DANGER').setEmoji('<:play:893931043571249174>').setLabel(`Despausar`)
    }
    if (newQueue.autoplay) {
      autoplay = autoplay.setStyle('SECONDARY')
    }
    let queueloop = new MessageButton().setStyle('PRIMARY').setCustomId('7').setEmoji(`<:random:893968760078217236>`).setLabel(`Loop`)
    let forward = new MessageButton().setStyle('PRIMARY').setCustomId('8').setEmoji('<:avancar:893930980312760390>').setLabel(`+10 Seg`)
    let rewind = new MessageButton().setStyle('PRIMARY').setCustomId('9').setEmoji('<:voltar:893930880307961886>').setLabel(`-10 Seg`)
    let lyrics = new MessageButton().setStyle('PRIMARY').setCustomId('10').setEmoji('<:lirycs:893930920212586537>').setLabel(`Letra`);
    if (newQueue.repeatMode === 2) {
      queueloop = queueloop.setStyle('SECONDARY')
    } else {
      queueloop = queueloop.setStyle('PRIMARY')
    }
    if (Math.floor(newQueue.currentTime) < 10) {
      rewind = rewind.setDisabled()
    } else {
      rewind = rewind.setDisabled(false)
    }
    if (Math.floor((newTrack.duration - newQueue.currentTime)) <= 10) {
      forward = forward.setDisabled()
    } else {
      forward = forward.setDisabled(false)
    }
    const row = new MessageActionRow().addComponents([skip, stop, pause, autoplay, shuffle]);
    const row2 = new MessageActionRow().addComponents([queueloop, forward, rewind, lyrics]);
    return {
      embeds: [embed],
      components: [row, row2]
    };
  }
};
