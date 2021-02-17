const {MessageEmbed} = require('discord.js');

module.exports = {
    name: "unlock",
    aliases: ['desbloquear', "destravar"],

    run: async(client, message, args) => {
        if(!message.member.permissions.has("MANAGE_CHANNELS"))
       
        return message.reply(new MessageEmbed()
				.setColor('#ff0000')
				.setTitle('Você precisa da permissão `Gerenciar canais` para fazer isso!')
				);
        const role = await message.guild.roles.cache.find(x => x.name === "@everyone"); 
            await message.channel.updateOverwrite(role, {
              'SEND_MESSAGES': true,
              'EMBED_LINKS': true,
              'ATTACH_FILES': true,
              'ADD_REACTIONS': true
            });
            message.channel.send(new MessageEmbed()
						.setColor('GREEN')
						.setTitle(':unlock: **|** Canal desbloqueado com sucesso!')
						);

        }
        } 
