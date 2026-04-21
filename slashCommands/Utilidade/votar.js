const { runSlashCommand } = require("../../handlers/slashCommandUtils");

module.exports = {
  name: "votar",
  description: "Mostra o link para votar no bot no Top.gg.",
  options: [],
  runSlash: async (client, interaction) => {
    return runSlashCommand(client, interaction, "votar", []);
  }
};
