module.exports = {
    name: 'addchannel',
    description: 'Create a channel (text, voice, category)',
    guildOnly: true,
    aliases: ['channel'],
    usage: '[channelName, channelType]',
    example: 'pokemon-spawn text',
    cooldown: 5,
    run:async (client, message, args) => {
        let mss=message.content.split(' ');
        let nm=mss[1],ty=mss[2];
        // nm is for name
        // ty is for type

        // all types of channels are :- voice, category and text

        let perms = message.member.permissions;
        let prm = perms.has("MANAGE_CHANNELS");
        if(prm==true){
        try{
            function cl(mssg){
               let sv=message.guild;
               let nn=nm,tu=ty;
               if(tu.toLowerCase()=='voice'||tu.toLowerCase()=='text'||tu.toLowerCase()=='category'){
                  sv.createChannel(nn,tu);
                  message.channel.send("Channel created");
               }
            }
           cl(message);
        }catch(err){
           message.channel.send("Can\'t create the channel");
        }
        }else{
           message.channel.send(`${message.author} you don\'t have the permission to create channels`);
        }
    },
};