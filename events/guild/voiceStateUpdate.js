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
            
            return;
        }
        return;
    }
    
    // Usuário saiu de um canal de voz
    if (oldState.channelId && !newState.channelId) {
        const oldChannel = oldState.channel;
        const guild = oldChannel.guild;
        const botMember = guild.me;
        
        if (!botMember.voice.channel || botMember.voice.channel.id !== oldChannel.id) {
            return;
        }
        
        const voiceChannel = botMember.voice.channel;
        const membersInChannel = voiceChannel.members.filter(m => !m.user.bot);
        
        if (membersInChannel.size === 0) {
            const queue = client.distube.getQueue(guild.id);
            const textChannel = queue?.textChannel;
            
            if (textChannel && typeof textChannel.send === 'function') {
                try {
                    await textChannel.send({
                        content: `💤 **Saindo do canal por estar sozinho...**`
                    }).catch(() => {});
                } catch (e) {
                    console.log(e);
                }
            }
            
            try {
                await queue?.stop();
            } catch (e) {}
            
            try {
                await botMember.voice.disconnect();
            } catch (e) {}
        }
        
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
