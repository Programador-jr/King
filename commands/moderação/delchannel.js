module.exports = {
    name: 'delchannel',
    description: 'Delete a channel',
    guildOnly: true,
    aliases: ['dchannel'],
    usage: '[mentionChannel/channelId]',
    example: '#pokemon-spawn',
    cooldown: 5,
    run:async (client, message, args) => {
        let ch,chs='';
        let mss=message.content.split(' ');
        if(mss[1]!=null||mss[1]!=undefined){
        for(var i=0;i<mss[1].length;i++){
          let k=mss[1].charAt(i);
         if(k!='<'&&k!='>'&&k!='#')   {chs+=k;}
        }
        try{
            ch=client.channels.get(chs);
        }catch(err){
            message.channel.send("Can\'t find the channel");
        }
        let perms = message.member.permissions;
        let prm = perms.has("MANAGE_CHANNELS");
        if(prm==true){
        try{
        ch.delete();
        message.channel.send(`The channel **#${ch.name}** has been deleted by ${message.author.username}`);
        }catch(err){
        message.channel.send('Can\'t delete the channel');
        }
        }else{
        message.channel.send(`${message.author} you don\'t have the permission to delete channels`);
        }}
    },
};