const functions = require("../../functions")
const config = require("../../config.json")
//Gráficos
let {
  playlist1,
  playlist2,
  playlist3,
  playlist4,
  playlist5,
  playlist6
} = require("../../playlists.json")
module.exports = {
  name: "playlist",
  category: "MUSIC COMMANDS",
  aliases: ["botpl", "botplaylist", "pl"],
  useage: "playlist <Playlist Number>",
  description: "Tocar algumas BOAS listas de reprodução pré-fabricadas!",

  run: async (client, message, args) => {

    if (args[0]) {
      switch (args[0].toLowerCase()) {
        case "1":
          functions.embedbuilder(client, "null", message, config.colors.yes, "Carregando");
          return client.distube.playCustomPlaylist(message, playlist1, {
            name: "Playlist de parada"
          });
          break;
        case "Gráficos":
          functions.embedbuilder(client, "null", message, config.colors.yes, "Carregando");
          return client.distube.playCustomPlaylist(message, playlist1, {
            name: "Playlist de parada"
          });
          break;

        case "2":
          functions.embedbuilder(client, "null", message, config.colors.yes, "Carregando");
          return client.distube.playCustomPlaylist(message, playlist2, {
            name: "Playlist de natal"
          });
          break;
        case "Natal":
          functions.embedbuilder(client, "null", message, config.colors.yes, "Carregando");
          return client.distube.playCustomPlaylist(message, playlist2, {
            name: "Playlist de natal"
          });
          break;

        case "3":
          functions.embedbuilder(client, "null", message, config.colors.yes, "Carregando");
          return client.distube.playCustomPlaylist(message, playlist3, {
            name: "Playlist de jazz"
          });
          break;
        case "jazz":
          functions.embedbuilder(client, "null", message, config.colors.yes, "Carregando");
          return client.distube.playCustomPlaylist(message, playlist3, {
            name: "Playlist de jazz"
          });
          break;

        case "4":
          functions.embedbuilder(client, "null", message, config.colors.yes, "Carregando");
          return client.distube.playCustomPlaylist(message, playlist4, {
            name: "Playlist de Blues"
          });
          break;
        case "blues":
          functions.embedbuilder(client, "null", message, config.colors.yes, "Carregando");
          return client.distube.playCustomPlaylist(message, playlist4, {
            name: "Playlist de Blues"
          });
          break;

        case "5":
          functions.embedbuilder(client, "null", message, config.colors.yes, "Carregando");
          return client.distube.playCustomPlaylist(message, playlist5, {
            name: "Playlist Countre"
          });
          break;
        case "country":
          functions.embedbuilder(client, "null", message, config.colors.yes, "Carregando");
          return client.distube.playCustomPlaylist(message, playlist5, {
            name: "Playlist Countre"
          });
          break;

        case "6":
          functions.embedbuilder(client, "null", message, config.colors.yes, "Carregando");
          return client.distube.playCustomPlaylist(message, playlist6, {
            name: "Playlist rock"
          });
          break;
        case "rock":
          functions.embedbuilder(client, "null", message, config.colors.yes, "Carregando");
          return client.distube.playCustomPlaylist(message, playlist6, {
            name: "Playlist rock"
          });
          break;

        default:
          functions.embedbuilder(client, "null", message, config.colors.no, `Playlists disponíveis:`, "1. Gráficos\n2. Natal\n3. Jazz\n4. Blues\n5. Country\n6. Rock")
          return functions.embedbuilder(client, "null", message, config.colors.no, `Sintaxe do comando: `," + botplaylist <Número da lista de reprodução>")
          break;
      }
    } else {
      functions.embedbuilder(client, "null", message, config.colors.no, `Playlists disponíveis:`, "1. Gráficos\n2. Natal\n3. Jazz\n4. Blues\n5. Country\n6. Rock")
      return functions.embedbuilder(client, "null", message, config.colors.no, `Sintaxe do comando: `," + botplaylist <Número da lista de reprodução>")
    }
  }
};
