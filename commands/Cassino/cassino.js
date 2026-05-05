const { MessageActionRow, MessageButton } = require("discord.js");
const {
  ee,
  emojis,
  buildCasinoEmbed,
  getUserData,
  formatAmount
} = require("../../handlers/casinoUtils");
const { runSlashCommand } = require("../../handlers/slashCommandUtils");

function buildMenuRows(customPrefix, disabled = false) {
  return [
    new MessageActionRow().addComponents(
      new MessageButton().setCustomId(`${customPrefix}:slots`).setLabel("Slots").setStyle("PRIMARY").setEmoji(emojis.casino_slots).setDisabled(disabled),
      new MessageButton().setCustomId(`${customPrefix}:blackjack`).setLabel("Blackjack").setStyle("SUCCESS").setEmoji(emojis.blackjack).setDisabled(disabled),
      new MessageButton().setCustomId(`${customPrefix}:minas`).setLabel("Minas").setStyle("DANGER").setEmoji("💣").setDisabled(disabled),
      new MessageButton().setCustomId(`${customPrefix}:roleta`).setLabel("Roleta").setStyle("SECONDARY").setEmoji("🎡").setDisabled(disabled)
    )
  ];
}

module.exports = {
  name: "cassino",
  aliases: ["casino", "jogosdecassino"],
  category: "Cassino",
  description: "Mostra os jogos de cassino disponiveis.",
  usage: "cassino",
  run: async (client, message, args, _plusArgs, _member, _text, default_prefix) => {
    const prefix = default_prefix || client?.settings?.get(message.guild?.id, "prefix") || client?.config?.prefix || "!";
    const userData = await getUserData(message.author.id);
    const customPrefix = `cassino-menu:${message.author.id}:${Date.now()}`;

    const embed = buildCasinoEmbed(message.author)
      .setTitle(`${emojis.casino_slots} Cassino`)
      .setDescription(
        [
          `\`${prefix}slots [aposta]\``,
          "Se nao enviar aposta, o bot pergunta o valor e gira os slots.",
          "",
          `\`${prefix}blackjack [aposta]\``,
          "A mesa pode perguntar a aposta antes de abrir os botoes da rodada.",
          "",
          `\`${prefix}minas [aposta] [minas]\``,
          "Escolha aposta, numero de minas e jogue num tabuleiro 5x5 de botoes.",
          "",
          `\`${prefix}roleta [aposta] [vermelho|preto|par|impar|0-36]\``,
          "A roleta pode perguntar o valor e depois a escolha da aposta."
        ].join("\n")
      )
      .addField("Seu saldo", formatAmount(userData.coins), true)
      .addField("Painel", "Clique em um botao abaixo para iniciar um jogo imediatamente.", false)
      .addField("Dica", `Use \`${prefix}daily\` para conseguir mais moedas.`, false);

    const menuMessage = await message.reply({
      embeds: [embed],
      components: buildMenuRows(customPrefix, false),
      fetchReply: true
    });

    if (!menuMessage?.createMessageComponentCollector) {
      return menuMessage;
    }

    const collector = menuMessage.createMessageComponentCollector({ time: 120000 });

    collector.on("collect", async (interaction) => {
      if (interaction.user.id !== message.author.id) {
        return interaction.reply({ content: `${emojis.x} Apenas quem abriu o painel pode usar estes botoes.`, flags: 64 }).catch(() => null);
      }

      const game = interaction.customId.split(":").pop();
      collector.stop("selected");

      await interaction.update({
        embeds: [
          buildCasinoEmbed(message.author, ee.color)
            .setTitle(`${emojis.casino_slots} Cassino`)
            .setDescription(`Abrindo **${game}**.`)
        ],
        components: buildMenuRows(customPrefix, true)
      }).catch(() => null);

      return runSlashCommand(client, interaction, game, []);
    });

    collector.on("end", async (_collected, reason) => {
      if (reason === "selected") return;
      await menuMessage.edit({
        embeds: [
          buildCasinoEmbed(message.author, ee.wrongcolor)
            .setTitle(`${emojis.casino_slots} Cassino`)
            .setDescription("O painel expirou. Use o comando novamente para abrir outro.")
            .addField("Seu saldo", formatAmount(userData.coins), true)
        ],
        components: buildMenuRows(customPrefix, true)
      }).catch(() => null);
    });

    return menuMessage;
  }
};
