const Discord = require("discord.js");

module.exports = {
  name: "ban",
  category: "moderação",
	aliases:["banir"],
  description: "Banir qualquer pessoa do servidor",
  usage: "ban <@user> <motivo>",
  run: async (client, message, args) => {
    
		if(!message.member.hasPermission("BAN_MEMBERS")) return message.channel.send(new Discord.MessageEmbed()
		.setColor('#ff0000')
		.setTitle('Você não tem permissão para usar isto!')
		);

        if(!message.guild.me.hasPermission("BAN_MEMBERS")) return message.channel.send(new Discord.MessageEmbed()
		.setColor('#ff0000')
		.setTitle('Eu não tenho as permissões corretas')
				);

        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);

        if(!args[0]) return message.channel.send(new Discord.MessageEmbed()
		.setColor('#ff0000')
		.setTitle('Por favor especifique um usuário')
				);

        if(!member) return message.channel.send(new Discord.MessageEmbed()
		.setColor('#ff0000')
		.setTitle('Eu não encontrei este usuário.')
				);

        if(!member.bannable) return message.channel.send(new Discord.MessageEmbed()
				.setColor('#ff0000')
				.setTitle('Eu não posso banir este usuário ele possui um cargo maior que o meu <:pepe_sad:796248285525704705>')
				);

        if(member.id === message.author.id) return message.channel.send(new Discord.MessageEmbed()
		.setColor('#ff0000')
		.setTitle('Seu idiota! Você não pode banir a si mesmo! -_-')
				);

        let banReason = args.slice(1).join(" ");

        if(!banReason) banReason = 'Motivo não especificado';

        member.ban({ reason: banReason })
            .catch(err => {
                if(err) return message.channel.send(new Discord.MessageEmbed()
		.setColor('#ff0000')
		.setTitle(`Algo deu errado ao expulsar este usuário ${err}`)
						)});
						

        const banembed = new Discord.MessageEmbed()
            .setTitle('<a:ban2:808406916568711208> Alguém quebrou as regras...')
						.setColor('#00bfff')
            .setThumbnail(member.user.displayAvatarURL())
            .addField('Usuário banido', member)
            .addField('Punido por', message.author)
            .addField('Motivo', banReason)
            .setFooter('Tempo de kick', client.user.displayAvatarURL())
            .setTimestamp()

        message.channel.send(banembed);
  }
}