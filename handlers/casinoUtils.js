const Discord = require("discord.js");
const ee = require("../botconfig/embed.json");
const emojis = require("../botconfig/emojis.json");
const UserCoins = require("../databases/kingcoin");
const CasinoHistory = require("../databases/casinoHistory");

const DEFAULT_CASINO_SETTINGS = {
  casinoMinBet: 50,
  casinoMaxBet: 250000,
  casinoCooldownSeconds: 5,
  casinoLogChannelId: null,
  casinoSuspiciousBetThreshold: 100000
};

const sessionCooldowns = new Map();
const activeCasinoSessions = new Map();

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function formatAmount(amount) {
  return `**${Number(amount || 0).toLocaleString()}** ${emojis.King_Coin}`;
}

function buildCasinoEmbed(user, color = ee.color, thumbnail = null) {
  const embed = new Discord.MessageEmbed()
    .setColor(color)
    .setAuthor(`${user.tag}`, user.displayAvatarURL({ dynamic: true, size: 2048 }))
    .setFooter(ee.footertext, ee.footericon);
  if (thumbnail) embed.setThumbnail(thumbnail);
  return embed;
}

function ensureCasinoSettings(client, guildId) {
  if (!client?.settings || !guildId) return { ...DEFAULT_CASINO_SETTINGS };

  client.settings.ensure(guildId, { ...DEFAULT_CASINO_SETTINGS });
  return {
    casinoMinBet: Number(client.settings.get(guildId, "casinoMinBet") ?? DEFAULT_CASINO_SETTINGS.casinoMinBet),
    casinoMaxBet: Number(client.settings.get(guildId, "casinoMaxBet") ?? DEFAULT_CASINO_SETTINGS.casinoMaxBet),
    casinoCooldownSeconds: Number(client.settings.get(guildId, "casinoCooldownSeconds") ?? DEFAULT_CASINO_SETTINGS.casinoCooldownSeconds),
    casinoLogChannelId: client.settings.get(guildId, "casinoLogChannelId") || null,
    casinoSuspiciousBetThreshold: Number(client.settings.get(guildId, "casinoSuspiciousBetThreshold") ?? DEFAULT_CASINO_SETTINGS.casinoSuspiciousBetThreshold)
  };
}

function parseBet(value, balance = 0) {
  const raw = normalizeText(value);
  if (!raw) return null;
  if (["all", "max", "tudo"].includes(raw)) return balance;
  if (!/^\d+$/.test(raw)) return null;

  const amount = parseInt(raw, 10);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return amount;
}

async function getUserData(userId) {
  return UserCoins.findOneOrCreate(userId);
}

async function applyGameResult(userId, currentCoins, netChange) {
  const update = { $inc: { coins: netChange } };
  if (netChange > 0) {
    update.$inc.totalEarned = netChange;
  }

  await UserCoins.findOneAndUpdate({ userId }, update, { upsert: true });
  return currentCoins + netChange;
}

function validateBetAmount(amount, balance, settings) {
  if (!amount) return { ok: false, code: "invalid" };
  if (amount < settings.casinoMinBet) return { ok: false, code: "min", limit: settings.casinoMinBet };
  if (amount > settings.casinoMaxBet) return { ok: false, code: "max", limit: settings.casinoMaxBet };
  if (balance < amount) return { ok: false, code: "funds" };
  return { ok: true };
}

function getCasinoCooldownKey(userId, game) {
  return `${userId}:${game}`;
}

function getRemainingCooldown(userId, game) {
  const key = getCasinoCooldownKey(userId, game);
  const expiresAt = sessionCooldowns.get(key);
  if (!expiresAt) return 0;
  const remaining = expiresAt - Date.now();
  if (remaining <= 0) {
    sessionCooldowns.delete(key);
    return 0;
  }
  return remaining;
}

function setCasinoCooldown(userId, game, seconds) {
  const key = getCasinoCooldownKey(userId, game);
  const expiresAt = Date.now() + seconds * 1000;
  sessionCooldowns.set(key, expiresAt);
  setTimeout(() => {
    const current = sessionCooldowns.get(key);
    if (current === expiresAt) sessionCooldowns.delete(key);
  }, seconds * 1000 + 1000);
}

async function logCasinoEvent(client, context, payload) {
  const guildId = context?.guild?.id || context?.guildId || null;
  const channelId = context?.channel?.id || context?.channelId || null;

  await CasinoHistory.create({
    guildId,
    channelId,
    ...payload
  }).catch(() => null);

  if (!client || !guildId) return;
  const settings = ensureCasinoSettings(client, guildId);
  const shouldSendChannelLog =
    !!settings.casinoLogChannelId &&
    (
      payload.outcome === "blocked" ||
      Math.abs(payload.bet || 0) >= settings.casinoSuspiciousBetThreshold ||
      Math.abs(payload.netChange || 0) >= settings.casinoSuspiciousBetThreshold
    );

  if (!shouldSendChannelLog) return;

  const channel = context.guild?.channels?.cache?.get(settings.casinoLogChannelId);
  if (!channel?.send) return;

  const userTag = context.author?.tag || context.user?.tag || payload.userId;
  const embed = new Discord.MessageEmbed()
    .setColor(payload.outcome === "blocked" ? ee.wrongcolor : ee.color)
    .setTitle("Log do Cassino")
    .setDescription(`Usuario: <@${payload.userId}> (${userTag})`)
    .addField("Jogo", payload.game, true)
    .addField("Aposta", formatAmount(payload.bet || 0), true)
    .addField("Resultado", payload.outcome, true)
    .addField("Variacao", formatAmount(payload.netChange || 0), true)
    .addField("Motivo", payload.reason || "Sem detalhes", false)
    .setFooter(ee.footertext, ee.footericon)
    .setTimestamp();

  await channel.send({ embeds: [embed] }).catch(() => null);
}

async function sendOrReply(context, payload) {
  if (context?.interaction) {
    if (context.interaction.deferred || context.interaction.replied) {
      return context.interaction.followUp({ ...payload, fetchReply: true });
    }
    return context.interaction.reply({ ...payload, fetchReply: true });
  }
  return context.reply(payload);
}

function getPromptChannel(context) {
  return context?.interaction?.channel || context?.channel || null;
}

function getPromptUser(context) {
  return context?.author || context?.user || context?.interaction?.user || null;
}

function registerCasinoSession(userId, game) {
  if (activeCasinoSessions.has(userId)) {
    return false;
  }
  activeCasinoSessions.set(userId, {
    game,
    startedAt: Date.now()
  });
  return true;
}

function endCasinoSession(userId) {
  activeCasinoSessions.delete(userId);
}

function getActiveCasinoSession(userId) {
  return activeCasinoSessions.get(userId) || null;
}

async function promptForText(context, promptPayload, validateInput, timeoutMs = 60000) {
  const promptMessage = await sendOrReply(context, promptPayload);
  const channel = getPromptChannel(context);
  const user = getPromptUser(context);

  if (!channel?.awaitMessages || !user?.id) {
    return { ok: false, reason: "unsupported" };
  }

  const collected = await channel.awaitMessages({
    filter: (msg) => msg.author.id === user.id,
    max: 1,
    time: timeoutMs,
    errors: ["time"]
  }).catch(() => null);

  if (!collected?.size) {
    await promptMessage.edit({
      embeds: [
        buildCasinoEmbed(user, ee.wrongcolor)
          .setTitle(`${emojis.x} Tempo esgotado`)
          .setDescription("A configuracao da jogada expirou.")
      ],
      components: []
    }).catch(() => null);
    return { ok: false, reason: "timeout", promptMessage };
  }

  const answer = collected.first();
  const validation = validateInput(answer.content);
  await answer.delete().catch(() => null);

  if (!validation?.ok) {
    await promptMessage.edit({
      embeds: [
        buildCasinoEmbed(user, ee.wrongcolor)
          .setTitle(`${emojis.x} Resposta invalida`)
          .setDescription(validation?.message || "A resposta enviada nao e valida.")
      ],
      components: []
    }).catch(() => null);
    return { ok: false, reason: "invalid", promptMessage };
  }

  return {
    ok: true,
    value: validation.value,
    promptMessage
  };
}

function createInvalidBetEmbed(user, prefix, balance, settings = null) {
  const minLine = settings ? `Aposta minima: ${formatAmount(settings.casinoMinBet)}.\n` : "";
  return buildCasinoEmbed(user, ee.wrongcolor)
    .setTitle(`${emojis.x} Aposta invalida`)
    .setDescription(`${minLine}Informe uma aposta valida maior que zero.`)
    .addField("Exemplo", `\`${prefix}slots 250\``, false)
    .addField("Seu saldo", formatAmount(balance), true);
}

function createInsufficientFundsEmbed(user, attemptedAmount, balance) {
  return buildCasinoEmbed(user, ee.wrongcolor)
    .setTitle(`${emojis.x} Saldo insuficiente`)
    .setDescription(`Voce tentou apostar ${formatAmount(attemptedAmount)}, mas possui apenas ${formatAmount(balance)}.`);
}

function createBetLimitEmbed(user, prefix, settings, reasonCode, amount) {
  if (reasonCode === "min") {
    return buildCasinoEmbed(user, ee.wrongcolor)
      .setTitle(`${emojis.x} Aposta muito baixa`)
      .setDescription(`A aposta minima neste cassino e ${formatAmount(settings.casinoMinBet)}.`)
      .addField("Exemplo", `\`${prefix}slots ${settings.casinoMinBet}\``, false);
  }

  return buildCasinoEmbed(user, ee.wrongcolor)
    .setTitle(`${emojis.x} Aposta acima do limite`)
    .setDescription(`A aposta maxima neste cassino e ${formatAmount(settings.casinoMaxBet)}.`)
    .addField("Tentativa", formatAmount(amount), true);
}

function createCooldownEmbed(user, remainingMs) {
  const seconds = Math.ceil(remainingMs / 1000);
  return buildCasinoEmbed(user, ee.wrongcolor)
    .setTitle(`${emojis.loading} Aguarde para jogar novamente`)
    .setDescription(`Voce ainda precisa esperar **${seconds}s** antes de iniciar outra rodada desse jogo.`);
}

function createSessionBusyEmbed(user, session) {
  return buildCasinoEmbed(user, ee.wrongcolor)
    .setTitle(`${emojis.x} Mesa ja aberta`)
    .setDescription(`Voce ja tem uma sessao ativa de **${session.game}**. Termine ou espere ela expirar antes de abrir outra.`);
}

module.exports = {
  emojis,
  ee,
  DEFAULT_CASINO_SETTINGS,
  normalizeText,
  formatAmount,
  buildCasinoEmbed,
  ensureCasinoSettings,
  parseBet,
  getUserData,
  applyGameResult,
  validateBetAmount,
  getRemainingCooldown,
  setCasinoCooldown,
  logCasinoEvent,
  sendOrReply,
  promptForText,
  registerCasinoSession,
  endCasinoSession,
  getActiveCasinoSession,
  createInvalidBetEmbed,
  createInsufficientFundsEmbed,
  createBetLimitEmbed,
  createCooldownEmbed,
  createSessionBusyEmbed
};
