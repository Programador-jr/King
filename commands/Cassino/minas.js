const { MessageActionRow, MessageButton } = require("discord.js");
const {
  emojis,
  ee,
  buildCasinoEmbed,
  getComponentEmoji,
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

const BOARD_SIZES = [3, 4, 5];
const DEFAULT_BOARD_SIZE = 5;
const BOMB_ICON = emojis.bomb || "💣";
const SAFE_ICON = emojis.winning || emojis.check_mark || "💎";
const CASH_ICON = emojis.cash || "";
const WALLET_ICON = emojis.wallet || "";
const WINNING_ICON = emojis.winning || "";
const BUTTON_BOMB_ICON = getComponentEmoji(emojis.bomb) || "\uD83D\uDCA3";
const BUTTON_SAFE_ICON = getComponentEmoji(emojis.winning || emojis.check_mark) || "\uD83D\uDC8E";
const BUTTON_CASH_ICON = getComponentEmoji(emojis.cash) || "\uD83D\uDCB0";

function pickUniqueRandom(total, count) {
  const available = Array.from({ length: total }, (_, index) => index + 1);
  const picked = [];
  while (picked.length < count) {
    const index = Math.floor(Math.random() * available.length);
    picked.push(available.splice(index, 1)[0]);
  }
  return picked;
}

function getBoardTileCount(boardSize) {
  return boardSize * boardSize;
}

function calculateMultiplier(mineCount, safeSelections, boardSize = DEFAULT_BOARD_SIZE) {
  const boardTiles = getBoardTileCount(boardSize);
  const safeCells = boardTiles - mineCount;
  const progressFactor = safeSelections === 0 ? 1 : (safeCells / (safeCells - safeSelections));
  const riskFactor = 1 + (mineCount / boardTiles) * 2.2;
  return Number((progressFactor * riskFactor).toFixed(2));
}

function createBoardRows(customPrefix, boardSize, revealedSafe, mineTiles, explodedTile = null, disabled = false, revealAll = false) {
  const rows = [];
  for (let row = 0; row < boardSize; row++) {
    const buttons = [];
    for (let col = 1; col <= boardSize; col++) {
      const tile = row * boardSize + col;
      const isSafe = revealedSafe.has(tile);
      const isMine = mineTiles.includes(tile);
      const isExploded = explodedTile === tile;

      let style = "SECONDARY";
      let emoji = null;
      if (isSafe) {
        style = "SUCCESS";
        emoji = BUTTON_SAFE_ICON;
      } else if (revealAll && isMine) {
        style = isExploded ? "DANGER" : "PRIMARY";
        emoji = BUTTON_BOMB_ICON;
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
      .setEmoji(BUTTON_CASH_ICON)
      .setStyle("SUCCESS")
      .setDisabled(disabled || !canCashout),
    new MessageButton()
      .setCustomId(`${customPrefix}:cancel`)
      .setLabel("Cancelar")
      .setStyle("DANGER")
      .setDisabled(disabled)
  );
}

function createBoardSizeRow(customId, disabled = false) {
  return new MessageActionRow().addComponents(
    BOARD_SIZES.map((size) =>
      new MessageButton()
        .setCustomId(`${customId}:size:${size}`)
        .setLabel(`${size}x${size}`)
        .setStyle(size === DEFAULT_BOARD_SIZE ? "PRIMARY" : "SECONDARY")
        .setDisabled(disabled)
    )
  );
}

function createEmbed(user, state, text = null) {
  const safeSelections = state.revealedSafe.size;
  const multiplier = calculateMultiplier(state.mineCount, safeSelections, state.boardSize);
  const potentialPayout = safeSelections > 0 ? Math.floor(state.bet * multiplier) : state.bet;

  return buildCasinoEmbed(user, state.color || ee.color)
    .setTitle(`${BOMB_ICON} Minas`)
    .setDescription(text || "Clique nas casas seguras. Quanto mais minas, maior o multiplicador.")
    .addField(`${CASH_ICON} Aposta`, formatAmount(state.bet), true)
    .addField("Tabuleiro", `**${state.boardSize}x${state.boardSize}**`, true)
    .addField(`${BOMB_ICON} Minas`, `**${state.mineCount}**`, true)
    .addField("Casas abertas", `**${safeSelections}**`, true)
    .addField(`${WINNING_ICON} Multiplicador atual`, `**${safeSelections > 0 ? multiplier : 1}x**`, true)
    .addField(`${CASH_ICON} Saque atual`, formatAmount(potentialPayout), true)
    .addField(`${WALLET_ICON} Saldo base`, formatAmount(state.balance), true);
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
          .setTitle(`${BOMB_ICON} Minas`)
          .setDescription(
            [
              "Qual sera o valor da aposta?",
              `${CASH_ICON} Aposta minima: ${formatAmount(settings.casinoMinBet)}`,
              `${CASH_ICON} Aposta maxima: ${formatAmount(settings.casinoMaxBet)}`,
              `${WALLET_ICON} Seu saldo: ${formatAmount(userData.coins)}`
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

async function resolveBoardSize(message, args) {
  if (args[2]) {
    const size = parseInt(String(args[2]).toLowerCase().replace("x", ""), 10);
    return { ok: BOARD_SIZES.includes(size), boardSize: size, reason: BOARD_SIZES.includes(size) ? null : "invalid" };
  }

  const customId = `minas-size:${message.author.id}:${Date.now()}`;
  const chooserMessage = await message.reply({
    embeds: [
      buildCasinoEmbed(message.author)
        .setTitle(`${BOMB_ICON} Minas`)
        .setDescription("Escolha o tamanho do tabuleiro.")
    ],
    components: [createBoardSizeRow(customId, false)],
    fetchReply: true
  });

  const interaction = await chooserMessage.awaitMessageComponent({
    filter: (i) => i.user.id === message.author.id && i.customId.startsWith(`${customId}:size:`),
    time: 60000
  }).catch(() => null);

  if (!interaction) {
    await chooserMessage.edit({
      embeds: [
        buildCasinoEmbed(message.author, ee.wrongcolor)
          .setTitle(`${emojis.x} Tempo esgotado`)
          .setDescription("A escolha do tamanho do tabuleiro expirou.")
      ],
      components: [createBoardSizeRow(customId, true)]
    }).catch(() => null);
    return { ok: false, reason: "timeout" };
  }

  const boardSize = parseInt(interaction.customId.split(":").pop(), 10);
  await interaction.update({
    embeds: [
      buildCasinoEmbed(message.author)
        .setTitle(`${BOMB_ICON} Minas`)
        .setDescription(`Tabuleiro selecionado: **${boardSize}x${boardSize}**.`)
    ],
    components: [createBoardSizeRow(customId, true)]
  }).catch(() => null);

  return { ok: true, boardSize };
}

async function resolveMineCount(message, args, boardSize) {
  const maxMines = getBoardTileCount(boardSize) - 1;
  if (args[1]) {
    const count = parseInt(args[1], 10);
    return { ok: Number.isInteger(count), mineCount: count };
  }

  return promptForText(
    message,
    {
      embeds: [
        buildCasinoEmbed(message.author)
          .setTitle(`${BOMB_ICON} Minas`)
          .setDescription(`Quantas minas voce quer no tabuleiro **${boardSize}x${boardSize}**? Escolha um numero entre **1** e **${maxMines}**.`)
      ]
    },
    (content) => {
      const count = parseInt(content, 10);
      if (!Number.isInteger(count) || count < 1 || count > maxMines) {
        return { ok: false, message: `Envie um numero inteiro entre 1 e ${maxMines}.` };
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
  usage: "minas [aposta] [quantidade-de-minas] [3|4|5]",
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

      const boardSizeResult = await resolveBoardSize(message, args);
      if (!boardSizeResult.ok) {
        if (boardSizeResult.reason === "invalid") {
          return message.reply({
            embeds: [
              buildCasinoEmbed(message.author, ee.wrongcolor)
                .setTitle(`${emojis.x} Tamanho de tabuleiro invalido`)
                .setDescription(`Use \`${prefix}minas <aposta> <minas> <3|4|5>\`.`)
            ]
          });
        }
        return;
      }
      const boardSize = boardSizeResult.boardSize;
      const maxMines = getBoardTileCount(boardSize) - 1;

      const mineCountResult = await resolveMineCount(message, args, boardSize);
      if (!mineCountResult.ok) return;
      const mineCount = mineCountResult.mineCount;
      if (!Number.isInteger(mineCount) || mineCount < 1 || mineCount > maxMines) {
        return message.reply({
          embeds: [
            buildCasinoEmbed(message.author, ee.wrongcolor)
              .setTitle(`${emojis.x} Quantidade de minas invalida`)
              .setDescription(`Use \`${prefix}minas <aposta> <1-${maxMines}> ${boardSize}\` para o tabuleiro **${boardSize}x${boardSize}**.`)
          ]
        });
      }

      setCasinoCooldown(message.author.id, "minas", settings.casinoCooldownSeconds);

      const state = {
        bet: amount,
        balance: userData.coins,
        boardSize,
        mineCount,
        mineTiles: pickUniqueRandom(getBoardTileCount(boardSize), mineCount),
        revealedSafe: new Set(),
        color: ee.color
      };

      const customPrefix = `minas:${message.author.id}:${Date.now()}`;
      const boardMessage = await message.reply({
        embeds: [createEmbed(message.author, state)],
        components: createBoardRows(customPrefix, state.boardSize, state.revealedSafe, state.mineTiles, null, false, false)
      });

      const controlMessage = await message.reply({
        embeds: [
          buildCasinoEmbed(message.author)
            .setTitle(`${BOMB_ICON} Controles de Minas`)
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
          components: createBoardRows(customPrefix, state.boardSize, state.revealedSafe, state.mineTiles, explodedTile, true, revealAll)
        }).catch(() => null);
        await controlMessage.edit({
          embeds: [
            buildCasinoEmbed(message.author, finalEmbed.data?.color || ee.color)
              .setTitle(`${BOMB_ICON} Controles de Minas`)
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
              `Voce encontrou uma mina na casa **${tile}**.\n${CASH_ICON} Perda: ${formatAmount(state.bet)}\n${WALLET_ICON} Saldo atual: ${formatAmount(newBalance)}`
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
              boardSize: state.boardSize,
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
          components: createBoardRows(customPrefix, state.boardSize, state.revealedSafe, state.mineTiles, null, false, false)
        }).catch(() => null);

        await controlMessage.edit({
          embeds: [
            buildCasinoEmbed(message.author)
              .setTitle(`${BOMB_ICON} Controles de Minas`)
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
              boardSize: state.boardSize,
              mineCount: state.mineCount,
              revealedSafe: [...state.revealedSafe]
            }
          });
          return;
        }

        if (!state.revealedSafe.size) {
          return interaction.reply({ content: `${emojis.x} Abra pelo menos uma casa antes de sacar.`, flags: 64 }).catch(() => null);
        }

        const multiplier = calculateMultiplier(state.mineCount, state.revealedSafe.size, state.boardSize);
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
            [
              `Voce sacou a rodada com **${multiplier}x**.`,
              `${WINNING_ICON} Premio: ${formatAmount(payout)}`,
              `${WALLET_ICON} Saldo atual: ${formatAmount(newBalance)}`
            ].join("\n")
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
            boardSize: state.boardSize,
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
            boardSize: state.boardSize,
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
