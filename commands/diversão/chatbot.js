const alexa = require('alexa-bot-api');
var chatbot = new alexa('aw2plm'); 

module.exports = {
    name : "chatbot",
		aliases: ["chat", "bot", "king"],
		description: "Converse comigo ^-^",
		category:"diversão",
    run : async(client, message, args) => {
	if (message.author.bot) return;
	let content = message.content;
	if(!content)return;
	if(!args.join(" ")) return message.channel.send("Inicie uma conversa, que tal começar com um, Oi?")	

	chatbot.getReply(content).then(r => message.channel.send(r));
    }
}
