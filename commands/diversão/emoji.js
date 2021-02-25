const { RichEmbed } = require("discord.js");

module.exports = {
  name: "emoji",
  category: "info",
  description: "INVITE BOT",
  run: async (client, message, args) => {
  
    try {
        let notAnimated = [];
        let animated = [];
        message.guild.emojis.cache.forEach(async emoji => {
          if (emoji.animated) animated.push(emoji.toString());
          else notAnimated.push(emoji.toString());
        });
        if (!animated[0]) animated = ['None'];
        if (!notAnimated[0]) notAnimated = ['None'];
        message.channel.send('**__ANIMADO  :__**\n' + animated.join(' ') + '\n**__NORMAL:__**\n' + notAnimated.join(' '), {split:true});
      } catch (err) {
        message.channel.send('Foi um erro deles!\n' + err).catch();
      }
      
}
};