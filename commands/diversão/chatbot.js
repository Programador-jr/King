const { chatBot } = require('reconlx') 

module.exports = {
    name : "chatbot",
		aliases: ["chat", "bot"],
		description: "Converse comigo ^-^ ",
		category:"diversão",
    run : async(client, message, args) => {
				if(!args.join("")) return message.channel.send("Inicie uma conversa, que tal começar com um, Oi? | **Por favor evite user acentuações graficas porque meu sistema não considera isso um códico valido 😔**");
        chatBot(message, args.join(" "))
    }
}