const { MessageActionRow, MessageButton } = require("discord.js");
const {
  emojis,
  ee,
  normalizeText,
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

const RED_NUMBERS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);

function describeResult(number) {
  if (number === 0) return "verde";
  return RED_NUMBERS.has(number) ? "vermelho" : "preto";
}

function createTypeButtons(customId, disabled = false) {
  return [
    new MessageActionRow().addComponents(
      new MessageButton().setCustomId(`${customId}:vermelho`).setLabel("Vermelho").setStyle("DANGER").setDisabled(disabled),
      new MessageButton().setCustomId(`${customId}:preto`).setLabel("Preto").setStyle("SECONDARY").setDisabled(disabled),
      new MessageButton().setCustomId(`${customId}:par`).setLabel("Par").setStyle("PRIMARY").setDisabled(disabled),
      new MessageButton().setCustomId(`${customId}:impar`).setLabel("Impar").setStyle("SUCCESS").setDisabled(disabled)
    ),
    new MessageActionRow().addComponents(
      new MessageButton().setCustomId(`${customId}:numero`).setLabel("Numero exato").setStyle("PRIMARY").setDisabled(disabled),
      new MessageButton().setCustomId(`${customId}:cancel`).setLabel("Cancelar").setStyle("DANGER").setDisabled(disabled)
    )
  ];
}

function getBetPreview(bet) {
  const normalized = normalizeText(bet);
  const numeric = parseInt(normalized, 10);

  if (Number.isInteger(numeric) && numeric >= 0 && numeric <= 36) {
    return {
      label: `Numero ${numeric}`,
      payoutText: "Retorno de **14x** se acertar o numero exato."
    };
  }

  if (["vermelho", "preto", "par", "impar"].includes(normalized)) {
    return {
      label: normalized,
      payoutText: "Retorno de **2x** se a aposta bater."
    };
  }

  return {
    label: normalized,
    payoutText: "Aposta sem retorno definido."
  };
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
          .setTitle("🎡 Roleta")
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
      if (!amount) return { ok: false, message: "Envie um numero inteiro ou `all`." };
      return { ok: true, value: amount };
    }
  ).then((result) => result.ok ? { ok: true, amount: result.value } : result);
}

async function resolveRouletteBet(message, args) {
  if (args[1]) {
    const normalized = normalizeText(args[1]);
    return { ok: true, bet: normalized };
  }

  const customId = `roleta:${message.author.id}:${Date.now()}`;
  const chooserMessage = await message.reply({
    embeds: [
      buildCasinoEmbed(message.author)
        .setTitle("🎡 Roleta")
        .setDescription("Agora escolha em que voce quer apostar.")
        .addField("Pagamentos", "Cor e paridade pagam **2x**. Numero exato paga **14x**.", false)
    ],
    components: createTypeButtons(customId, false),
    fetchReply: true
  });

  const interaction = await chooserMessage.awaitMessageComponent({
    filter: (i) => i.user.id === message.author.id,
    time: 60000
  }).catch(() => null);

  if (!interaction) {
    await chooserMessage.edit({
      embeds: [
        buildCasinoEmbed(message.author, ee.wrongcolor)
          .setTitle(`${emojis.x} Tempo esgotado`)
          .setDescription("A escolha da roleta expirou.")
      ],
      components: createTypeButtons(customId, true)
    }).catch(() => null);
    return { ok: false, reason: "timeout" };
  }

  const selected = interaction.customId.split(":").pop();
  if (selected === "cancel") {
    await interaction.update({
      embeds: [
        buildCasinoEmbed(message.author, ee.wrongcolor)
          .setTitle("🎡 Roleta cancelada")
          .setDescription("A aposta foi cancelada antes do giro.")
      ],
      components: createTypeButtons(customId, true)
    }).catch(() => null);
    return { ok: false, reason: "cancelled" };
  }

  if (selected !== "numero") {
    await interaction.update({
      embeds: [
        buildCasinoEmbed(message.author)
          .setTitle("🎡 Roleta")
          .setDescription(`Aposta registrada em **${selected}**.`)
          .addField("Retorno previsto", getBetPreview(selected).payoutText, false)
      ],
      components: createTypeButtons(customId, true)
    }).catch(() => null);
    return { ok: true, bet: selected };
  }

  await interaction.update({
    embeds: [
      buildCasinoEmbed(message.author)
        .setTitle("🎡 Roleta")
        .setDescription("Envie no chat um numero entre **0** e **36**.")
        .addField("Retorno previsto", "Numero exato paga **14x**.", false)
    ],
    components: createTypeButtons(customId, true)
  }).catch(() => null);

  const numeric = await promptForText(
    message,
    {
      embeds: [
        buildCasinoEmbed(message.author)
          .setTitle("🎡 Roleta")
          .setDescription("Qual numero exato entre **0** e **36** voce quer apostar?")
          .addField("Retorno previsto", "Numero exato paga **14x**.", false)
      ]
    },
    (content) => {
      const value = parseInt(content, 10);
      if (!Number.isInteger(value) || value < 0 || value > 36) {
        return { ok: false, message: "Envie um numero inteiro entre 0 e 36." };
      }
      return { ok: true, value: String(value) };
    }
  );

  if (!numeric.ok) return numeric;
  return { ok: true, bet: numeric.value };
}

module.exports = {
  name: "roleta",
  aliases: ["roulette"],
  category: "Cassino",
  description: "Aposte na roleta do cassino.",
  usage: "roleta [aposta] [vermelho|preto|par|impar|0-36]",
  cooldown: 1,
  run: async (client, message, args, _plusArgs, _member, _text, default_prefix) => {
    const prefix = default_prefix || client?.settings?.get(message.guild?.id, "prefix") || client?.config?.prefix || "!";
    const settings = ensureCasinoSettings(client, message.guild?.id);
    const userData = await getUserData(message.author.id);
    const session = getActiveCasinoSession(message.author.id);
    if (session) {
      return message.reply({ embeds: [createSessionBusyEmbed(message.author, session)] });
    }
    if (!registerCasinoSession(message.author.id, "roleta")) {
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
          game: "roleta",
          bet: amount,
          payout: 0,
          netChange: 0,
          outcome: "blocked",
          reason: `Aposta bloqueada por regra: ${validation.code}`
        });
        return message.reply({ embeds: [embed] });
      }

      const remainingCooldown = getRemainingCooldown(message.author.id, "roleta");
      if (remainingCooldown > 0) {
        return message.reply({ embeds: [createCooldownEmbed(message.author, remainingCooldown)] });
      }

      const betChoice = await resolveRouletteBet(message, args);
      if (!betChoice.ok) return;

      const bet = normalizeText(betChoice.bet);
      const preview = getBetPreview(bet);
      const validSimpleBets = ["vermelho", "preto", "par", "impar"];
      const numberBet = Number.isInteger(parseInt(bet, 10)) ? parseInt(bet, 10) : null;

      if (!validSimpleBets.includes(bet) && !(numberBet >= 0 && numberBet <= 36)) {
        return message.reply({
          embeds: [
            buildCasinoEmbed(message.author, ee.wrongcolor)
              .setTitle(`${emojis.x} Aposta invalida`)
              .setDescription(`Use \`${prefix}roleta <aposta> <vermelho|preto|par|impar|0-36>\`.`)
          ]
        });
      }

      setCasinoCooldown(message.author.id, "roleta", settings.casinoCooldownSeconds);
      const resultNumber = Math.floor(Math.random() * 37);
      const resultColor = describeResult(resultNumber);
      const isEven = resultNumber !== 0 && resultNumber % 2 === 0;

      let payout = 0;
      let netChange = -amount;
      let status = "A banca ficou com sua aposta.";

      if (numberBet !== null && numberBet === resultNumber) {
        payout = amount * 14;
        netChange = payout - amount;
        status = "Voce acertou o numero exato.";
      } else if (bet === resultColor) {
        payout = amount * 2;
        netChange = amount;
        status = "Voce acertou a cor.";
      } else if (bet === "par" && isEven) {
        payout = amount * 2;
        netChange = amount;
        status = "Voce acertou a paridade.";
      } else if (bet === "impar" && resultNumber !== 0 && !isEven) {
        payout = amount * 2;
        netChange = amount;
        status = "Voce acertou a paridade.";
      }

      const newBalance = await applyGameResult(message.author.id, userData.coins, netChange);

      const outcome = netChange > 0 ? "win" : netChange === 0 ? "push" : "loss";
      const embed = buildCasinoEmbed(message.author, getCasinoResultColor(outcome))
        .setTitle("🎡 Roleta")
        .addField("Sua aposta", `\`${preview.label}\``, true)
        .addField("Pagamento previsto", preview.payoutText, false)
        .addField("Numero sorteado", `**${resultNumber}**`, true)
        .addField("Cor", `**${resultColor}**`, true)
        .addField("Premio", payout > 0 ? formatAmount(payout) : `**0** ${emojis.King_Coin}`, true)
        .addField("Saldo atual", formatAmount(newBalance), true)
        .addField("Status", status, false);

      await logCasinoEvent(client, message, {
        userId: message.author.id,
        game: "roleta",
        bet: amount,
        payout,
        netChange,
        outcome,
        reason: status,
        metadata: {
          bet,
          resultNumber,
          resultColor
        }
      });

      const resultMessage = await message.reply({ embeds: [embed], fetchReply: true });
      endCasinoSession(message.author.id);
      attachReplayHandler(client, message, resultMessage, "roleta", []);
      return resultMessage;
    } finally {
      endCasinoSession(message.author.id);
    }
  }
};
