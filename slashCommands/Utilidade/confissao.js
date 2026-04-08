const confessionCommand = require("../../commands/Utilidade/confissão");

module.exports = {
  name: "confissão",
  description: "Envie uma confissão anônima.",
  runSlash: async (client, interaction) => {
    await confessionCommand.runSlash(client, interaction);
  }
};
