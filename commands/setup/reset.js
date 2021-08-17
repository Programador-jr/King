const functions = require("../../functions")
const config = require("../../config.json")
module.exports = {
  name: "reset",
  aliases: ["hardreset"],
  category: "setup",
  description: "Redefine / exclui todas as configurações, bem como o prefixo!",
  usage: "reset",
  run: async (client, message, args) => {
    if (message.member.guild.owner.id !== message.author.id) return functions.embedbuilder(client, "null", message, config.colors.no, "RESET", `❌ Você não tem permissão para este comando! * Apenas o proprietário do servidor*`)
    let themsg = await message.reply("Tem certeza de que deseja redefinir todas as configurações? || (* Responder com: * ** __ `sim`__**)||")
    const filter = m => m.author.id === message.author.id;
    themsg.channel.awaitMessages(filter, {
        max: 1,
        time: 600000,
        errors: ['time']
      })
      .then(collected => {
        if (collected === "sim") {
          client.settings.delete(message.guild.id, "prefix");

          client.settings.delete(message.guild.id, "djroles");

          client.settings.delete(message.guild.id, "playingembed");

          client.settings.delete(message.guild.id, "playingchannel");

          client.settings.delete(message.guild.id, "botchannel");

          client.custom.delete(message.guild.id, "playlists");

          client.custom.ensure(message.guild.id, {
            playlists: [],
          });
          client.settings.ensure(message.guild.id, {
            prefix: config.prefix,
            djroles: [],
            playingembed: "",
            playingchannel: "",
            botchannel: [],
          });
          message.reply("REINICIALIZEU TUDO COM SUCESSO")
        }
      }).catch(error => {
        message.reply("CANCELADO CAUSA: NÃO É A PALAVRA CERTA / TEMPO ESGOTADO!")
      })

  }
};
/**
 * @INFO
 * Bot Coded by Tomato#6966 | https://github.com/Tomato6966/discord-js-lavalink-Music-Bot-erela-js
 * @INFO
 * Work for Milrato Development | https://milrato.eu
 * @INFO
 * Please mention Him / Milrato Development, when using this Code!
 * @INFO
 */
