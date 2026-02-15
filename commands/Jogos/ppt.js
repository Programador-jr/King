const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const ee = require("../../botconfig/embed.json");

const CHOICES = ["pedra", "papel", "tesoura"];
const WINS = {
  pedra: "tesoura",
  papel: "pedra",
  tesoura: "papel"
};
const CHOICE_EMOJI = {
  pedra: "\u{1FAA8}",
  papel: "\u{1F4C4}",
  tesoura: "\u2702\uFE0F"
};

const BUTTON_IDS = {
  pedra: "ppt_pedra",
  papel: "ppt_papel",
  tesoura: "ppt_tesoura",
  cancelar: "ppt_cancelar"
};

function normalizeChoice(value) {
  const raw = String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  if (raw === "p" || raw === "pedra") return "pedra";
  if (raw === "pa" || raw === "papel") return "papel";
  if (raw === "t" || raw === "tesoura") return "tesoura";
  return null;
}

function resolveResult(userChoice, botChoice) {
  if (userChoice === botChoice) return "Empate!";
  return WINS[userChoice] === botChoice ? "Voce venceu!" : "Voce perdeu!";
}

function buildButtons(disabled = false) {
  return new MessageActionRow().addComponents([
    new MessageButton()
      .setCustomId(BUTTON_IDS.pedra)
      .setLabel("Pedra")
      .setEmoji(CHOICE_EMOJI.pedra)
      .setStyle("SECONDARY")
      .setDisabled(disabled),
    new MessageButton()
      .setCustomId(BUTTON_IDS.papel)
      .setLabel("Papel")
      .setEmoji(CHOICE_EMOJI.papel)
      .setStyle("PRIMARY")
      .setDisabled(disabled),
    new MessageButton()
      .setCustomId(BUTTON_IDS.tesoura)
      .setLabel("Tesoura")
      .setEmoji(CHOICE_EMOJI.tesoura)
      .setStyle("SUCCESS")
      .setDisabled(disabled),
    new MessageButton()
      .setCustomId(BUTTON_IDS.cancelar)
      .setLabel("Cancelar")
      .setStyle("DANGER")
      .setDisabled(disabled)
  ]);
}

module.exports = {
  name: "ppt",
  aliases: ["jokenpo", "pedrapapeltesoura"],
  usage: "ppt",
  description: "Jogue pedra, papel e tesoura contra o bot usando botoes.",
  category: "Jogos",
  cooldown: 3,
  run: async (client, message, args) => {
    const directChoice = normalizeChoice(args[0]);
    if (directChoice) {
      const botChoice = CHOICES[Math.floor(Math.random() * CHOICES.length)];
      const result = resolveResult(directChoice, botChoice);
      const embed = new MessageEmbed()
        .setColor(ee.color)
        .setTitle("Pedra, Papel e Tesoura")
        .addField("Sua jogada", `${CHOICE_EMOJI[directChoice]} \`${directChoice}\``, true)
        .addField("Minha jogada", `${CHOICE_EMOJI[botChoice]} \`${botChoice}\``, true)
        .addField("Resultado", `**${result}**`, false)
        .setFooter(ee.footertext, ee.footericon);
      return message.reply({ embeds: [embed] });
    }

    const introEmbed = new MessageEmbed()
      .setColor(ee.color)
      .setTitle("Pedra, Papel e Tesoura")
      .setDescription("Escolha sua jogada clicando em um botao abaixo.")
      .setFooter(ee.footertext, ee.footericon);

    const gameMessage = await message.reply({
      embeds: [introEmbed],
      components: [buildButtons(false)]
    });

    const collector = gameMessage.createMessageComponentCollector({ time: 30000 });

    collector.on("collect", async (interaction) => {
      if (interaction.user.id !== message.author.id) {
        return interaction.reply({
          content: `${client.allEmojis.x} Apenas quem iniciou o jogo pode usar estes botoes.`,
          ephemeral: true
        }).catch(() => {});
      }

      if (interaction.customId === BUTTON_IDS.cancelar) {
        collector.stop("cancelled");
        return interaction.update({
          embeds: [
            new MessageEmbed()
              .setColor(ee.wrongcolor)
              .setTitle("Pedra, Papel e Tesoura")
              .setDescription("Jogo cancelado.")
              .setFooter(ee.footertext, ee.footericon)
          ],
          components: [buildButtons(true)]
        }).catch(() => {});
      }

      const userChoice = {
        [BUTTON_IDS.pedra]: "pedra",
        [BUTTON_IDS.papel]: "papel",
        [BUTTON_IDS.tesoura]: "tesoura"
      }[interaction.customId];

      if (!userChoice) return interaction.deferUpdate().catch(() => {});

      const botChoice = CHOICES[Math.floor(Math.random() * CHOICES.length)];
      const result = resolveResult(userChoice, botChoice);

      collector.stop("played");
      return interaction.update({
        embeds: [
          new MessageEmbed()
            .setColor(ee.color)
            .setTitle("Pedra, Papel e Tesoura")
            .addField("Sua jogada", `${CHOICE_EMOJI[userChoice]} \`${userChoice}\``, true)
            .addField("Minha jogada", `${CHOICE_EMOJI[botChoice]} \`${botChoice}\``, true)
            .addField("Resultado", `**${result}**`, false)
            .setFooter(ee.footertext, ee.footericon)
        ],
        components: [buildButtons(true)]
      }).catch(() => {});
    });

    collector.on("end", async (_, reason) => {
      if (reason === "played" || reason === "cancelled") return;

      await gameMessage.edit({
        embeds: [
          new MessageEmbed()
            .setColor(ee.wrongcolor)
            .setTitle("Pedra, Papel e Tesoura")
            .setDescription("Tempo esgotado. Rode o comando novamente.")
            .setFooter(ee.footertext, ee.footericon)
        ],
        components: [buildButtons(true)]
      }).catch(() => {});
    });
  }
};
