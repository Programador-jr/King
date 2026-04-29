const { MessageActionRow, MessageButton } = require("discord.js");
const {
  emojis,
  ee,
  normalizeText,
  buildCasinoEmbed,
  parseBet,
  getUserData,
  applyGameResult,
  formatAmount,
  ensureCasinoSettings,
  validateBetAmount,
  getRemainingCooldown,
  setCasinoCooldown,
  logCasinoEvent,
  promptForText,
  registerCasinoSession,
  endCasinoSession,
  getActiveCasinoSession,
  createInvalidBetEmbed,
  createInsufficientFundsEmbed,
  createBetLimitEmbed,
  createCooldownEmbed,
  createSessionBusyEmbed
} = require("../../handlers/casinoUtils");

const STRATEGIES = {
  seguro: 16,
  padrao: 17,
  agressivo: 18
};

function drawCard() {
  const deck = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  return deck[Math.floor(Math.random() * deck.length)];
}

function handValue(hand) {
  let total = 0;
  let aces = 0;

  for (const card of hand) {
    if (card === "A") {
      total += 11;
      aces++;
    } else if (["K", "Q", "J"].includes(card)) {
      total += 10;
    } else {
      total += parseInt(card, 10);
    }
  }

  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }

  return total;
}

function formatHand(hand, hidden = false) {
  if (!hidden) return hand.join(" ");
  return [hand[0], "??"].join(" ");
}

function buildControls(customPrefix, disabled = false, canDouble = true) {
  return [
    new MessageActionRow().addComponents(
      new MessageButton().setCustomId(`${customPrefix}:hit`).setLabel("Comprar").setStyle("PRIMARY").setDisabled(disabled),
      new MessageButton().setCustomId(`${customPrefix}:stand`).setLabel("Parar").setStyle("SUCCESS").setDisabled(disabled),
      new MessageButton().setCustomId(`${customPrefix}:double`).setLabel("Dobrar").setStyle("SECONDARY").setDisabled(disabled || !canDouble),
      new MessageButton().setCustomId(`${customPrefix}:cancel`).setLabel("Cancelar").setStyle("DANGER").setDisabled(disabled)
    )
  ];
}

function buildStrategyButtons(customPrefix, disabled = false) {
  return [
    new MessageActionRow().addComponents(
      new MessageButton().setCustomId(`${customPrefix}:seguro`).setLabel("Seguro").setStyle("SUCCESS").setDisabled(disabled),
      new MessageButton().setCustomId(`${customPrefix}:padrao`).setLabel("Padrao").setStyle("PRIMARY").setDisabled(disabled),
      new MessageButton().setCustomId(`${customPrefix}:agressivo`).setLabel("Agressivo").setStyle("DANGER").setDisabled(disabled),
      new MessageButton().setCustomId(`${customPrefix}:cancel`).setLabel("Cancelar").setStyle("SECONDARY").setDisabled(disabled)
    )
  ];
}

function createEmbed(user, state, revealDealer = false, finalText = null) {
  const playerTotal = handValue(state.playerHand);
  const dealerTotal = revealDealer ? handValue(state.dealerHand) : handValue([state.dealerHand[0]]);

  return buildCasinoEmbed(user, state.color || ee.color)
    .setTitle("🃏 Blackjack")
    .setDescription(finalText || "Controle sua mao usando os botoes abaixo.")
    .addField(`Sua mao (${playerTotal})`, formatHand(state.playerHand), true)
    .addField(`Banca (${dealerTotal}${revealDealer ? "" : "+"})`, formatHand(state.dealerHand, !revealDealer), true)
    .addField("Aposta atual", formatAmount(state.bet), true)
    .addField("Estrategia", `${state.strategy} (parada sugerida em ${STRATEGIES[state.strategy]})`, false);
}

function settleGame(state) {
  while (handValue(state.dealerHand) < 17) {
    state.dealerHand.push(drawCard());
  }

  const playerTotal = handValue(state.playerHand);
  const dealerTotal = handValue(state.dealerHand);
  const playerNatural = state.playerHand.length === 2 && playerTotal === 21;
  const dealerNatural = state.dealerHand.length === 2 && dealerTotal === 21;

  let payout = 0;
  let netChange = -state.bet;
  let outcome = "loss";
  let reason = "A banca venceu.";

  if (playerNatural && !dealerNatural) {
    payout = Math.floor(state.bet * 2.5);
    netChange = payout - state.bet;
    outcome = "win";
    reason = "Blackjack natural. Pagamento 3:2.";
  } else if (playerTotal > 21) {
    reason = "Voce estourou 21.";
  } else if (dealerTotal > 21 || playerTotal > dealerTotal) {
    payout = state.bet * 2;
    netChange = payout - state.bet;
    outcome = "win";
    reason = dealerTotal > 21 ? "A banca estourou." : "Sua mao venceu a banca.";
  } else if (playerTotal === dealerTotal) {
    payout = state.bet;
    netChange = 0;
    outcome = "push";
    reason = "Empate. A aposta foi devolvida.";
  }

  return { payout, netChange, outcome, reason };
}

async function resolveBet(message, args, settings, userData) {
  if (args[0]) {
    const amount = parseBet(args[0], userData.coins);
    return { ok: !!amount, amount };
  }

  return promptForText(
    message,
    {
      embeds: [
        buildCasinoEmbed(message.author)
          .setTitle("🃏 Blackjack")
          .setDescription(
            [
              "Qual sera o valor da aposta?",
              `Aposta minima: ${formatAmount(settings.casinoMinBet)}`,
              `Aposta maxima: ${formatAmount(settings.casinoMaxBet)}`,
              `Seu saldo: ${formatAmount(userData.coins)}`
            ].join("\n")
          )
      ]
    },
    (content) => {
      const amount = parseBet(content, userData.coins);
      if (!amount) return { ok: false, message: "Envie uma aposta valida usando numero inteiro ou `all`." };
      return { ok: true, value: amount };
    }
  ).then((result) => result.ok ? { ok: true, amount: result.value } : result);
}

async function resolveStrategy(message, args) {
  const direct = STRATEGIES[normalizeText(args[1])] ? normalizeText(args[1]) : null;
  if (direct) return { ok: true, strategy: direct };

  const customPrefix = `blackjack-strategy:${message.author.id}:${Date.now()}`;
  const chooser = await message.reply({
    embeds: [
      buildCasinoEmbed(message.author)
        .setTitle("🃏 Blackjack")
        .setDescription("Qual estilo de mesa voce quer usar?\nSeguro: para cedo.\nPadrao: equilibrio.\nAgressivo: compra mais.")
    ],
    components: buildStrategyButtons(customPrefix, false)
  });

  const interaction = await chooser.awaitMessageComponent({
    filter: (i) => i.user.id === message.author.id,
    time: 60000
  }).catch(() => null);

  if (!interaction) {
    await chooser.edit({
      embeds: [
        buildCasinoEmbed(message.author, ee.wrongcolor)
          .setTitle(`${emojis.x} Tempo esgotado`)
          .setDescription("A escolha da estrategia expirou.")
      ],
      components: buildStrategyButtons(customPrefix, true)
    }).catch(() => null);
    return { ok: false, reason: "timeout" };
  }

  const choice = interaction.customId.split(":").pop();
  if (choice === "cancel") {
    await interaction.update({
      embeds: [
        buildCasinoEmbed(message.author, ee.wrongcolor)
          .setTitle("🃏 Blackjack cancelado")
          .setDescription("A mesa foi cancelada antes da primeira mao.")
      ],
      components: buildStrategyButtons(customPrefix, true)
    }).catch(() => null);
    return { ok: false, reason: "cancelled" };
  }

  await interaction.update({
    embeds: [
      buildCasinoEmbed(message.author)
        .setTitle("🃏 Blackjack")
        .setDescription(`Estrategia **${choice}** selecionada.`)
    ],
    components: buildStrategyButtons(customPrefix, true)
  }).catch(() => null);

  return { ok: true, strategy: choice };
}

module.exports = {
  name: "blackjack",
  aliases: ["bj", "vinteeum", "21"],
  category: "Cassino",
  description: "Jogue blackjack contra a banca com controles interativos.",
  usage: "blackjack [aposta] [seguro|padrao|agressivo]",
  cooldown: 1,
  run: async (client, message, args, _plusArgs, _member, _text, default_prefix) => {
    const prefix = default_prefix || client?.settings?.get(message.guild?.id, "prefix") || client?.config?.prefix || "!";
    const settings = ensureCasinoSettings(client, message.guild?.id);
    const userData = await getUserData(message.author.id);
    const session = getActiveCasinoSession(message.author.id);
    if (session) {
      return message.reply({ embeds: [createSessionBusyEmbed(message.author, session)] });
    }
    if (!registerCasinoSession(message.author.id, "blackjack")) {
      return message.reply({ embeds: [createSessionBusyEmbed(message.author, getActiveCasinoSession(message.author.id))] });
    }

    try {
      const amountResult = await resolveBet(message, args, settings, userData);
      if (!amountResult.ok) {
        if (amountResult.reason === "timeout" || amountResult.reason === "invalid") return;
        return message.reply({ embeds: [createInvalidBetEmbed(message.author, prefix, userData.coins, settings)] });
      }

      const amount = amountResult.amount;
      const validation = validateBetAmount(amount, userData.coins, settings);
      if (!validation.ok) {
        if (validation.code === "funds") {
          return message.reply({ embeds: [createInsufficientFundsEmbed(message.author, amount, userData.coins)] });
        }
        const embed = validation.code === "invalid"
          ? createInvalidBetEmbed(message.author, prefix, userData.coins, settings)
          : createBetLimitEmbed(message.author, prefix, settings, validation.code, amount);
        await logCasinoEvent(client, message, {
          userId: message.author.id,
          game: "blackjack",
          bet: amount,
          payout: 0,
          netChange: 0,
          outcome: "blocked",
          reason: `Aposta bloqueada por regra: ${validation.code}`
        });
        return message.reply({ embeds: [embed] });
      }

      const remainingCooldown = getRemainingCooldown(message.author.id, "blackjack");
      if (remainingCooldown > 0) {
        return message.reply({ embeds: [createCooldownEmbed(message.author, remainingCooldown)] });
      }

      const strategyResult = await resolveStrategy(message, args);
      if (!strategyResult.ok) return;
      setCasinoCooldown(message.author.id, "blackjack", settings.casinoCooldownSeconds);

      const state = {
        bet: amount,
        balance: userData.coins,
        strategy: strategyResult.strategy,
        playerHand: [drawCard(), drawCard()],
        dealerHand: [drawCard(), drawCard()],
        color: ee.color
      };

      while (handValue(state.playerHand) < STRATEGIES[state.strategy] && handValue(state.playerHand) < 12) {
        state.playerHand.push(drawCard());
      }

      const customPrefix = `blackjack:${message.author.id}:${Date.now()}`;
      const canDouble = userData.coins >= amount * 2;
      const gameMessage = await message.reply({
        embeds: [createEmbed(message.author, state, false)],
        components: buildControls(customPrefix, false, canDouble)
      });

      const collector = gameMessage.createMessageComponentCollector({ time: 90000 });
      const collectorDone = new Promise((resolve) => collector.on("end", () => resolve()));
      let finished = false;

      const finalize = async () => {
        if (finished) return;
        finished = true;
        const result = settleGame(state);
        const newBalance = await applyGameResult(message.author.id, state.balance, result.netChange);
        state.color = result.netChange >= 0 ? ee.color : ee.wrongcolor;

        await gameMessage.edit({
          embeds: [
            createEmbed(
              message.author,
              state,
              true,
              `${result.reason}\nPremio: ${result.payout > 0 ? formatAmount(result.payout) : `**0** ${emojis.King_Coin}`}\nSaldo atual: ${formatAmount(newBalance)}`
            )
          ],
          components: buildControls(customPrefix, true, false)
        }).catch(() => null);

        await logCasinoEvent(client, message, {
          userId: message.author.id,
          game: "blackjack",
          bet: state.bet,
          payout: result.payout,
          netChange: result.netChange,
          outcome: result.outcome,
          reason: result.reason,
          metadata: {
            strategy: state.strategy,
            playerHand: state.playerHand,
            dealerHand: state.dealerHand
          }
        });
      };

      collector.on("collect", async (interaction) => {
        if (interaction.user.id !== message.author.id) {
          return interaction.reply({ content: `${emojis.x} Apenas quem iniciou pode jogar esta mesa.`, flags: 64 }).catch(() => null);
        }

        const action = interaction.customId.split(":").pop();
        if (finished) return interaction.deferUpdate().catch(() => null);

        if (action === "cancel") {
          finished = true;
          collector.stop("cancelled");
          await interaction.update({
            embeds: [
              createEmbed(message.author, state, false, "Mesa cancelada antes do resultado final.").setColor(ee.wrongcolor)
            ],
            components: buildControls(customPrefix, true, false)
          }).catch(() => null);

          await logCasinoEvent(client, message, {
            userId: message.author.id,
            game: "blackjack",
            bet: state.bet,
            payout: 0,
            netChange: 0,
            outcome: "cancelled",
            reason: "Partida cancelada pelo usuario.",
            metadata: {
              strategy: state.strategy
            }
          });
          return;
        }

        if (action === "double" && userData.coins >= state.bet * 2) {
          state.bet *= 2;
          state.playerHand.push(drawCard());
          collector.stop("finished");
          await interaction.deferUpdate().catch(() => null);
          return finalize();
        }

        if (action === "hit") {
          state.playerHand.push(drawCard());
          if (handValue(state.playerHand) > 21) {
            collector.stop("finished");
            await interaction.deferUpdate().catch(() => null);
            return finalize();
          }

          return interaction.update({
            embeds: [createEmbed(message.author, state, false)],
            components: buildControls(customPrefix, false, userData.coins >= state.bet * 2)
          }).catch(() => null);
        }

        collector.stop("finished");
        await interaction.deferUpdate().catch(() => null);
        return finalize();
      });

      collector.on("end", async (_collected, reason) => {
        if (finished || reason === "finished" || reason === "cancelled") return;
        finished = true;
        await gameMessage.edit({
          embeds: [
            createEmbed(message.author, state, false, "Tempo esgotado. A mesa foi encerrada sem resultado.").setColor(ee.wrongcolor)
          ],
          components: buildControls(customPrefix, true, false)
        }).catch(() => null);

        await logCasinoEvent(client, message, {
          userId: message.author.id,
          game: "blackjack",
          bet: state.bet,
          payout: 0,
          netChange: 0,
          outcome: "cancelled",
          reason: "Partida encerrada por tempo.",
          metadata: {
            strategy: state.strategy
          }
        });
      });
      await collectorDone;
    } finally {
      endCasinoSession(message.author.id);
    }
  }
};
