const { MessageEmbed } = require("discord.js");
const ee = require("../../botconfig/embed.json");

module.exports = async (client, message) => {
  if (message.author.bot) return;
  if (!message.guild) {
    const confessionCommand = require("../../commands/Utilidade/confissão");
    if (confessionCommand.handleDM) {
      confessionCommand.handleDM(client, message);
    }
  }
};
