const { runSlashCommand, buildMentions } = require("../../handlers/slashCommandUtils");

module.exports = {
  name: "lock",
  description: "Trava o canal atual.",
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
    return runSlashCommand(client, interaction, "lock", args, mentions);
  }
};
