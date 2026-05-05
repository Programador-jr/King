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

const BOARD_SIZE = 25;

function pickUniqueRandom(total, count) {
  const available = Array.from({ length: total }, (_, index) => index + 1);
  const picked = [];
  while (picked.length < count) {
    const index = Math.floor(Math.random() * available.length);
    picked.push(available.splice(index, 1)[0]);
  }
  return picked;
}

function calculateMultiplier(mineCount, safeSelections) {
  const safeCells = BOARD_SIZE - mineCount;
  const progressFactor = safeSelections === 0 ? 1 : (safeCells / (safeCells - safeSelections));
  const riskFactor = 1 + (mineCount / BOARD_SIZE) * 2.2;
  return Number((progressFactor * riskFactor).toFixed(2));
}

function createBoardRows(customPrefix, revealedSafe, mineTiles, explodedTile = null, disabled = false, revealAll = false) {
  const rows = [];
  for (let row = 0; row < 5; row++) {
    const buttons = [];
    for (let col = 1; col <= 5; col++) {
      const tile = row * 5 + col;
      const isSafe = revealedSafe.has(tile);
      const isMine = mineTiles.includes(tile);
      const isExploded = explodedTile === tile;

      let style = "SECONDARY";
      let emoji = null;
      if (isSafe) {
        style = "SUCCESS";
        emoji = "💎";
      } else if (revealAll && isMine) {
        style = isExploded ? "DANGER" : "PRIMARY";
        emoji = "💣";
      }

      buttons.push(
        (() => {
          const button = new MessageButton()
          .setCustomId(`${customPrefix}:tile:${tile}`)
          .setLabel(String(tile))
          .setStyle(style)
          .setDisabled(disabled || isSafe || (revealAll && isMine));

          if (emoji) {
            button.setEmoji(emoji);
          }

          return button;
        })()
      );
    }
    rows.push(new MessageActionRow().addComponents(buttons));
  }
  return rows;
}

function createControlRow(customPrefix, canCashout, disabled = false) {
  return new MessageActionRow().addComponents(
    new MessageButton()
      .setCustomId(`${customPrefix}:cashout`)
      .setLabel("Sacar")
      .setStyle("SUCCESS")
      .setDisabled(disabled || !canCashout),
    new MessageButton()
      .setCustomId(`${customPrefix}:cancel`)
      .setLabel("Cancelar")
      .setStyle("DANGER")
      .setDisabled(disabled)
  );
}

function createEmbed(user, state, text = null) {
  const safeSelections = state.revealedSafe.size;
  const multiplier = calculateMultiplier(state.mineCount, safeSelections);
  const potentialPayout = safeSelections > 0 ? Math.floor(state.bet * multiplier) : state.bet;

  return buildCasinoEmbed(user, state.color || ee.color)
    .setTitle("💣 Minas")
    .setDescription(text || "Clique nas casas seguras. Quanto mais minas, maior o multiplicador.")
    .addField("Aposta", formatAmount(state.bet), true)
    .addField("Minas", `**${state.mineCount}**`, true)
    .addField("Casas abertas", `**${safeSelections}**`, true)
    .addField("Multiplicador atual", `**${safeSelections > 0 ? multiplier : 1}x**`, true)
    .addField("Saque atual", formatAmount(potentialPayout), true)
    .addField("Saldo base", formatAmount(state.balance), true);
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
          .setTitle("💣 Minas")
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

async function resolveMineCount(message, args) {
  if (args[1]) {
    const count = parseInt(args[1], 10);
    return { ok: Number.isInteger(count), mineCount: count };
  }

  return promptForText(
    message,
    {
      embeds: [
        buildCasinoEmbed(message.author)
          .setTitle("💣 Minas")
          .setDescription("Quantas minas voce quer no tabuleiro? Escolha um numero entre **1** e **24**.")
      ]
    },
    (content) => {
      const count = parseInt(content, 10);
      if (!Number.isInteger(count) || count < 1 || count > 24) {
        return { ok: false, message: "Envie um numero inteiro entre 1 e 24." };
      }
      return { ok: true, value: count };
    }
  ).then((result) => result.ok ? { ok: true, mineCount: result.value } : result);
}

module.exports = {
  name: "minas",
  aliases: ["mina", "mines"],
  category: "Cassino",
  description: "Escolha casas interativamente e tente evitar as minas.",
  usage: "minas [aposta] [quantidade-de-minas]",
  cooldown: 1,
  run: async (client, message, args, _plusArgs, _member, _text, default_prefix) => {
    const prefix = default_prefix || client?.settings?.get(message.guild?.id, "prefix") || client?.config?.prefix || "!";
    const settings = ensureCasinoSettings(client, message.guild?.id);
    const userData = await getUserData(message.author.id);
    const session = getActiveCasinoSession(message.author.id);
    if (session) {
      return message.reply({ embeds: [createSessionBusyEmbed(message.author, session)] });
    }
    if (!registerCasinoSession(message.author.id, "minas")) {
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
          game: "minas",
          bet: amount,
          payout: 0,
          netChange: 0,
          outcome: "blocked",
          reason: `Aposta bloqueada por regra: ${validation.code}`
        });
        return message.reply({ embeds: [embed] });
      }

      const remainingCooldown = getRemainingCooldown(message.author.id, "minas");
      if (remainingCooldown > 0) {
        return message.reply({ embeds: [createCooldownEmbed(message.author, remainingCooldown)] });
      }

      const mineCountResult = await resolveMineCount(message, args);
      if (!mineCountResult.ok) return;
      const mineCount = mineCountResult.mineCount;
      if (!Number.isInteger(mineCount) || mineCount < 1 || mineCount > 24) {
        return message.reply({
          embeds: [
            buildCasinoEmbed(message.author, ee.wrongcolor)
              .setTitle(`${emojis.x} Quantidade de minas invalida`)
              .setDescription(`Use \`${prefix}minas <aposta> <1-24>\`.`)
          ]
        });
      }

      setCasinoCooldown(message.author.id, "minas", settings.casinoCooldownSeconds);

      const state = {
        bet: amount,
        balance: userData.coins,
        mineCount,
        mineTiles: pickUniqueRandom(BOARD_SIZE, mineCount),
        revealedSafe: new Set(),
        color: ee.color
      };

      const customPrefix = `minas:${message.author.id}:${Date.now()}`;
      const boardMessage = await message.reply({
        embeds: [createEmbed(message.author, state)],
        components: createBoardRows(customPrefix, state.revealedSafe, state.mineTiles, null, false, false)
      });

      const controlMessage = await message.reply({
        embeds: [
          buildCasinoEmbed(message.author)
            .setTitle("💣 Controles de Minas")
            .setDescription("Use `Sacar` para encerrar com lucro atual ou `Cancelar` para abortar sem resultado.")
        ],
        components: [createControlRow(customPrefix, false, false)]
      });

      const filter = (interaction) =>
        interaction.user.id === message.author.id && interaction.customId.startsWith(customPrefix);

      const boardCollector = boardMessage.createMessageComponentCollector({ filter, time: 120000 });
      const controlCollector = controlMessage.createMessageComponentCollector({ filter, time: 120000 });
      const boardDone = new Promise((resolve) => boardCollector.on("end", () => resolve()));
      const controlDone = new Promise((resolve) => controlCollector.on("end", () => resolve()));
      let finished = false;

      const closeGame = async (finalEmbed, revealAll = false, explodedTile = null, canCashout = false) => {
        finished = true;
        await boardMessage.edit({
          embeds: [finalEmbed],
          components: createBoardRows(customPrefix, state.revealedSafe, state.mineTiles, explodedTile, true, revealAll)
        }).catch(() => null);
        await controlMessage.edit({
          embeds: [
            buildCasinoEmbed(message.author, finalEmbed.data?.color || ee.color)
              .setTitle("💣 Controles de Minas")
              .setDescription("Partida encerrada.")
          ],
          components: [createControlRow(customPrefix, canCashout, true)]
        }).catch(() => null);
      };

      const endCollectors = (reason) => {
        boardCollector.stop(reason);
        controlCollector.stop(reason);
      };

      boardCollector.on("collect", async (interaction) => {
        if (finished) return interaction.deferUpdate().catch(() => null);
        const tile = parseInt(interaction.customId.split(":").pop(), 10);
        if (!Number.isInteger(tile) || state.revealedSafe.has(tile)) {
          return interaction.deferUpdate().catch(() => null);
        }

        if (state.mineTiles.includes(tile)) {
          const newBalance = await applyGameResult(message.author.id, state.balance, -state.bet);
          state.color = ee.wrongcolor;
          endCollectors("finished");
          await interaction.deferUpdate().catch(() => null);
          await closeGame(
            createEmbed(
              message.author,
              state,
              `Voce encontrou uma mina na casa **${tile}**.\nPerda: ${formatAmount(state.bet)}\nSaldo atual: ${formatAmount(newBalance)}`
            ).setColor(ee.wrongcolor),
            true,
            tile,
            false
          );
          endCasinoSession(message.author.id);
          attachReplayHandler(client, message, controlMessage, "minas", []);

          await logCasinoEvent(client, message, {
            userId: message.author.id,
            game: "minas",
            bet: state.bet,
            payout: 0,
            netChange: -state.bet,
            outcome: "loss",
            reason: `Mina encontrada na casa ${tile}.`,
            metadata: {
              mineCount: state.mineCount,
              revealedSafe: [...state.revealedSafe],
              explodedTile: tile
            }
          });
          return;
        }

        state.revealedSafe.add(tile);
        const canCashout = state.revealedSafe.size > 0;

        await interaction.update({
          embeds: [createEmbed(message.author, state)],
          components: createBoardRows(customPrefix, state.revealedSafe, state.mineTiles, null, false, false)
        }).catch(() => null);

        await controlMessage.edit({
          embeds: [
            buildCasinoEmbed(message.author)
              .setTitle("💣 Controles de Minas")
              .setDescription("Abra outra casa ou saque o valor atual.")
          ],
          components: [createControlRow(customPrefix, canCashout, false)]
        }).catch(() => null);
      });

      controlCollector.on("collect", async (interaction) => {
        if (finished) return interaction.deferUpdate().catch(() => null);
        const action = interaction.customId.split(":").pop();

        if (action === "cancel") {
          endCollectors("cancelled");
          await interaction.deferUpdate().catch(() => null);
          await closeGame(
            createEmbed(message.author, state, "Partida cancelada sem alterar o saldo.").setColor(ee.wrongcolor),
            false,
            null,
            false
          );
          await logCasinoEvent(client, message, {
            userId: message.author.id,
            game: "minas",
            bet: state.bet,
            payout: 0,
            netChange: 0,
            outcome: "cancelled",
            reason: "Partida cancelada pelo usuario.",
            metadata: {
              mineCount: state.mineCount,
              revealedSafe: [...state.revealedSafe]
            }
          });
          return;
        }

        if (!state.revealedSafe.size) {
          return interaction.reply({ content: `${emojis.x} Abra pelo menos uma casa antes de sacar.`, flags: 64 }).catch(() => null);
        }

        const multiplier = calculateMultiplier(state.mineCount, state.revealedSafe.size);
        const payout = Math.floor(state.bet * multiplier);
        const netChange = payout - state.bet;
        const newBalance = await applyGameResult(message.author.id, state.balance, netChange);
        state.color = getCasinoResultColor("win");
        endCollectors("finished");
        await interaction.deferUpdate().catch(() => null);
        await closeGame(
          createEmbed(
            message.author,
            state,
            `Voce sacou a rodada com **${multiplier}x**.\nPremio: ${formatAmount(payout)}\nSaldo atual: ${formatAmount(newBalance)}`
          ),
          true,
          null,
          false
        );
        endCasinoSession(message.author.id);
        attachReplayHandler(client, message, controlMessage, "minas", []);

        await logCasinoEvent(client, message, {
          userId: message.author.id,
          game: "minas",
          bet: state.bet,
          payout,
          netChange,
          outcome: "win",
          reason: "Usuario sacou manualmente.",
          metadata: {
            mineCount: state.mineCount,
            revealedSafe: [...state.revealedSafe],
            multiplier
          }
        });
      });

      const onEnd = async (reason) => {
        if (finished || reason === "finished" || reason === "cancelled") return;
        await closeGame(
          createEmbed(message.author, state, "Tempo esgotado. Partida encerrada sem alterar o saldo.").setColor(ee.wrongcolor),
          false,
          null,
          false
        );
        await logCasinoEvent(client, message, {
          userId: message.author.id,
          game: "minas",
          bet: state.bet,
          payout: 0,
          netChange: 0,
          outcome: "cancelled",
          reason: "Partida encerrada por tempo.",
          metadata: {
            mineCount: state.mineCount,
            revealedSafe: [...state.revealedSafe]
          }
        });
      };

      boardCollector.on("end", async (_c, reason) => onEnd(reason));
      controlCollector.on("end", async (_c, reason) => onEnd(reason));
      await Promise.all([boardDone, controlDone]);
    } finally {
      endCasinoSession(message.author.id);
    }
  }
};
