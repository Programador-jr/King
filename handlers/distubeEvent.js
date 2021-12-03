console.log(`Bem-vindo ao MANIPULADOR DE SERVIÇO /--/`.yellow);
const PlayerMap = new Map()
const Discord = require(`discord.js`);
const {
    KSoftClient
} = require('@ksoft/api');
const config = require(`../botconfig/config.json`);
const ksoft = new KSoftClient(config.ksoftapi);
const ee = require(`../botconfig/embed.json`);
const {
  MessageButton,
  MessageActionRow,
  MessageEmbed
} = require(`discord.js`);
const { 
  lyricsEmbed, check_if_dj
} = require("./functions");
let songEditInterval = null;
module.exports = (client) => {
  try {
    client.distube
      .on(`playSong`, async (queue, track) => {
        try {
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
            PlayerMap.set(`currentmsg`, msg.id);
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
            if(i.customId != `10` && check_if_dj(client, i.member, client.distube.getQueue(i.guild.id).songs[0])) {
              return i.reply({embeds: [new MessageEmbed()
                .setColor(ee.wrongcolor)
                .setFooter(ee.footertext, ee.footericon)
                .setTitle(`${client.allEmojis.x} **Você não é um DJ e não é o solicitador da música!**`)
                .setDescription(`**CARGO-DJ:**\n${check_if_dj(client, i.member, client.distube.getQueue(i.guild.id).songs[0])}`)
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
                return i.reply({
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
                return i.reply({
                  content: `${client.allEmojis.x} **Por favor entre no __meu__ canal de voz primeiro! <#${channel.id}>**`,
                  ephemeral: true
                })
              //if ther is nothing more to skip then stop music and leave the Channel
              if (newQueue.songs.length == 0) {
                //if its on autoplay mode, then do autoplay before leaving...
                  i.reply({
                    embeds: [new MessageEmbed()
                    .setColor(ee.color)
                    .setTimestamp()
                    .setTitle(`<:stop:893931070410604594> **Parou de tocar e saiu do canal**`)
                    .setFooter(`Ação por: ${member.user.tag}`, member.user.displayAvatarURL({dynamic: true}))]
                  })
                  clearInterval(songEditInterval);
                  //edit the current song message
                  await client.distube.stop(i.guild.id)
                return
              }
              //skip the track
              await client.distube.skip(i.guild.id)
              i.reply({
                embeds: [new MessageEmbed()
                  .setColor(ee.color)
                  .setTimestamp()
                  .setTitle(`<:next:893930822267195453> **Pulei para a próxima música!**`)
                  .setFooter(`Ação por: ${member.user.tag}`, member.user.displayAvatarURL({dynamic: true}))]
              })
            }
            //stop
            if (i.customId == `2`) {
              let { member } = i;
              //get the channel instance from the Member
              const { channel } = member.voice
              //if the member is not in a channel, return
              if (!channel)
                return i.reply({
                  content: `${client.allEmojis.x} **Por favor junte-se a um canal de voz primeiro!**`,
                  ephemeral: true
                })

              //if not in the same channel as the player, return Error
              if (channel.id !== newQueue.voiceChannel.id)
                return i.reply({
                  content: `${client.allEmojis.x} **Por favor entre no __meu__ canal de voz primeiro! <#${channel.id}>**`,
                  ephemeral: true
                })
                //stop the track
                i.reply({
                  embeds: [new MessageEmbed()
                    .setColor(ee.color)
                    .setTimestamp()
                    .setTitle(`<:stop:893931070410604594> **Parou de tocar e saiu do canal!**`)
                    .setFooter(`Ação por: ${member.user.tag}`, member.user.displayAvatarURL({dynamic: true}))]
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
                return i.reply({
                  content: `${client.allEmojis.x} **Por favor junte-se a um canal de voz primeiro!**`,
                  ephemeral: true
                })
              //if not in the same channel as the player, return Error
              if (channel.id !== newQueue.voiceChannel.id)
                return i.reply({
                  content: `${client.allEmojis.x} **Por favor entre no __meu__ canal de voz primeiro! <#${channel.id}>**`,
                  ephemeral: true
                })
              if (newQueue.playing) {
                await client.distube.pause(i.guild.id);
                var data = receiveQueueData(client.distube.getQueue(queue.id), newQueue.songs[0])
                currentSongPlayMsg.edit(data).catch((e) => {
                  //console.log(e.stack ? String(e.stack).grey : String(e).grey)
                })
                i.reply({
                  embeds: [new MessageEmbed()
                    .setColor(ee.color)
                    .setTimestamp()
                    .setTitle(`<:pause:893930949149097985> **Pausado!**`)
                    .setFooter(`Ação por: ${member.user.tag}`, member.user.displayAvatarURL({dynamic: true}))]
                })
              } else {
                //pause the player
                await client.distube.resume(i.guild.id);
                var data = receiveQueueData(client.distube.getQueue(queue.id), newQueue.songs[0])
                currentSongPlayMsg.edit(data).catch((e) => {
                  //console.log(e.stack ? String(e.stack).grey : String(e).grey)
                })
                i.reply({
                  embeds: [new MessageEmbed()
                    .setColor(ee.color)
                    .setTimestamp()
                    .setTitle(`<:play:893931043571249174> **Despausado!**`)
                    .setFooter(`Ação por: ${member.user.tag}`, member.user.displayAvatarURL({dynamic: true}))]
                })
              }
            }
            //autoplay
            if (i.customId == `4`) {
              let { member } = i;
              //get the channel instance from the Member
              const { channel } = member.voice
              //if the member is not in a channel, return
              if (!channel)
                return i.reply({
                  content: `${client.allEmojis.x} **Por favor junte-se a um canal de voz primeiro!**`,
                  ephemeral: true
                })
              //if not in the same channel as the player, return Error
              if (channel.id !== newQueue.voiceChannel.id)
                return i.reply({
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
              i.reply({
                embeds: [new MessageEmbed()
                  .setColor(ee.color)
                  .setTimestamp()
                  .setTitle(`${newQueue.autoplay ? `${client.allEmojis.check_mark} **Autoplay ativado**`: `${client.allEmojis.x} **Autoplay desativado**`}`)
                  .setFooter(`Ação por: ${member.user.tag}`, member.user.displayAvatarURL({dynamic: true}))]
                })
            }
            //Shuffle
            if(i.customId == `5`){
              let { member } = i;
              //get the channel instance from the Member
              const { channel } = member.voice
              //if the member is not in a channel, return
              if (!channel)
                return i.reply({
                  content: `${client.allEmojis.x} **Por favor junte-se a um canal de voz primeiro!**`,
                  ephemeral: true
                })
              //if not in the same channel as the player, return Error
              if (channel.id !== newQueue.voiceChannel.id)
                return i.reply({
                  content: `${client.allEmojis.x} **Por favor entre no __meu__ canal de voz primeiro! <#${channel.id}>**`,
                  ephemeral: true
                })
              //pause the player
              await newQueue.shuffle()
              //Send PRIMARY Message
              i.reply({
                embeds: [new MessageEmbed()
                  .setColor(ee.color)
                  .setTimestamp()
                  .setTitle(`<:shuffle:893942706269749278> **Aleátorio ${newQueue.songs.length} Songs!**`)
                  .setFooter(`Ação por: ${member.user.tag}`, member.user.displayAvatarURL({dynamic: true}))]
              })
            }
            //Songloop
            if(i.customId == `6`){
              let { member } = i;
              //get the channel instance from the Member
              const { channel } = member.voice
              //if the member is not in a channel, return
              if (!channel)
                return i.reply({
                  content: `${client.allEmojis.x} **Por favor junte-se a um canal de voz primeiro!**`,
                  ephemeral: true
                })
              //if not in the same channel as the player, return Error
              if (channel.id !== newQueue.voiceChannel.id)
                return i.reply({
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
              i.reply({
                embeds: [new MessageEmbed()
                  .setColor(ee.color)
                  .setTimestamp()
                  .setTitle(`${newQueue.repeatMode == 1 ? `${client.allEmojis.check_mark} **Loop ativado**`: `${client.allEmojis.x} **Loop desativado**`}`)
                  .setFooter(`Ação por: ${member.user.tag}`, member.user.displayAvatarURL({dynamic: true}))]
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
                return i.reply({
                  content: `${client.allEmojis.x} **Por favor junte-se a um canal de voz primeiro!**`,
                  ephemeral: true
                })
              //if not in the same channel as the player, return Error
              if (channel.id !== newQueue.voiceChannel.id)
                return i.reply({
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
              i.reply({
                embeds: [new MessageEmbed()
                  .setColor(ee.color)
                  .setTimestamp()
                  .setTitle(`${newQueue.repeatMode == 2 ? `${client.allEmojis.check_mark} **Loop ativado**`: `${client.allEmojis.x} **Loop desativado**`}`)
                  .setFooter(`Ação por: ${member.user.tag}`, member.user.displayAvatarURL({dynamic: true}))]
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
                return i.reply({
                  content: `${client.allEmojis.x} **Por favor junte-se a um canal de voz primeiro!**`,
                  ephemeral: true
                })
              //if not in the same channel as the player, return Error
              if (channel.id !== newQueue.voiceChannel.id)
                return i.reply({
                  content: `${client.allEmojis.x} **Por favor entre no __meu__ canal de voz primeiro! <#${channel.id}>**`,
                  ephemeral: true
                })
              let seektime = newQueue.currentTime + 10;
              if (seektime >= newQueue.songs[0].duration) seektime = newQueue.songs[0].duration - 1;
              await newQueue.seek(Number(seektime))
              collector.resetTimer({time: (newQueue.songs[0].duration - newQueue.currentTime) * 1000})
              i.reply({
                embeds: [new MessageEmbed()
                  .setColor(ee.color)
                  .setTimestamp()
                  .setTitle(`<:avancar:893930980312760390> **Avançou a música por \`10 Segundos\`!**`)
                  .setFooter(`Ação por: ${member.user.tag}`, member.user.displayAvatarURL({dynamic: true}))]
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
                return i.reply({
                  content: `${client.allEmojis.x} **Por favor junte-se a um canal de voz primeiro!**`,
                  ephemeral: true
                })
              //if not in the same channel as the player, return Error
              if (channel.id !== newQueue.voiceChannel.id)
                return i.reply({
                  content: `${client.allEmojis.x} **Por favor entre no __meu__ canal de voz primeiro! <#${channel.id}>**`,
                  ephemeral: true
                })
              let seektime = newQueue.currentTime - 10;
              if (seektime < 0) seektime = 0;
              if (seektime >= newQueue.songs[0].duration - newQueue.currentTime) seektime = 0;
              await newQueue.seek(Number(seektime))
              collector.resetTimer({time: (newQueue.songs[0].duration - newQueue.currentTime) * 1000})
              i.reply({
                embeds: [new MessageEmbed()
                  .setColor(ee.color)
                  .setTimestamp()
                  .setTitle(`<:voltar:893930880307961886> **Retrocedeu a música por \`10 Segundos\`!**`)
                  .setFooter(`Ação por: ${member.user.tag}`, member.user.displayAvatarURL({dynamic: true}))]
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
                return i.reply({
                  content: `${client.allEmojis.x} **Por favor junte-se a um canal de voz primeiro!**`,
                  ephemeral: true
                })
              //if not in the same channel as the player, return Error
              if (channel.id !== newQueue.voiceChannel.id)
                return i.reply({
                  content: `${client.allEmojis.x} **Por favor entre no __meu__ canal de voz primeiro! <#${channel.id}>**`,
                  ephemeral: true
                })
                return i.reply({
                  content: `${client.allEmojis.x} **As letras estão desativadas!** \n> *Devido a motivos legais, as letras estão desativadas e não funcionarão por um período de tempo indeterminado* :cry:`,
                  ephemeral: true
                });
              let embeds = [];
              await ksoft.lyrics.get(newQueue.songs[0].name).then(
                async track => {
                    if (!track.lyrics) return i.reply({content: `${client.allEmojis.x} **Nenhuma letra encontrada!** :cry:`, ephemeral: true});
                    lyrics = track.lyrics;
                embeds = lyricsEmbed(lyrics, newQueue.songs[0]);
              }).catch(e=>{
                console.log(e)
                return i.reply({content: `${client.allEmojis.x} **Nenhuma letra encontrada!** :cry:\n${String(e).substr(0, 1800)}`, ephemeral: true});
              })
              i.reply({
                embeds: embeds, ephemeral: true
              })
            }
          });
        } catch (error) {
          console.error(error)
        }
      })
      .on(`addSong`, (queue, song) => queue.textChannel.send({
        embeds: [
          new MessageEmbed()
          .setColor(ee.color)
          .setThumbnail(`https://img.youtube.com/vi/${song.id}/mqdefault.jpg`)
          .setFooter(" " + song.user.tag, song.user.displayAvatarURL({
            dynamic: true
          }))
          .setTitle(`${client.allEmojis.check_mark} **Música adicionada à fila de reprodução!**`)
          .setDescription(`<:queue:893912259535966238> Música: [\`${song.name}\`](${song.url})  -  \`${song.formattedDuration}\``)
          .addField(`<:duration:893938822386163723> **Tempo estimado:**`, `\`${queue.songs.length - 1} song${queue.songs.length > 0 ? "s" : ""}\` - \`${(Math.floor((queue.duration - song.duration) / 60 * 100) / 100).toString().replace(".", ":")}\``)
          .addField(`<:queue:893912259535966238> **Duração da fila:**`, `\`${queue.formattedDuration}\``)
        ]
      }))
      .on(`addList`, (queue, playlist) => queue.textChannel.send({
        embeds: [
          new MessageEmbed()
          .setColor(ee.color)
          .setThumbnail(playlist.thumbnail.url ? playlist.thumbnail.url : `https://img.youtube.com/vi/${playlist.songs[0].id}/mqdefault.jpg`)
          .setFooter("" + playlist.user.tag, playlist.user.displayAvatarURL({
            dynamic: true
          }))
          .setTitle(`${client.allEmojis.check_mark} **Playlist added to the Queue!**`)
          .setDescription(`<:queue:893912259535966238> Playlist: [\`${playlist.name}\`](${playlist.url ? playlist.url : ""})  -  \`${playlist.songs.length} Música${playlist.songs.length > 0 ? "s" : ""}\``)
          .addField(`<:duration:893938822386163723> **Tempo estimado:**`, `\`${queue.songs.length - - playlist.songs.length} song${queue.songs.length > 0 ? "s" : ""}\` - \`${(Math.floor((queue.duration - playlist.duration) / 60 * 100) / 100).toString().replace(".", ":")}\``)
          .addField(`<:queue:893912259535966238> **Duração da fila:**`, `\`${queue.formattedDuration}\``)
        ]
      }))
      // DisTubeOptions.searchSongs = true
      .on(`searchResult`, (message, result) => {
        let i = 0
        message.channel.send(`**Escolha uma opção abaixo**\n${result.map((song) => `**${++i}**. ${song.name} - \`${song.formattedDuration}\``).join(`\n`)}\n*Digite qualquer outra coisa ou aguarde 60 segundos para cancelar*`)
      })
      // DisTubeOptions.searchSongs = true
      .on(`searchCancel`, message => message.channel.send(`Pesquisa cancelada`).catch((e)=>console.log(e)))
      .on(`error`, (channel, e) => {
        channel.send(`Um erro encontrado: ${e}`).catch((e)=>console.log(e))
        console.error(e)
      })
      .on(`empty`, channel => channel.send(`O canal de voz está vazio! Saindo do canal...`).catch((e)=>console.log(e)))
      .on(`searchNoResult`, message => message.channel.send(`nenhum resultado encontrado!`).catch((e)=>console.log(e)))
      .on(`finishSong`, (queue, song) => {
        var embed = new MessageEmbed().setColor(ee.color)
        .setAuthor(`${song.name}`, "https://images-ext-2.discordapp.net/external/Q16BMFNhO29X2_DgKf3tJk2YOsC0jQ0yu6qPyxqwO9w/https/media.discordapp.net/attachments/883978730261860383/883978741892649000/847032838998196234.png", song.url)
        .setDescription(`Veja a [fila no **DASHBOARD** ao vivo!](${require("../dashboard/settings.json").website.domain}/${queue.id})`)
        .setThumbnail(`https://img.youtube.com/vi/${song.id}/mqdefault.jpg`)
        .setFooter(` ${song.user.tag}\n⛔️ A MÚSICA ACABOU!`, song.user.displayAvatarURL({
          dynamic: true
        }));
        queue.textChannel.messages.fetch(PlayerMap.get(`currentmsg`)).then(currentSongPlayMsg=>{
          currentSongPlayMsg.edit({embeds: [embed], components: []}).catch((e) => {
            console.log(e.stack ? String(e.stack).grey : String(e).grey)
          })
        }).catch((e) => {
          console.log(e.stack ? String(e.stack).grey : String(e).grey)
        })
      })
      .on(`finish`, queue => {
        queue.textChannel.send({
          embeds: [
            new MessageEmbed().setColor(ee.color).setFooter(ee.footertext, ee.footericon)
            .setTitle("⛔️ SAINDO DO CANAL")
            .setDescription("<:queue:893912259535966238> **Não há mais músicas restantes**")
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
          queue.setFilter(data.defaultfilters);
        } catch (error) {
          console.error(error)
        }
      });
  } catch (e) {
    console.log(String(e.stack).bgRed)
  }

  function receiveQueueData(newQueue, newTrack) {
    var djs = client.settings.get(newQueue.id, `djroles`);
    if(!djs || !Array.isArray(djs)) djs = [];
    else djs = djs.map(r => `<@&${r}>`);
    if(djs.length == 0 ) djs = "`não configurado`";
    else djs.slice(0, 15).join(", ");
    if(!newTrack) return new MessageEmbed().setColor(ee.wrongcolor).setTitle("NO SONG FOUND?!?!")
    var embed = new MessageEmbed().setColor(ee.color)
      .setDescription(`Veja a [fila no ** DASHBOARD ** ao vivo!](${require("../dashboard/settings.json").website.domain}/queue/${newQueue.id})`)
      .addField(`<:required:893938878380122122> Requerido por:`, `>>> ${newTrack.user}`, true)
      .addField(`<:duration:893938822386163723> Duração:`, `>>> \`${newQueue.formattedCurrentTime} / ${newTrack.formattedDuration}\``, true)
      .addField(`<:queue:893912259535966238> Fila:`, `>>> \`${newQueue.songs.length} música(s)\`\n\`${newQueue.formattedDuration}\``, true)
      .addField(`<:volume:893912366905954365> Volume:`, `>>> \`${newQueue.volume} %\``, true)
      .addField(`<:autoplay1:893938933891756073> Loop:`, `>>> ${newQueue.repeatMode ? newQueue.repeatMode === 2 ? `${client.allEmojis.check_mark}\` Queue\`` : `${client.allEmojis.check_mark} \`Song\`` : `${client.allEmojis.x}`}`, true)
      .addField(`<:autoplay:893912311729897544> Autoplay:`, `>>> ${newQueue.autoplay ? `${client.allEmojis.check_mark}` : `${client.allEmojis.x}`}`, true)
      .addField(`<:download:893912200207548507> Baixar música:`, `>>> [\`Clique aqui\`](${newTrack.streamURL})`, true)
      .addField(`<:filter:893938850311835658> Filtro${newQueue.filters.length > 0 ? "s": ""}:`, `>>> ${newQueue.filters && newQueue.filters.length > 0 ? `${newQueue.filters.map(f=>`\`${f}\``).join(`, `)}` : `${client.allEmojis.x}`}`, newQueue.filters.length > 1 ? false : true)
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
    let shuffle = new MessageButton().setStyle('PRIMARY').setCustomId('5').setEmoji('<:shuffle1:893972682633261076>').setLabel(`Aleátorio`)
    if (!newQueue.playing) {
      pause = pause.setStyle('DANGER').setEmoji('<:play:893931043571249174>').setLabel(`Despausar`)
    }
    if (newQueue.autoplay) {
      autoplay = autoplay.setStyle('SECONDARY')
    }
    let songloop = new MessageButton().setStyle('PRIMARY').setCustomId('6').setEmoji(`<:fila:893969838983229461>`).setLabel(`Música`)
    let queueloop = new MessageButton().setStyle('PRIMARY').setCustomId('7').setEmoji(`<:random:893968760078217236>`).setLabel(`Fila`)
    let forward = new MessageButton().setStyle('PRIMARY').setCustomId('8').setEmoji('<:avancar:893930980312760390>').setLabel(`+10 Seg`)
    let rewind = new MessageButton().setStyle('PRIMARY').setCustomId('9').setEmoji('<:voltar:893930880307961886>').setLabel(`-10 Seg`)
    let lyrics = new MessageButton().setStyle('PRIMARY').setCustomId('10').setEmoji('<:lirycs:893930920212586537>').setLabel(`Letra`).setDisabled();
    if (newQueue.repeatMode === 0) {
      songloop = songloop.setStyle('PRIMARY')
      queueloop = queueloop.setStyle('PRIMARY')
    }
    if (newQueue.repeatMode === 1) {
      songloop = songloop.setStyle('SECONDARY')
      queueloop = queueloop.setStyle('PRIMARY')
    }
    if (newQueue.repeatMode === 2) {
      songloop = songloop.setStyle('PRIMARY')
      queueloop = queueloop.setStyle('SECONDARY')
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
    const row2 = new MessageActionRow().addComponents([songloop, queueloop, forward, rewind, lyrics]);
    return {
      embeds: [embed],
      components: [row, row2]
    };
  }
};