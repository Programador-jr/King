const { runSlashCommand, buildMentions } = require("../../handlers/slashCommandUtils");

module.exports = {
  name: "ban",
  description: "Bane um usuario de usar o bot globalmente.",
  options: [
    {
      User: {
        name: "usuario",
        description: "Usuario a banir do bot",
        required: true
      }
    },
    {
      String: {
        name: "tempo",
        description: "Duracao (ex: 30m, 12h, 7d, 2w, permanente)",
        required: false
      }
    },
    {
      String: {
        name: "motivo",
        description: "Motivo do banimento",
        required: false
      }
    }
  ],
  runSlash: async (client, interaction) => {
    const user = interaction.options.getUser("usuario");
    const member = interaction.options.getMember("usuario");
    const tempo = interaction.options.getString("tempo");
    const reason = interaction.options.getString("motivo");
    const args = [user?.id, tempo, reason].filter(Boolean);
    const mentions = buildMentions({ users: [user], members: [member] });
    return runSlashCommand(client, interaction, "devban", args, mentions);
  }
};
