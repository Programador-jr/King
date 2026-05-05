const { MessageActionRow, MessageButton } = require("discord.js");
const {
  emojis,
  ee,
  buildCasinoEmbed,
  getCasinoResultColor,
  attachReplayHandler,
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

const naipes = require("../../botconfig/naipes.json");

const BLACKJACK_THUMBNAIL = (() => {
  const emojiId = emojis.blackjack.match(/\d+/)?.[0];
  return emojiId ? `https://cdn.discordapp.com/emojis/${emojiId}.png` : null;
})();

const DECK_VALUES = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

function createBlackjackEmbed(user, color = ee.color) {
  const embed = buildCasinoEmbed(user, color);
  if (BLACKJACK_THUMBNAIL) embed.setThumbnail(BLACKJACK_THUMBNAIL);
  return embed;
}

function drawCard() {
  const value = DECK_VALUES[Math.floor(Math.random() * DECK_VALUES.length)];
  const suitIndex = Math.floor(Math.random() * 4);
  return { value, suitIndex };
}

function handValue(hand) {
  let total = 0;
  let aces = 0;

  for (const card of hand) {
    if (card.value === "A") {
      total += 11;
      aces++;
    } else if (["K", "Q", "J"].includes(card.value)) {
      total += 10;
    } else {
      total += parseInt(card.value, 10);
    }
  }

  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }

  return total;
}

function getCardEmoji(card) {
  if (naipes[card.value]?.[card.suitIndex]) {
    return naipes[card.value][card.suitIndex];
  }

  return `${card.value}${naipes.naipes?.[card.suitIndex] || ""}`;
}

function formatHand(hand, hidden = false) {
  if (!hidden) return hand.map((card) => getCardEmoji(card)).join(" ");
  return [getCardEmoji(hand[0]), "<:none:1500968452087742585>"].join(" ");
}

function buildControls(customPrefix, disabled = false) {
  return [
    new MessageActionRow().addComponents(
      new MessageButton().setCustomId(`${customPrefix}:hit`).setLabel("<:buy:1499564014777401434> Comprar").setStyle("SUCCESS").setDisabled(disabled),
      new MessageButton().setCustomId(`${customPrefix}:stand`).setLabel("<:stop:1499564013346881596> Parar").setStyle("DANGER").setDisabled(disabled)
    )
  ];
}

function createEmbed(user, state, revealDealer = false, finalText = null) {
  const playerTotal = handValue(state.playerHand);
  const dealerTotal = revealDealer ? handValue(state.dealerHand) : handValue([state.dealerHand[0]]);

  return createBlackjackEmbed(user, state.color || ee.color)
    .setTitle(`${emojis.blackjack} Blackjack`)
    .setDescription(finalText || "Controle sua mao usando os botoes abaixo.")
    .addField(`Sua mao (${playerTotal})`, formatHand(state.playerHand), true)
    .addField(`Banca (${dealerTotal}${revealDealer ? "" : "+"})`, formatHand(state.dealerHand, !revealDealer), true)
    .addField("Aposta atual", formatAmount(state.bet), true);
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
        createBlackjackEmbed(message.author)
          .setTitle(`${emojis.blackjack} Blackjack`)
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

module.exports = {
  name: "blackjack",
  aliases: ["bj", "vinteeum", "21"],
  category: "Cassino",
  description: "Jogue blackjack contra a banca com controles interativos.",
  usage: "blackjack [aposta]",
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

      setCasinoCooldown(message.author.id, "blackjack", settings.casinoCooldownSeconds);

      const state = {
        bet: amount,
        balance: userData.coins,
        playerHand: [drawCard(), drawCard()],
        dealerHand: [drawCard(), drawCard()],
        color: ee.color
      };

      while (handValue(state.playerHand) < 12) {
        state.playerHand.push(drawCard());
      }

      const customPrefix = `blackjack:${message.author.id}:${Date.now()}`;
      const gameMessage = await message.reply({
        embeds: [createEmbed(message.author, state, false)],
        components: buildControls(customPrefix, false)
      });

      const collector = gameMessage.createMessageComponentCollector({ time: 90000 });
      const collectorDone = new Promise((resolve) => collector.on("end", () => resolve()));
      let finished = false;

      const finalize = async () => {
        if (finished) return;
        finished = true;
        const result = settleGame(state);
        const newBalance = await applyGameResult(message.author.id, state.balance, result.netChange);
        state.color = getCasinoResultColor(result.outcome);

        await gameMessage.edit({
          embeds: [
            createEmbed(
              message.author,
              state,
              true,
              `${result.reason}\nPremio: ${result.payout > 0 ? formatAmount(result.payout) : `**0** ${emojis.King_Coin}`}\nSaldo atual: ${formatAmount(newBalance)}`
            )
          ],
          components: buildControls(customPrefix, true)
        }).catch(() => null);
        endCasinoSession(message.author.id);
        attachReplayHandler(client, message, gameMessage, "blackjack", []);

        await logCasinoEvent(client, message, {
          userId: message.author.id,
          game: "blackjack",
          bet: state.bet,
          payout: result.payout,
          netChange: result.netChange,
          outcome: result.outcome,
          reason: result.reason,
          metadata: {
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

        if (action === "hit") {
          state.playerHand.push(drawCard());
          if (handValue(state.playerHand) > 21) {
            collector.stop("finished");
            await interaction.deferUpdate().catch(() => null);
            return finalize();
          }

          return interaction.update({
            embeds: [createEmbed(message.author, state, false)],
            components: buildControls(customPrefix, false)
          }).catch(() => null);
        }

        collector.stop("finished");
        await interaction.deferUpdate().catch(() => null);
        return finalize();
      });

      collector.on("end", async (_collected, reason) => {
        if (finished || reason === "finished") return;
        finished = true;
        await gameMessage.edit({
          embeds: [
            createEmbed(message.author, state, false, "Tempo esgotado. A mesa foi encerrada sem resultado.").setColor(ee.color)
          ],
          components: buildControls(customPrefix, true)
        }).catch(() => null);

        await logCasinoEvent(client, message, {
          userId: message.author.id,
          game: "blackjack",
          bet: state.bet,
          payout: 0,
          netChange: 0,
          outcome: "cancelled",
          reason: "Partida encerrada por tempo.",
          metadata: {}
        });
      });
      await collectorDone;
    } finally {
      endCasinoSession(message.author.id);
    }
  }
};
