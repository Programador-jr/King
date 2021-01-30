const { Message } = require('discord.js')

module.exports = {
    name : 'addcargo',
		usage:"addcargo <@user> <@cargo>",
		description:"Adicione um cargo para um membro do servidor",
		aliases:["addrole", "adicionarcargo", "darcargo"],
    run : async(client, message, args) => {
        //permite usar parâmetros (opcional)
        /**
         * @param {Message} message
         */
        //então, primeiro vamos verificar se o autor da mensagem tem permissões 
				// esta linha significa que se o autor não tiver permissão para gerenciar funções ele irá parar o processo e enviar o seguinte texto
        if(!message.member.hasPermission("MANAGE_ROLES")) return message.channel.send('Você não tem permissão para executar esse comando.')
        //em seguida, definimos algumas variáveis
        const target = message.mentions.members.first() //membro = menções
        if(!target) return message.channel.send('Nenhum usuario especificado') //quando nenhum membro é pingado
        const role = message.mentions.roles.first() // cargos = menções
        if(!role) return message.channel.send('Nenhum cargo especificado') //quando nenhuma função é especificada ou pingada
        //agora o código!
        await target.roles.add(role) // adicionando a função ao usuário
        message.channel.send(`${target.user.username} obteve um cargo`)
    }
}