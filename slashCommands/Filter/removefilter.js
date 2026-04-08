const { runSlashCommand, buildMentions } = require("../../handlers/slashCommandUtils");

module.exports = {
  name: "removefilter",
  description: "Remove filtros da fila.",
  options: [
  {
    "String": {
      "name": "filtros",
      "description": "Nomes separados por espaco",
      "required": true
    }
  }
],
  runSlash: async (client, interaction) => {
    const raw = interaction.options.getString("filtros") || "";
    const args = raw.trim() ? raw.trim().split(/\s+/) : [];
    const mentions = buildMentions();
    return runSlashCommand(client, interaction, "removefilter", args, mentions);
  }
};
