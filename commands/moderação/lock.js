const {MessageEmbed} = require('discord.js');

module.exports = {
    name: "lock",
    aliases: ['lock', 'trancar', 'bloquear'],
		category:"moderação",
    run: async (client, message, args) => {
        if(!message.member.permissions.has("MANAGE_CHANNELS"))
       
        return message.reply(new MessageEmbed()
				.setColor('#ff0000')
				.setTitle('Você precisa da permissão `Gerenciar canais` para fazer isso!')
				);
        const role = await message.guild.roles.cache.find(x => x.name === "@everyone"); 
        
            await message.channel.updateOverwrite(role, {
              'SEND_MESSAGES': false,
              'EMBED_LINKS': false,
              'ATTACH_FILES': false,
              'ADD_REACTIONS': false
            });
            message.channel.send(new MessageEmbed()
						.setColor("#ff0000")
						.setTitle(`:lock: **|** Canal bloqueado com sucesso!`)
						);

        
        }

    }