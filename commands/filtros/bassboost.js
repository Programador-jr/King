const functions = require("../../functions")
const config = require("../../config.json")
const path = require("path");
module.exports = {

  name: path.parse(__filename).name,
  category: "filtros",
  useage: `<${path.parse(__filename).name}>`,
  description: "*Adiciona um filtro chamado" + path.parse(__filename).name,
  run: async (client, message, args) => {
    //if not a dj, return error
    if (functions.check_if_dj(message))
      return functions.embedbuilder(client, 6000, message, config.colors.no, "DJ-ROLE", `<a:declined:876968121116807208> Você não tem permissão para este comando! Você precisa ter: ${functions.check_if_dj(message)}`)

    //If Bot not connected, return error
    if (!message.guild.me.voice.channel) return functions.embedbuilder(client, 3000, message, config.colors.no, "Nada tocando!")

    //if member not connected return error
    if (!message.member.voice.channel) return functions.embedbuilder(client, 5000, message, config.colors.no, "`" + message.author.tag + "`" + " Você deve entrar em um canal de voz")

    //if they are not in the same channel, return error
    if (message.member.voice.channel.id != message.guild.me.voice.channel.id) return functions.embedbuilder(client, 5000, message, config.colors.no, "`" + message.author.tag + "`" + " Você deve entrar no meu canal de voz: " + ` \`${message.guild.me.voice.channel.name ? message.guild.me.voice.channel.name : ""}\``)

    //get queue
    let queue = client.distube.getQueue(message);

    //if no queue return error
    if (!queue) return functions.embedbuilder(client, 3000, message, config.colors.no, "Não há nada tocando!");
    let filter = message.content.slice(config.prefix.length).split(" ")[0];
    if (args[0]) {
      let bassboostfilter = `bassboost${Math.floor(Number(args[0]))}`;
      switch (Math.floor(Number(args[0]))) {
        case 1:
          await client.distube.setFilter(message, bassboostfilter);
          await functions.embedbuilder(client, 3000, message, config.colors.yes, "Adicionando filtro!", `Bassboost com: \`${Math.floor(Number(args[0]))}db Gain\``)
          break;

        case 2:
          await client.distube.setFilter(message, bassboostfilter);
          await functions.embedbuilder(client, 3000, message, config.colors.yes, "Adicionando filtro!", `Bassboost com: \`${Math.floor(Number(args[0]))}db Gain\``)
          break;

        case 3:
          await client.distube.setFilter(message, bassboostfilter);
          await functions.embedbuilder(client, 3000, message, config.colors.yes, "Adicionando filtro!", `Bassboost com: \`${Math.floor(Number(args[0]))}db Gain\``)
          break;

        case 4:
          await client.distube.setFilter(message, bassboostfilter);
          await functions.embedbuilder(client, 3000, message, config.colors.yes, "Adicionando filtro!", `Bassboost com: \`${Math.floor(Number(args[0]))}db Gain\``)
          break;

        case 5:
          await client.distube.setFilter(message, bassboostfilter);
          await functions.embedbuilder(client, 3000, message, config.colors.yes, "Adicionando filtro!", `Bassboost com: \`${Math.floor(Number(args[0]))}db Gain\``)
          break;

        case 6:
          await client.distube.setFilter(message, bassboostfilter);
          await functions.embedbuilder(client, 3000, message, config.colors.yes, "Adicionando filtro!", `Bassboost com: \`${Math.floor(Number(args[0]))}db Gain\``)
          break;

        case 7:
          await client.distube.setFilter(message, bassboostfilter);
          await functions.embedbuilder(client, 3000, message, config.colors.yes, "Adicionando filtro!", `Bassboost com: \`${Math.floor(Number(args[0]))}db Gain\``)
          break;

        case 8:
          await client.distube.setFilter(message, bassboostfilter);
          await functions.embedbuilder(client, 3000, message, config.colors.yes, "Adicionando filtro!", `Bassboost com: \`${Math.floor(Number(args[0]))}db Gain\``)
          break;

        case 9:
          await client.distube.setFilter(message, bassboostfilter);
          await functions.embedbuilder(client, 3000, message, config.colors.yes, "Adicionando filtro!", `Bassboost com: \`${Math.floor(Number(args[0]))}db Gain\``)
          break;

        case 10:
          await client.distube.setFilter(message, bassboostfilter);
          await functions.embedbuilder(client, 3000, message, config.colors.yes, "Adicionando filtro!", `Bassboost com: \`${Math.floor(Number(args[0]))}db Gain\``)
          break;

        case 11:
          await client.distube.setFilter(message, bassboostfilter);
          await functions.embedbuilder(client, 3000, message, config.colors.yes, "Adicionando filtro!", `Bassboost com: \`${Math.floor(Number(args[0]))}db Gain\``)
          break;

        case 12:
          await client.distube.setFilter(message, bassboostfilter);
          await functions.embedbuilder(client, 3000, message, config.colors.yes, "Adicionando filtro!", `Bassboost com: \`${Math.floor(Number(args[0]))}db Gain\``)
          break;

        case 13:
          await client.distube.setFilter(message, bassboostfilter);
          await functions.embedbuilder(client, 3000, message, config.colors.yes, "Adicionando filtro!", `Bassboost com: \`${Math.floor(Number(args[0]))}db Gain\``)
          break;

        case 14:
          await client.distube.setFilter(message, bassboostfilter);
          await functions.embedbuilder(client, 3000, message, config.colors.yes, "Adicionando filtro!", `Bassboost com: \`${Math.floor(Number(args[0]))}db Gain\``)
          break;

        case 15:
          await client.distube.setFilter(message, bassboostfilter);
          await functions.embedbuilder(client, 3000, message, config.colors.yes, "Adicionando filtro!", `Bassboost com: \`${Math.floor(Number(args[0]))}db Gain\``)
          break;

        case 16:
          await client.distube.setFilter(message, bassboostfilter);
          await functions.embedbuilder(client, 3000, message, config.colors.yes, "Adicionando filtro!", `Bassboost com: \`${Math.floor(Number(args[0]))}db Gain\``)
          break;

        case 17:
          await client.distube.setFilter(message, bassboostfilter);
          await functions.embedbuilder(client, 3000, message, config.colors.yes, "Adicionando filtro!", `Bassboost com: \`${Math.floor(Number(args[0]))}db Gain\``)
          break;

        case 18:
          await client.distube.setFilter(message, bassboostfilter);
          await functions.embedbuilder(client, 3000, message, config.colors.yes, "Adicionando filtro!", `Bassboost com: \`${Math.floor(Number(args[0]))}db Gain\``)
          break;

        case 19:
          await client.distube.setFilter(message, bassboostfilter);
          await functions.embedbuilder(client, 3000, message, config.colors.yes, "Adicionando filtro!", `Bassboost com: \`${Math.floor(Number(args[0]))}db Gain\``)
          break;

        case 20:

          await functions.embedbuilder(client, 3000, message, config.colors.yes, "Adicionando filtro!", `Bassboost com: \`${Math.floor(Number(args[0]))}db Gain\``)
          await client.distube.setFilter(message, bassboostfilter);
          break;

        default:
          await functions.embedbuilder(client, 3000, message, config.colors.no, "ERROR", `Bassboost com: \`${Math.floor(Number(args[0]))}db Gain\` DOES NOT WORK!`)
          break;
      }
    } else if (message.content.slice(config.prefix.length).split(" ")[0] === queue.filter) filter = "clear";
    else {
      filter = await client.distube.setFilter(message, filter);
      await functions.embedbuilder(client, 3000, message, config.colors.yes, "Adicionando filtro!", filter)
    }
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
