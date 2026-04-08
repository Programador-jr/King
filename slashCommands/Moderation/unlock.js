const { runSlashCommand, buildMentions } = require("../../handlers/slashCommandUtils");

module.exports = {
  name: "unlock",
  description: "Destrava o canal atual.",
  options: [
  {
    "String": {
      "name": "motivo",
      "description": "Motivo",
      "required": false
    }
  }
],
  runSlash: async (client, interaction) => {
    const reason = interaction.options.getString("motivo");
    const args = reason ? [reason] : [];
    const mentions = buildMentions();
    return runSlashCommand(client, interaction, "unlock", args, mentions);
  }
};
