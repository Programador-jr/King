const functions = require("../../functions")
const config = require("../../config.json")
module.exports = {
  name: "custom",
  category: "MUSIC COMMANDS",
  aliases: [""],
  useage: "custom <add/remove/play/reset> [LINK]",
  description: "Adicionar / Remover / Reproduzir uma lista de reprodução personalizada!",

  run: async (client, message, args) => {


    let playlist = client.custom.get(message.guild.id, "playlists");
    if (args[0] === "add" || args[0] === "set" || args[0] === "use") {
      if (!args[1].includes("http")) return message.reply("Ah não! Isso não é um link, por exemplo: https://www.youtube.com/watch?v=dQw4w9WgXcQ")
      if (playlist.includes(args[1])) return message.reply("Ah não! A música já existe na lista de reprodução do servidor, SEM CANÇÕES DUPLAS!")
      client.custom.push(message.guild.id, args[1], "playlists");
      return functions.embedbuilder(client, 5000, message, config.colors.yes, "ADICIONOU COM SUCESSO UMA CANÇÃO À PLAYLIST DO SERVIDOR" + `
      Há agora: \`${playlist.length}\` canções na lista de reprodução do servidor`)
    }
    if (args[0] === "reset" || args[0] === "res" || args[0] === "resetar") {
      let themsg = await message.reply("Você realmente deseja redefinir a lista de reprodução do servidor? || (* Responder com:* **__`sim`__**)||")
      const filter = m => m.author.id === message.author.id;
      themsg.channel.awaitMessages(filter, {
          max: 1,
          time: 600000,
          errors: ['time']
        })
        .then(async collected => {
          if (collected === "sim") {
            try {
              await client.custom.delete(message.guild.id, "playlists");
            } catch {
              /* */ }
            client.custom.ensure(message.guild.id, {
              playlists: [],
            });
            await message.reply("REINICIADA COM SUCESSO A PLAYLIST PERSONALIZADA DO SERVIDOR")
          }
        }).catch(error => {
          message.reply("CANCELADO CAUSA NÃO É A PALAVRA CERTA / O TEMPO ESGOTADO!")
        })
    }
    if (args[0] === "play" || args[0] === "p" || args[0] === "ouvir" || args[0] === "listen") {
      client.distube.playCustomPlaylist(message, playlist, {
        name: message.author.username + "'s Playlist"
      });
      return functions.embedbuilder(client, 5000, message, config.colors.yes, "TOCANDO LISTA DE REPRODUÇÃO PERSONALIZADA")
    }
    if (args[0] === "remover" || args[0] === "deletar" || args[0] === "del" || args[0] === "rem" || args[0] == "apagar") {
      if (!args[1]) return message.reply("Por favor, adicione um link de música que você deseja adicionar, obrigado!");
      if (!playlist.includes(args[1])) return message.reply("Ah não! A música não existe, na lista de reprodução do servidor, certifique-se de que é o mesmo link!")

      client.custom.remove(message.guild.id, args[1], "playlists");
      return functions.embedbuilder(client, 5000, message, config.colors.yes, "REMOVEU A CANÇÃO COM SUCESSO DA PLAYLIST DO SERVIDOR")
    } else {
      let string = playlist.join("\n");
      customplay(message, string, playlist[0])
      functions.embedbuilder(client, "null", message, config.colors.yes, `Existe ${playlist.length} Músicas na lista de reprodução do servidor!`, )
      return functions.embedbuilder(client, "null", message, config.colors.yes, `Sintaxe do comando: `," + custom <adicionar / remover / reproduzir> [Link]")
    }
  }
};
async function customplay(message, string, cursong) {
  let currentPage = 0;
  const embeds = functions.customplaylistembed(client, message, string, cursong);

  const queueEmbed = await message.channel.send(
    `**Pagina atual - ${currentPage + 1}/${embeds.length}**`,
    embeds[currentPage]
  );

  try {
    await queueEmbed.react("⬅️");
    await queueEmbed.react("➡️");
    await queueEmbed.react("⏹");
  } catch (error) {
    console.error(error);
    functions.embedbuilder(client, 5000, message, config.colors.no, "ERROR: ", "```" + error.toString().substr(0, 100) + "```" + "\n\n**Erro enviado ao meu proprietário!**")
    functions.errorbuilder(error.stack.toString().substr(0, 1000))
  }

  const filter = (reaction, user) => ["⬅️", "⏹", "➡️"].includes(reaction.emoji.name) && message.author.id === user.id;
  const collector = queueEmbed.createReactionCollector(filter, {
    time: 60000
  });

  collector.on("collect", async (reaction, user) => {
    try {
      if (reaction.emoji.name === "⬅️") {
        if (currentPage < embeds.length - 1) {
          currentPage++;
          queueEmbed.edit(`**Pagina atual - ${currentPage + 1}/${embeds.length}**`, embeds[currentPage]);
        }
      } else if (reaction.emoji.name === "➡️") {
        if (currentPage !== 0) {
          --currentPage;
          queueEmbed.edit(`**Pagina atual - ${currentPage + 1}/${embeds.length}**`, embeds[currentPage]);
        }
      } else {
        collector.stop();
        reaction.message.reactions.removeAll();
      }
      await reaction.users.remove(message.author.id);
    } catch (error) {
      functions.embedbuilder(client, 5000, message, config.colors.no, "ERROR: ", "```" + error.toString().substr(0, 100) + "```" + "\n\n**Erro enviado ao meu proprietário!**")
      functions.errorbuilder(error.stack.toString().substr(0, 2000))
    }
  });

}
