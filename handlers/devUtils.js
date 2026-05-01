const axios = require("axios");
const ee = require("../botconfig/embed.json");
const config = require("../botconfig/config.json");
const BotBan = require("../databases/botBan");
const UserCoins = require("../databases/kingcoin");
const emojis = require("../botconfig/emojis.json");

function getDeveloperIds() {
  var configIds = Array.isArray(config.devIds) ? config.devIds : [];
  var envIds = String(process.env.DEV_IDS || process.env.OWNER_ID || "")
    .split(",")
    .map(function(v) { return v.trim(); })
    .filter(function(v) { return v; });
  return [...new Set([].concat(configIds, envIds))];
}

function isDeveloper(userId) {
  return getDeveloperIds().includes(String(userId));
}

function parseDurationInput(rawValue) {
  var value = String(rawValue || "").trim().toLowerCase();
  if (!value || ["perm", "perma", "permanente", "permanent", "0", "none"].includes(value)) {
    return { ok: true, ms: null, label: "Permanente" };
  }
  var match = value.match(/^(\d+)\s*(m|min|h|d|w)$/i);
  if (!match) {
    return { ok: false, message: "Use duracões como 30m, 12h, 7d, 2w ou permanente." };
  }
  var amount = parseInt(match[1], 10);
  var unit = match[2].toLowerCase();
  var multiplier = 0;
  if (unit === "m" || unit === "min") multiplier = 60000;
  if (unit === "h") multiplier = 3600000;
  if (unit === "d") multiplier = 86400000;
  if (unit === "w") multiplier = 604800000;
  if (!amount || !multiplier) {
    return { ok: false, message: "Duracão invalida." };
  }
  var ms = amount * multiplier;
  var labels = { m: "minuto(s)", min: "minuto(s)", h: "hora(s)", d: "dia(s)", w: "semana(s)" };
  return { ok: true, ms: ms, label: amount + " " + labels[unit] };
}

function formatBanDuration(banRecord) {
  if (!banRecord || !banRecord.expiresAt) return "Permanente";
  var expiresAt = new Date(banRecord.expiresAt);
  if (expiresAt.getTime() <= Date.now()) return "Expirado";
  return "<t:" + Math.floor(expiresAt.getTime() / 1000) + ":R>";
}

async function getBotBan(userId) {
  if (!userId) return null;
  var banRecord = await BotBan.findOne({ userId: String(userId) }).lean();
  if (!banRecord) return null;
  if (banRecord.expiresAt && new Date(banRecord.expiresAt).getTime() <= Date.now()) {
    await BotBan.deleteOne({ userId: String(userId) }).catch(function() {});
    return null;
  }
  return banRecord;
}

async function sendWebhookLog(payload) {
  var webhookUrl = String(process.env.LOGS_MOD || "").trim();
  if (!webhookUrl) {
    console.log("[sendWebhookLog] LOGS_MOD nao configurado");
    return;
  }
  if (!webhookUrl.startsWith("https://discord.com/api/webhooks/")) {
    console.error("[sendWebhookLog] URL invalida:", webhookUrl.substring(0, 50));
    return;
  }
  try {
    var response = await axios.post(webhookUrl, payload, {
      timeout: 5000,
      headers: { "Content-Type": "application/json" }
    });
    console.log("[sendWebhookLog] Webhook enviado:", response.status);
  } catch (error) {
    console.error("[sendWebhookLog] Erro:", error.message);
    if (error.response) {
      console.error("[sendWebhookLog] Status:", error.response.status);
    }
  }
}

async function sendDevActionLog(action, data) {
  data = data || {};
  var colorMap = { ban: 0xef4444, unban: 0x22c55e, addkc: 0x00bfff, removekc: 0xf59e0b };
  var embed = {
    title: "Dev Action: " + action,
    color: colorMap[action] || 0x5865f2,
    fields: [
      { name: "Usuario", value: data.targetTag ? data.targetTag + " (" + data.targetId + ")" : String(data.targetId || "desconhecido"), inline: false },
      { name: "Executor", value: data.executorTag ? data.executorTag + " (" + data.executorId + ")" : String(data.executorId || "desconhecido"), inline: false }
    ],
    timestamp: new Date().toISOString()
  };
  if (ee.footertext || ee.footericon) {
    embed.footer = { text: ee.footertext || "King" };
    if (ee.footericon) embed.footer.icon_url = ee.footericon;
  }
  if (data.reason) embed.fields.push({ name: "Motivo", value: String(data.reason), inline: false });
  if (data.durationLabel) embed.fields.push({ name: "Duracao", value: String(data.durationLabel), inline: true });
  if (typeof data.amount === "number") embed.fields.push({ name: "KC", value: "+/- " + data.amount.toLocaleString() + " " + emojis.King_Coin, inline: true });
  if (typeof data.newBalance === "number") embed.fields.push({ name: "Novo saldo", value: data.newBalance.toLocaleString() + " " + emojis.King_Coin, inline: true });
  await sendWebhookLog({ embeds: [embed] });
}

async function notifyUserBotBan(client, targetId, reason, durationLabel) {
  var user = await client.users.fetch(String(targetId)).catch(function() { return null; });
  if (!user) return null;
  var MessageEmbed = require("discord.js").MessageEmbed;
  var embed = new MessageEmbed()
    .setColor(ee.wrongcolor)
    .setTitle("Você foi banido do King")
    .setDescription(reason || "Sem motivo informado.")
    .addField("Duracão", durationLabel || "Permanente", true)
    .setFooter(ee.footertext, ee.footericon);
  await user.send({ embeds: [embed] }).catch(function() {});
  return user;
}

async function applyBotBan(params) {
  var client = params.client;
  var targetId = params.targetId;
  var executorId = params.executorId;
  var reason = params.reason;
  var durationInput = params.durationInput;
  var parsedDuration = parseDurationInput(durationInput);
  if (!parsedDuration.ok) return parsedDuration;
  var expiresAt = parsedDuration.ms ? new Date(Date.now() + parsedDuration.ms) : null;
  var banRecord = await BotBan.findOneAndUpdate(
    { userId: String(targetId) },
    { $set: { bannedBy: String(executorId), reason: reason || "Sem motivo informado.", expiresAt: expiresAt, durationLabel: parsedDuration.label || "Permanente" } },
    { upsert: true, returnDocument: "after" }
  );
  var targetUser = await notifyUserBotBan(client, targetId, reason, parsedDuration.label);
  var executorUser = await client.users.fetch(String(executorId)).catch(function() { return null; });
  await sendDevActionLog("ban", {
    targetId: String(targetId),
    targetTag: targetUser ? targetUser.tag : null,
    executorId: String(executorId),
    executorTag: executorUser ? executorUser.tag : null,
    reason: reason,
    durationLabel: parsedDuration.label
  });
  return { ok: true, banRecord: banRecord, durationLabel: parsedDuration.label, targetUser: targetUser };
}

async function revokeBotBan(params) {
  var client = params.client;
  var targetId = params.targetId;
  var executorId = params.executorId;
  var deleted = await BotBan.findOneAndDelete({ userId: String(targetId) });
  var targetUser = await client.users.fetch(String(targetId)).catch(function() { return null; });
  var executorUser = await client.users.fetch(String(executorId)).catch(function() { return null; });
  await sendDevActionLog("unban", {
    targetId: String(targetId),
    targetTag: targetUser ? targetUser.tag : null,
    executorId: String(executorId),
    executorTag: executorUser ? executorUser.tag : null
  });
  return { ok: true, deleted: deleted, targetUser: targetUser };
}

async function addKingCoins(params) {
  var client = params.client;
  var targetId = params.targetId;
  var amount = params.amount;
  var executorId = params.executorId;
  var userData = await UserCoins.findOneOrCreate(String(targetId));
  await UserCoins.findOneAndUpdate(
    { userId: String(targetId) },
    { $inc: { coins: amount, totalEarned: amount } }
  );
  var targetUser = await client.users.fetch(String(targetId)).catch(function() { return null; });
  var executorUser = await client.users.fetch(String(executorId)).catch(function() { return null; });
  await sendDevActionLog("addkc", {
    targetId: String(targetId),
    targetTag: targetUser ? targetUser.tag : null,
    executorId: String(executorId),
    executorTag: executorUser ? executorUser.tag : null,
    amount: amount,
    newBalance: userData.coins + amount
  });
  return { ok: true, targetUser: targetUser, previousBalance: userData.coins, newBalance: userData.coins + amount };
}

async function removeKingCoins(params) {
  var client = params.client;
  var targetId = params.targetId;
  var amount = params.amount;
  var executorId = params.executorId;
  var userData = await UserCoins.findOneOrCreate(String(targetId));
  if (userData.coins < amount) {
    return { ok: false, code: "insufficient_funds", currentBalance: userData.coins };
  }
  await UserCoins.findOneAndUpdate(
    { userId: String(targetId) },
    { $inc: { coins: -amount } }
  );
  var targetUser = await client.users.fetch(String(targetId)).catch(function() { return null; });
  var executorUser = await client.users.fetch(String(executorId)).catch(function() { return null; });
  await sendDevActionLog("removekc", {
    targetId: String(targetId),
    targetTag: targetUser ? targetUser.tag : null,
    executorId: String(executorId),
    executorTag: executorUser ? executorUser.tag : null,
    amount: amount,
    newBalance: userData.coins - amount
  });
  return { ok: true, targetUser: targetUser, previousBalance: userData.coins, newBalance: userData.coins - amount };
}

module.exports = {
  getDeveloperIds: getDeveloperIds,
  isDeveloper: isDeveloper,
  parseDurationInput: parseDurationInput,
  formatBanDuration: formatBanDuration,
  getBotBan: getBotBan,
  sendDevActionLog: sendDevActionLog,
  applyBotBan: applyBotBan,
  revokeBotBan: revokeBotBan,
  addKingCoins: addKingCoins,
  removeKingCoins: removeKingCoins
};
