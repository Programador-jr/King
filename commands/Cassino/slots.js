const { AttachmentBuilder } = require("discord.js");
const { renderSlotsResultImage, renderSlotsSpinGif } = require("../../handlers/slotImageRenderer");
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

const SLOT_ICON = emojis.casino_slots || "🎰";
const CASH_ICON = emojis.cash || "";
const WALLET_ICON = emojis.wallet || "";
const WINNING_ICON = emojis.winning || "";

const SLOT_SYMBOLS = [
  emojis.casino_cherry || "🍒",
  emojis.casino_lemon || "🍋",
  emojis.casino_grape || "🍇",
  emojis.casino_seven || "7️⃣",
  emojis.casino_clover || "🍀"
];

const SLOT_EMOJI_MAP = {
  cherry: SLOT_SYMBOLS[0],
  lemon: SLOT_SYMBOLS[1],
  grape: SLOT_SYMBOLS[2],
  seven: SLOT_SYMBOLS[3],
  clover: SLOT_SYMBOLS[4]
};

const SLOT_SPIN_DURATION_MS = 2600;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomSlotSymbol() {
  return SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)];
}

function createSlotRoll() {
  return Array.from({ length: 3 }, () => randomSlotSymbol());
}

function formatSlotWindow(reels) {
  return [
    "```",
    "+-----------------------+",
    "|     KING SLOTS        |",
    "+-----------------------+",
    "```",
    `**[ ${reels[0]} ]  [ ${reels[1]} ]  [ ${reels[2]} ]**`,
    "```",
    "+-----------------------+",
    "```"
  ].join("\n");
}

function evaluateSlots(results, betAmount) {
  const counts = results.reduce((acc, symbol) => {
    acc[symbol] = (acc[symbol] || 0) + 1;
    return acc;
  }, {});

  const values = Object.values(counts).sort((a, b) => b - a);
  const hasTriple = values[0] === 3;
  const hasPair = values[0] === 2;
  const sevenTriple = hasTriple && results.every((symbol) => symbol === SLOT_EMOJI_MAP.seven);
  const cloverCount = counts[SLOT_EMOJI_MAP.clover] || 0;

  let multiplier = 0;
  let reason = "Nenhuma combinacao premiada.";

  if (sevenTriple) {
    multiplier = 8;
    reason = "Jackpot de sete triplo.";
  } else if (hasTriple) {
    multiplier = 4;
    reason = "Tres simbolos iguais.";
  } else if (cloverCount >= 2) {
    multiplier = 2;
    reason = "Trevos da sorte apareceram duas vezes.";
  } else if (hasPair) {
    multiplier = 1.5;
    reason = "Voce acertou um par.";
  }

  const payout = Math.floor(betAmount * multiplier);
  const netChange = payout - betAmount;
  return { payout, netChange, multiplier, reason };
}

async function resolveBet(message, args, settings, userData) {
  if (args[0]) {
    const amount = parseBet(args[0], userData.coins);
    return { ok: !!amount, amount };
  }

  const response = await promptForText(
    message,
    {
      embeds: [
        buildCasinoEmbed(message.author)
          .setTitle(`${SLOT_ICON} Slots`)
          .setDescription(
            [
              "Qual sera o valor da aposta?",
              `Aposta minima: ${formatAmount(settings.casinoMinBet)}`,
              `Aposta maxima: ${formatAmount(settings.casinoMaxBet)}`,
              `Seu saldo: ${formatAmount(userData.coins)}`,
              "Voce pode responder com um numero ou `all`."
            ].join("\n")
          )
      ]
    },
    (content) => {
      const amount = parseBet(content, userData.coins);
      if (!amount) {
        return { ok: false, message: "Envie uma aposta valida usando um numero inteiro ou `all`." };
      }
      return { ok: true, value: amount };
    }
  );

  if (!response.ok) return response;
  return { ok: true, amount: response.value };
}

async function animateSlots(message, user, amount, finalRoll) {
  const embed = buildCasinoEmbed(user)
    .setTitle(`${SLOT_ICON} Slots`)
    .setDescription(`Girando os rolos...\n${CASH_ICON} Aposta: ${formatAmount(amount)}`);
  const files = [];

  try {
    const spinBuffer = renderSlotsSpinGif({
      finalRoll,
      emojiMap: SLOT_EMOJI_MAP
    });
    files.push(new AttachmentBuilder(spinBuffer, { name: "slots-spin.gif" }));
    embed.setImage("attachment://slots-spin.gif");
  } catch (error) {
    console.warn("[Slots] Falha ao gerar GIF de giro:", error?.message || error);
    embed.setDescription(`${formatSlotWindow(createSlotRoll())}\n\nGirando os rolos...`);
  }

  const animationMessage = await message.reply({
    embeds: [embed],
    files,
    fetchReply: true
  });

  await sleep(SLOT_SPIN_DURATION_MS);
  return animationMessage;
}

module.exports = {
  name: "slots",
  aliases: ["slot", "cacaniquel", "cacaniqueis"],
  category: "Cassino",
  description: "Gire os slots apostando King Coins.",
  usage: "slots [aposta]",
  cooldown: 1,
  run: async (client, message, args, _plusArgs, _member, _text, default_prefix) => {
    const prefix = default_prefix || client?.settings?.get(message.guild?.id, "prefix") || client?.config?.prefix || "!";
    const settings = ensureCasinoSettings(client, message.guild?.id);
    const userData = await getUserData(message.author.id);
    const session = getActiveCasinoSession(message.author.id);
    if (session) {
      return message.reply({ embeds: [createSessionBusyEmbed(message.author, session)] });
    }

    if (!registerCasinoSession(message.author.id, "slots")) {
      return message.reply({ embeds: [createSessionBusyEmbed(message.author, getActiveCasinoSession(message.author.id))] });
    }

    try {
      const betResult = await resolveBet(message, args, settings, userData);
      if (!betResult.ok) {
        if (betResult.reason === "timeout" || betResult.reason === "invalid") return;
        return message.reply({ embeds: [createInvalidBetEmbed(message.author, prefix, userData.coins, settings)] });
      }

      const amount = betResult.amount;
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
          game: "slots",
          bet: amount,
          payout: 0,
          netChange: 0,
          outcome: "blocked",
          reason: `Aposta bloqueada por regra: ${validation.code}`
        });
        return message.reply({ embeds: [embed] });
      }

      const remainingCooldown = getRemainingCooldown(message.author.id, "slots");
      if (remainingCooldown > 0) {
        return message.reply({ embeds: [createCooldownEmbed(message.author, remainingCooldown)] });
      }
      setCasinoCooldown(message.author.id, "slots", settings.casinoCooldownSeconds);

      const roll = createSlotRoll();
      const animationMessage = await animateSlots(message, message.author, amount, roll);
      const result = evaluateSlots(roll, amount);
      const newBalance = await applyGameResult(message.author.id, userData.coins, result.netChange);

      const outcome = result.netChange > 0 ? "win" : result.netChange === 0 ? "push" : "loss";
      const embed = buildCasinoEmbed(message.author, getCasinoResultColor(outcome))
        .setTitle(`${SLOT_ICON} Slots`)
        .setDescription(outcome === "win" ? `Voce ganhou **${result.multiplier}x**.` : "Os rolos pararam sem combinacao premiada.")
        .addField(`${CASH_ICON} Aposta`, formatAmount(amount), true)
        .addField(`${WINNING_ICON} Premio`, result.payout > 0 ? formatAmount(result.payout) : `**0** ${emojis.King_Coin}`, true)
        .addField(`${WALLET_ICON} Saldo atual`, formatAmount(newBalance), true)
        .addField(`${WINNING_ICON} Resumo`, outcome === "win" ? `Voce ganhou **${result.multiplier}x**. ${result.reason}` : result.reason, false);

      const files = [];
      try {
        const imageBuffer = renderSlotsResultImage({
          roll,
          outcome,
          multiplier: result.multiplier,
          emojiMap: SLOT_EMOJI_MAP
        });
        files.push(new AttachmentBuilder(imageBuffer, { name: "slots-result.png" }));
        embed.setImage("attachment://slots-result.png");
      } catch (error) {
        console.warn("[Slots] Falha ao gerar imagem do resultado:", error?.message || error);
      }

      await logCasinoEvent(client, message, {
        userId: message.author.id,
        game: "slots",
        bet: amount,
        payout: result.payout,
        netChange: result.netChange,
        outcome,
        reason: result.reason,
        metadata: {
          roll
        }
      });

      await animationMessage.edit({ embeds: [embed], files }).catch(() => null);
      endCasinoSession(message.author.id);
      attachReplayHandler(client, message, animationMessage, "slots", []);
      return animationMessage;
    } finally {
      endCasinoSession(message.author.id);
    }
  }
};
