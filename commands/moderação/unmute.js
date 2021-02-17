const { Message, MessageEmbed } = require('discord.js')

module.exports=  {
    name : "unmute",
		category: "moderação",
		usage: "unmute <@user>",
		aliases:["desmutar", "desilenciar"],
		description: "Desmutar um membro do servidor", 
    /**
     * @param {Message} message
     */
    run : async(client, message, args) => {
        const Member = message.mentions.members.first() || message.guild.members.cache.get(args[0])

								if(!args[0]) return message.channel.send('Por favor marque um membro para que eu possa desilenciar')

        if(!Member) return message.channel.send('Membro não encontrado')

        const role = message.guild.roles.cache.find(r => r.name.toLowerCase() === 'mutado');

        await Member.roles.remove(role)

        message.channel.send(new MessageEmbed()
				.setColor('GREEN')
				.setTitle(`${Member.displayName} Pode falar novamente 🔊`)
				);
    }
}