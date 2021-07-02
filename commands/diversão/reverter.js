module.exports = {
    name: "reverter",
    usage: "reverso <texto>",
    description: "Inverta as palavras desejadas",
    category: "diversão",
    timeout: 5,
    alises: ["reverso"],
    run: async(bot, message, args) => {
        const text = args.join();
        if(!text) return message.channel.send("Por favor forneça uma palavra.")
        if(text.length < 1) return message.channel.send("IDIOTA, COMO POSSO REVERTER 1 PALAVRA? -_-")
        const converted = text.split('').reverse().join('');
        message.channel.send(`\u180E${converted}`);
    },
};