const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'emojis',
    description: 'View all server emojis',
    guildOnly: true,
    usage: ' ',
    cooldown: 3,
    run:async (client, message, args) => {
        const emojiList = message.guild.emojis.cache.first(e=>e.toString()).join(" ");
        let embed = new MessageEmbed()
        .setColor("#00bfff")
        .setDescription(emojiList)
        message.channel.send(embed)
        if (!emojiList) return message.channel.send("Nenhum emojis personalizado no servidor!");
    },
};