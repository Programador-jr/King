module.exports = {
    name: "limpar",
		usage: "limpar <valor>",
		aliases: ["apagar", "clean"],
		description: "Apague até  mensagens de um canal",
    category: "moderação",
    run: async (client, message, args) => {

    if (message.deletable) {
        message.delete();
    }

    if (!message.member.hasPermission("MANAGE_MESSAGES")) {
        return message.reply("Você é fraco, lhe falta permissão de `Gerenciar Mensagens` para usar esse comando!").then(m => m.delete(5000));
    }

    if (isNaN(args[0]) || parseInt(args[0]) <= 0) {
        return message.reply("Forneça o número de mensagens a serem excluídas").then(m => m.delete(5000));
    }

    let deleteAmount;
    if (parseInt(args[0]) > 100) {
        deleteAmount = 100;
    } else {
        deleteAmount = parseInt(args[0]);
    }
		
    message.channel.bulkDelete(deleteAmount, true)
		message.channel.send(`**${args[0]} mensagens limpas nesse chat!**`).then(msg => msg.delete({timeout: 5000}))
    .catch(err => message.reply(`Não foi possível deletar mensagens devido a: ${err}`));
    
  }
};