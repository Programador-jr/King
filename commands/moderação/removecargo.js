const discord = require('discord.js')

module.exports = {
    name : "removecargo",
		aliases:["removercargo", "removerole"],
		usage:"removecargo <@user> <@cargo>",
		category:"moderação",
		description:"Retira um cargo do usuario mencionado",
    run : async(client, message, args) => {
        //permite usar parâmetros (opcional)
        /**
         * @param {Message} message
         */
        //então, primeiro vamos verificar se o autor da mensagem tem permissões 
				//esta linha significa que se o autor não tiver permissão para gerenciar funções ele irá parar o processo e enviar o seguinte texto
        if(!message.member.hasPermission("MANAGE_ROLES")) return message.channel.send('Você não tem permissões de gerênciar cargos!')
        //em seguida, definimos algumas variáveis
        const target = message.mentions.members.first() //membro = menções
        if(!target) return message.channel.send('Nenhum membro especificado') //quando nenhum membro é pingado
        const role = message.mentions.roles.first() // cargo = menções
        if(!role) return message.channel.send('Nenhum membro especificado') //quando nenhuma função é especificada ou pingada
        //agora o código!
        await target.roles.remove(role) //removendo a função para o usuário
        message.channel.send(`${target.user.username} cargo removido!`) //isso é opcional e editável
    }
}