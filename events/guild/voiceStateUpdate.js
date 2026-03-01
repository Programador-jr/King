const { MessageEmbed, ChannelType } = require("discord.js");
const ee = require("../../botconfig/embed.json");

module.exports = async (client, oldState, newState) => {
    if (
        (!oldState.streaming && newState.streaming)   ||
        (oldState.streaming && !newState.streaming)   ||
        (!oldState.serverDeaf && newState.serverDeaf) ||
        (oldState.serverDeaf && !newState.serverDeaf) ||
        (!oldState.serverMute && newState.serverMute) ||
        (oldState.serverMute && !newState.serverMute) || 
        (!oldState.selfDeaf && newState.selfDeaf)     ||
        (oldState.selfDeaf && !newState.selfDeaf)     ||
        (!oldState.selfMute && newState.selfMute)     ||
        (oldState.selfMute && !newState.selfMute)     ||
        (!oldState.selfVideo && newState.selfVideo)   ||
        (oldState.selfVideo && !newState.selfVideo) 
     )
    
    // Bot entrou em um canal de voz
    if (!oldState.channelId && newState.channelId) {
        // Verifica se é o bot que entrou
        if (newState.id === client.user.id) {
            if(newState.channel.type == "GUILD_STAGE_VOICE" && newState.guild.me.voice.suppress){
                try{
                    await newState.guild.me.voice.setSuppressed(false);
                }catch (e){
                    console.log(String(e).grey);
                }
            }
            
            // Envia mensagem de entrada
            const logChannelId = process.env.LOG_CHANNEL_ID;
            if (logChannelId) {
                const logChannel = client.channels.cache.get(logChannelId);
                if (logChannel) {
                    const totalMembers = newState.guild.memberCount;
                    const totalSongs = client.distube.getQueue(newState.guild.id)?.songs?.length || 0;
                    
                    const embed = new MessageEmbed()
                        .setColor(ee.color)
                        .setTitle("🎵 Bot entrou em um canal de voz")
                        .setThumbnail(newState.guild.iconURL({ dynamic: true }))
                        .addFields(
                            { name: "Servidor", value: `**${newState.guild.name}**`, inline: true },
                            { name: "ID do Servidor", value: `\`${newState.guild.id}\``, inline: true },
                            { name: "Membros", value: `\`${totalMembers}\``, inline: true },
                            { name: "Canal de Voz", value: `🔊 ${newState.channel.name}`, inline: true },
                            { name: "Entrou por", value: `${newState.member}`, inline: true },
                            { name: "Quantidade na Fila", value: `🎶 \`${totalSongs} músicas\``, inline: true }
                        )
                        .setFooter(ee.footertext, ee.footericon)
                        .setTimestamp();
                    
                    logChannel.send({ embeds: [embed] }).catch(() => {});
                }
            }
            return;
        }
        return;
    }
    
    // Usuário/saiu de um canal de voz
    if (oldState.channelId && !newState.channelId) {
        return;
    }
    
    // Movendo entre canais
    if (oldState.channelId && newState.channelId) {
        if(newState.channel.type == "GUILD_STAGE_VOICE" && newState.guild.me.voice.suppress){
            try{
                await newState.guild.me.voice.setSuppressed(false);
            }catch (e){
                console.log(String(e).grey);
            }
        }
        return;
    }
}
