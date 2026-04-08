const { runSlashCommand, buildMentions } = require("../../handlers/slashCommandUtils");

module.exports = {
  name: "loop",
  description: "Define o modo de loop.",
  options: [
  {
    "StringChoices": {
      "name": "modo",
      "description": "Modo de loop",
      "required": true,
      "choices": [
        [
          "song",
          "song"
        ],
        [
          "queue",
          "queue"
        ],
        [
          "off",
          "off"
        ]
      ]
    }
  }
],
  runSlash: async (client, interaction) => {
    const value = interaction.options.getString("modo");
    const args = value ? [value] : [];
    const mentions = buildMentions();
    return runSlashCommand(client, interaction, "loop", args, mentions);
  }
};
