const {Message, MessageEmbed}= require('discord.js')
const ms = require('ms')

module.exports = {
    name : "tempmute",
		usage: "tempmute <@user> <tempo>",
		category: "moderação",
		aliases:["timemute", "tempomutado"],
		description: "Defina o tempo que um membro vai permanecer mutado",
    /**
     * @param {Message} message
     */
    run : async(client, message, args) => {
        if(!message.member.hasPermission('MANAGE_MESSAGES')) return message.channel.send('Você não tem permissão para usar este comando')
				if(!args[0]) return message.channel.send('Por favor marque um membro para que eu possa silenciar')
        const Member = message.mentions.members.first() || message.guild.members.cache.get(args[0])
        const time = args[1]
        if(!Member) return message.channel.send('Membro não encontrado.')
        if(!time) return message.channel.send('Por favor, especifique um horário.')
        const role = message.guild.roles.cache.find(role => role.name.toLowerCase() === 'mutado')
        if(!role) {
            try {
                message.channel.send('Cargo `mutado` não encontrada, tentando criar um cargo `mutado`.')

                let muterole = await message.guild.roles.create({
                    data : {
                        name : 'mutado',
                        permissions: []
                    }
                });
                message.guild.channels.cache.filter(c => c.type === 'text').forEach(async (channel, id) => {
                    await channel.createOverwrite(muterole, {
              'SEND_MESSAGES': false,
              'EMBED_LINKS': false,
              'ATTACH_FILES': false,
              'ADD_REACTIONS': false,
              'SPEAK': false
                    })
                });
                message.channel.send('O cargo `mutado` foi criada com sucesso.')
            } catch (error) {
                console.log(error)
            }
        };
        let role2 = message.guild.roles.cache.find(r => r.name.toLowerCase() === 'mutado')
        if(Member.roles.cache.has(role2.id)) return message.channel.send(`${Member.displayName} já foi silenciado.`)
        await Member.roles.add(role2)
        message.channel.send(new MessageEmbed()
				.setColor("#ff0000")
				.setTitle(`${Member.displayName} está sem voz 🔇`)
				);

        setTimeout(async () => {
            await Member.roles.remove(role2)
            message.channel.send(new MessageEmbed()
						.setColor('GREEN')
						.setTitle(`${Member.displayName} pode falar novamente 🔊`)
						);
        }, ms(time))
    }
}