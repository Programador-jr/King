const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const ee = require("../../botconfig/embed.json");

const SYMBOL_X = "X";
const SYMBOL_O = "O";
const BOT_PLAYER = "bot";
const EMPTY = null;

const CELL_PREFIX = "ttt_cell_";
const CANCEL_ID = "ttt_cancel";
const RESTART_ID = "ttt_restart";
const MODE_2P_ID = "ttt_mode_2p";

const WIN_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6]
];

function createState(ownerId) {
  return {
    ownerId,
    mode: "bot",
    players: {
      [SYMBOL_X]: ownerId,
      [SYMBOL_O]: BOT_PLAYER
    },
    board: Array(9).fill(EMPTY),
    turn: SYMBOL_X,
    status: "playing",
    busy: false,
    lastWinnerSymbol: null
  };
}

function resetRound(state) {
  state.board = Array(9).fill(EMPTY);
  state.turn = SYMBOL_X;
  state.status = "playing";
  state.lastWinnerSymbol = null;
}

function resetState(state, mode, opponentId) {
  state.mode = mode;
  state.players[SYMBOL_X] = state.ownerId;
  state.players[SYMBOL_O] = mode === "pvp" ? opponentId : BOT_PLAYER;
  resetRound(state);
}

function swapPlayerRoles(state) {
  const currentX = state.players[SYMBOL_X];
  const currentO = state.players[SYMBOL_O];
  state.players[SYMBOL_X] = currentO;
  state.players[SYMBOL_O] = currentX;
}

function getWinner(board) {
  for (const [a, b, c] of WIN_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return null;
}

function isDraw(board) {
  return board.every((cell) => cell !== EMPTY) && !getWinner(board);
}

function boardIsEmpty(board) {
  return board.every((cell) => cell === EMPTY);
}

function availableMoves(board) {
  const moves = [];
  for (let i = 0; i < board.length; i += 1) {
    if (board[i] === EMPTY) moves.push(i);
  }
  return moves;
}

function findWinningMove(board, symbol) {
  const moves = availableMoves(board);
  for (const move of moves) {
    board[move] = symbol;
    const wins = getWinner(board) === symbol;
    board[move] = EMPTY;
    if (wins) return move;
  }
  return null;
}

function randomFrom(list) {
  if (!list.length) return null;
  return list[Math.floor(Math.random() * list.length)];
}

function chooseBotMove(board, botSymbol, humanSymbol) {
  const winNow = findWinningMove(board, botSymbol);
  if (winNow !== null) return winNow;

  const blockNow = findWinningMove(board, humanSymbol);
  if (blockNow !== null) return blockNow;

  if (board[4] === EMPTY) return 4;

  const corners = [0, 2, 6, 8].filter((idx) => board[idx] === EMPTY);
  const cornerChoice = randomFrom(corners);
  if (cornerChoice !== null) return cornerChoice;

  const edges = [1, 3, 5, 7].filter((idx) => board[idx] === EMPTY);
  const edgeChoice = randomFrom(edges);
  if (edgeChoice !== null) return edgeChoice;

  const fallback = availableMoves(board);
  return fallback.length ? fallback[0] : null;
}

function getPlayerLabel(playerId) {
  return playerId === BOT_PLAYER ? "Bot" : `<@${playerId}>`;
}

function getCurrentPlayerId(state) {
  if (state.turn === SYMBOL_X) return state.players[SYMBOL_X];
  return state.players[SYMBOL_O];
}

function getOwnerSymbol(state) {
  if (state.players[SYMBOL_X] === state.ownerId) return SYMBOL_X;
  if (state.players[SYMBOL_O] === state.ownerId) return SYMBOL_O;
  return SYMBOL_X;
}

function getBotSymbol(state) {
  if (state.players[SYMBOL_X] === BOT_PLAYER) return SYMBOL_X;
  if (state.players[SYMBOL_O] === BOT_PLAYER) return SYMBOL_O;
  return null;
}

function getModeLabel(mode) {
  return mode === "pvp" ? "2P" : "Solo";
}

function symbolToDisplay(symbol) {
  return symbol === SYMBOL_X ? "\u274C" : "\u2B55";
}

function cellEmoji(cell) {
  if (cell === SYMBOL_X) return "\u274C";
  if (cell === SYMBOL_O) return "\u2B55";
  return "\u2B1C";
}

function cellStyle(cell) {
  if (cell === SYMBOL_X) return "DANGER";
  if (cell === SYMBOL_O) return "PRIMARY";
  return "SECONDARY";
}

function buildComponents(state, forceDisable = false) {
  const rows = [];
  const boardDisabled = forceDisable || state.status !== "playing";

  for (let row = 0; row < 3; row += 1) {
    const buttons = [];
    for (let col = 0; col < 3; col += 1) {
      const index = row * 3 + col;
      const cell = state.board[index];
      buttons.push(
        new MessageButton()
          .setCustomId(`${CELL_PREFIX}${index}`)
          .setStyle(cellStyle(cell))
          .setEmoji(cellEmoji(cell))
          .setDisabled(boardDisabled || cell !== EMPTY)
      );
    }
    rows.push(new MessageActionRow().addComponents(buttons));
  }

  const controls = [];

  if (state.status === "finished") {
    controls.push(
      new MessageButton().setCustomId(RESTART_ID).setLabel("Reiniciar").setStyle("SUCCESS").setDisabled(forceDisable),
      new MessageButton().setCustomId(MODE_2P_ID).setLabel("2P").setStyle("PRIMARY").setDisabled(forceDisable),
      new MessageButton().setCustomId(CANCEL_ID).setLabel("Fechar").setStyle("DANGER").setDisabled(forceDisable)
    );
  } else {
    if (state.status === "playing" && state.mode === "bot" && boardIsEmpty(state.board)) {
      controls.push(new MessageButton().setCustomId(MODE_2P_ID).setLabel("2P").setStyle("PRIMARY").setDisabled(forceDisable));
    }

    controls.push(
      new MessageButton()
        .setCustomId(CANCEL_ID)
        .setLabel(state.status === "selecting" ? "Aguardando..." : "Cancelar")
        .setStyle("DANGER")
        .setDisabled(forceDisable || state.status === "selecting")
    );
  }

  rows.push(new MessageActionRow().addComponents(controls));
  return rows;
}

function buildEmbed(state, statusText, color = ee.color) {
  const lines = [
    `Modo: \`${getModeLabel(state.mode)}\``,
    `X: ${getPlayerLabel(state.players[SYMBOL_X])}`,
    `O: ${getPlayerLabel(state.players[SYMBOL_O])}`
  ];

  if (state.status === "playing") {
    lines.push(`Vez: ${getPlayerLabel(getCurrentPlayerId(state))} (${state.turn})`);
  }

  if (statusText) {
    lines.push("", statusText);
  }

  return new MessageEmbed()
    .setColor(color)
    .setTitle("Jogo da Velha")
    .setDescription(lines.join("\n"))
    .setFooter(ee.footertext, ee.footericon);
}

function getFinishPayload(state, winner) {
  let color = ee.color;
  let text = "Empate!";

  if (winner === SYMBOL_X || winner === SYMBOL_O) {
    const winnerId = state.players[winner];
    if (state.mode === "bot") {
      if (winnerId === state.ownerId) {
        text = "Voce venceu! \u{1F389}";
      } else {
        color = ee.wrongcolor;
        text = "Eu venci desta vez.";
      }
    } else {
      text = `${getPlayerLabel(winnerId)} venceu! \u{1F389}`;
    }
  }

  return {
    embeds: [buildEmbed(state, text, color)],
    components: buildComponents(state, false)
  };
}

function evaluateRound(state) {
  const winner = getWinner(state.board);
  if (winner) {
    state.status = "finished";
    state.lastWinnerSymbol = winner;
    return { finished: true, winner };
  }

  if (isDraw(state.board)) {
    state.status = "finished";
    state.lastWinnerSymbol = null;
    return { finished: true, winner: null };
  }

  return { finished: false, winner: null };
}

function playBotTurn(state) {
  if (state.mode !== "bot") return { finished: false, winner: null };
  if (getCurrentPlayerId(state) !== BOT_PLAYER) return { finished: false, winner: null };

  const botSymbol = getBotSymbol(state);
  if (!botSymbol) return { finished: false, winner: null };

  const humanSymbol = botSymbol === SYMBOL_X ? SYMBOL_O : SYMBOL_X;
  const move = chooseBotMove(state.board, botSymbol, humanSymbol);
  if (move === null) return evaluateRound(state);

  state.board[move] = botSymbol;

  const check = evaluateRound(state);
  if (!check.finished) {
    state.turn = state.turn === SYMBOL_X ? SYMBOL_O : SYMBOL_X;
  }

  return check;
}

async function askOpponent(message, ownerId) {
  const prompt = await message.channel
    .send(`\`2P\` ativo: <@${ownerId}>, mencione o usuario que vai jogar com voce em ate 30s.`)
    .catch(() => null);

  const collected = await message.channel
    .awaitMessages({
      filter: (m) => m.author.id === ownerId && m.mentions.users.size > 0,
      max: 1,
      time: 30000
    })
    .catch(() => null);

  if (prompt) {
    setTimeout(() => prompt.delete().catch(() => {}), 4000);
  }

  if (!collected || !collected.size) return { ok: false, reason: "timeout" };

  const reply = collected.first();
  if (reply) setTimeout(() => reply.delete().catch(() => {}), 4000);

  const picked = reply.mentions.users.find((user) => !user.bot && user.id !== ownerId) || null;
  if (!picked) return { ok: false, reason: "invalid" };

  return { ok: true, user: picked };
}

module.exports = {
  name: "jogodavelha",
  aliases: ["velha", "ttt"],
  usage: "jogodavelha [@usuario]",
  description: "Jogue jogo da velha contra o bot ou no modo 2P usando botoes.",
  category: "Jogos",
  cooldown: 3,
  run: async (client, message, args) => {
    const state = createState(message.author.id);
    const mentionedUser = message.mentions.users.first() || null;

    if (mentionedUser) {
      if (mentionedUser.bot || mentionedUser.id === message.author.id) {
        return message.reply({
          embeds: [
            buildEmbed(
              state,
              `${client.allEmojis.x} Mencione um usuario valido (nao bot e diferente de voce).`,
              ee.wrongcolor
            )
          ]
        });
      }

      resetState(state, "pvp", mentionedUser.id);
    }

    const introText =
      state.mode === "pvp"
        ? `Modo 2P iniciado com ${getPlayerLabel(state.players[SYMBOL_O])}. ${getPlayerLabel(
            state.players[SYMBOL_X]
          )} comeca.`
        : `Voce joga com ${symbolToDisplay(getOwnerSymbol(state))}. Clique em uma casa para comecar ou use 2P.`;

    const gameMessage = await message
      .reply({
        embeds: [buildEmbed(state, introText)],
        components: buildComponents(state, false)
      })
      .catch(() => null);

    if (!gameMessage) return;

    const collector = gameMessage.createMessageComponentCollector({ time: 180000 });

    collector.on("collect", async (interaction) => {
      if (state.busy) {
        return interaction
          .reply({
            content: `${client.allEmojis.x} Aguarde a acao atual terminar.`,
            ephemeral: true
          })
          .catch(() => {});
      }

      const isControl =
        interaction.customId === CANCEL_ID ||
        interaction.customId === RESTART_ID ||
        interaction.customId === MODE_2P_ID;

      if (isControl && interaction.user.id !== state.ownerId) {
        return interaction
          .reply({
            content: `${client.allEmojis.x} Apenas quem iniciou o jogo pode usar este botao.`,
            ephemeral: true
          })
          .catch(() => {});
      }

      if (interaction.customId === CANCEL_ID) {
        collector.stop("cancelled");
        return interaction
          .update({
            embeds: [buildEmbed(state, "Jogo encerrado.", ee.wrongcolor)],
            components: buildComponents(state, true)
          })
          .catch(() => {});
      }

      if (interaction.customId === RESTART_ID) {
        if (state.status !== "finished") return interaction.deferUpdate().catch(() => {});

        const previousWinner = state.lastWinnerSymbol;
        const shouldSwap = previousWinner !== SYMBOL_X;

        if (state.mode === "bot") {
          state.mode = "bot";
          if (shouldSwap) swapPlayerRoles(state);
          resetRound(state);

          const botCheck = playBotTurn(state);
          if (botCheck.finished) {
            return interaction
              .update(getFinishPayload(state, botCheck.winner))
              .catch(() => {});
          }

          const ownerSymbol = getOwnerSymbol(state);
          const restartText =
            previousWinner === null
              ? state.players[SYMBOL_X] === BOT_PLAYER
                ? `Empate: ordem alternada. Agora voce e ${symbolToDisplay(ownerSymbol)} e eu comeco.`
                : `Empate: ordem alternada. Agora voce e ${symbolToDisplay(ownerSymbol)} e comeca jogando.`
              : state.players[SYMBOL_X] === BOT_PLAYER
                ? `Vencedor da ultima começa. Agora voce e ${symbolToDisplay(ownerSymbol)} e eu comeco.`
                : `Vencedor da ultima começa. Agora voce e ${symbolToDisplay(ownerSymbol)} e comeca jogando.`;

          return interaction
            .update({
              embeds: [buildEmbed(state, restartText)],
              components: buildComponents(state, false)
            })
            .catch(() => {});
        }

        state.mode = "pvp";
        if (shouldSwap) swapPlayerRoles(state);
        resetRound(state);

        return interaction
          .update({
            embeds: [
              buildEmbed(
                state,
                previousWinner === null
                  ? "Empate: ordem alternada para a nova partida."
                  : "Vencedor da ultima partida comeca esta rodada."
              )
            ],
            components: buildComponents(state, false)
          })
          .catch(() => {});
      }

      if (interaction.customId === MODE_2P_ID) {
        if (state.mode === "pvp" && state.status === "playing") {
          return interaction
            .reply({
              content: `${client.allEmojis.x} Esta partida ja esta no modo 2P.`,
              ephemeral: true
            })
            .catch(() => {});
        }

        const canSwitchTo2p =
          state.status === "finished" || (state.status === "playing" && state.mode === "bot" && boardIsEmpty(state.board));

        if (!canSwitchTo2p) {
          return interaction
            .reply({
              content: `${client.allEmojis.x} O 2P so pode ser iniciado antes da primeira jogada ou apos o fim da partida.`,
              ephemeral: true
            })
            .catch(() => {});
        }

        const previousStatus = state.status;
        state.busy = true;
        state.status = "selecting";

        await interaction
          .update({
            embeds: [buildEmbed(state, "Aguardando voce mencionar o segundo jogador.")],
            components: buildComponents(state, true)
          })
          .catch(() => {});

        const picked = await askOpponent(message, state.ownerId);

        if (!picked.ok) {
          state.status = previousStatus;
          state.busy = false;

          return gameMessage
            .edit({
              embeds: [
                buildEmbed(
                  state,
                  picked.reason === "invalid"
                    ? "Nao foi possivel iniciar 2P. Mencione um usuario valido (nao bot e diferente de voce)."
                    : "Tempo para escolher o jogador 2P expirou.",
                  ee.wrongcolor
                )
              ],
              components: buildComponents(state, false)
            })
            .catch(() => {});
        }

        resetState(state, "pvp", picked.user.id);
        state.busy = false;

        return gameMessage
          .edit({
            embeds: [
              buildEmbed(
                state,
                `Modo 2P iniciado com ${getPlayerLabel(picked.user.id)}. ${getPlayerLabel(
                  state.players[SYMBOL_X]
                )} comeca.`
              )
            ],
            components: buildComponents(state, false)
          })
          .catch(() => {});
      }

      if (!interaction.customId.startsWith(CELL_PREFIX)) {
        return interaction.deferUpdate().catch(() => {});
      }

      if (state.status !== "playing") {
        return interaction.deferUpdate().catch(() => {});
      }

      const index = Number(interaction.customId.slice(CELL_PREFIX.length));
      if (!Number.isInteger(index) || index < 0 || index > 8) {
        return interaction.deferUpdate().catch(() => {});
      }

      if (state.board[index] !== EMPTY) {
        return interaction
          .reply({
            content: `${client.allEmojis.x} Essa casa ja foi usada.`,
            ephemeral: true
          })
          .catch(() => {});
      }

      if (state.mode === "bot") {
        const expectedPlayerId = getCurrentPlayerId(state);
        if (expectedPlayerId === BOT_PLAYER) {
          return interaction
            .reply({
              content: `${client.allEmojis.x} Aguarde minha jogada.`,
              ephemeral: true
            })
            .catch(() => {});
        }

        if (interaction.user.id !== expectedPlayerId) {
          return interaction
            .reply({
              content: `${client.allEmojis.x} Apenas quem iniciou pode jogar esta partida.`,
              ephemeral: true
            })
            .catch(() => {});
        }

        state.board[index] = state.turn;

        let check = evaluateRound(state);
        if (check.finished) {
          return interaction
            .update(getFinishPayload(state, check.winner))
            .catch(() => {});
        }

        state.turn = state.turn === SYMBOL_X ? SYMBOL_O : SYMBOL_X;
        check = playBotTurn(state);
        if (check.finished) {
          return interaction
            .update(getFinishPayload(state, check.winner))
            .catch(() => {});
        }

        return interaction
          .update({
            embeds: [buildEmbed(state, "Sua vez. Escolha outra casa.")],
            components: buildComponents(state, false)
          })
          .catch(() => {});
      }

      const expectedPlayerId = getCurrentPlayerId(state);
      if (interaction.user.id !== expectedPlayerId) {
        return interaction
          .reply({
            content: `${client.allEmojis.x} Nao e sua vez.`,
            ephemeral: true
          })
          .catch(() => {});
      }

      state.board[index] = state.turn;

      const check = evaluateRound(state);
      if (check.finished) {
        return interaction
          .update(getFinishPayload(state, check.winner))
          .catch(() => {});
      }

      state.turn = state.turn === SYMBOL_X ? SYMBOL_O : SYMBOL_X;

      return interaction
        .update({
          embeds: [buildEmbed(state, "Jogada registrada.")],
          components: buildComponents(state, false)
        })
        .catch(() => {});
    });

    collector.on("end", async (_, reason) => {
      if (reason === "cancelled") return;

      await gameMessage
        .edit({
          embeds: [buildEmbed(state, "Tempo esgotado. Rode o comando novamente.", ee.wrongcolor)],
          components: buildComponents(state, true)
        })
        .catch(() => {});
    });
  }
};
