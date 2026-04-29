const Discord = require("discord.js");
const axios = require("axios");
const ee = require("../botconfig/embed.json");
const config = require("../botconfig/config.json");
const BotBan = require("../databases/botBan");
const UserCoins = require("../databases/kingcoin");
const emojis = require("../botconfig/emojis.json");

function getDeveloperIds() {
  const configIds = Array.isArray(config.devIds) ? config.devIds : [];
  const envIds = String(process.env.DEV_IDS || process.env.OWNER_ID || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return [...new Set([...configIds, ...envIds])];
}

function isDeveloper(userId) {
  return getDeveloperIds().includes(String(userId));
}

function parseDurationInput(rawValue) {
  const value = String(rawValue || "").trim().toLowerCase();
  if (!value || ["perm", "perma", "permanente", "permanent", "0", "none"].includes(value)) {
    return { ok: true, ms: null, label: "Permanente" };
  }
  const match = value.match(/^(\d+)\s*(m|min|h|d|w)$/i);
  if (!match) {
    return { ok: false, message: "Use duracoes como `30m`, `12h`, `7d`, `2w` ou `permanente`." };
  }
  const amount = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  const multiplier = {
    m: 60 * 1000,
    min: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000
  }[unit];
  if (!amount || !multiplier) {
    return { ok: false, message: "Duracao invalida." };
  }
  const ms = amount * multiplier;
  const labels = { m: "minuto(s)", min: "minuto(s)", h: "hora(s)", d: "dia(s)", w: "semana(s)" };
  return { ok: true, ms, label: `${amount} ${labels[unit]}` };
}

function formatBanDuration(banRecord) {
  if (!banRecord?.expiresAt) return "Permanente";
  const expiresAt = new Date(banRecord.expiresAt);
  if (expiresAt.getTime() <= Date.now()) return "Expirado";
  return `<t:${Math.floor(expiresAt.getTime() / 1000)}:R>`;
}

async function getBotBan(userId) {
  if (!userId) return null;
  const banRecord = await BotBan.findOne({ userId: String(userId) }).lean();
  if (!banRecord) return null;
  if (banRecord.expiresAt && new Date(banRecord.expiresAt).getTime() <= Date.now()) {
    await BotBan.deleteOne({ userId: String(userId) }).catch(() => null);
    return null;
  }
  return banRecord;
}

function createBotBanEmbed(client, banRecord) {
  return new Discord.MessageEmbed()
    .setColor(ee.wrongcolor)
    .setTitle(`${client?.allEmojis?.x || "❌"} Voce foi banido de usar o King`)
    .setDescription(banRecord?.reason || "Sem motivo informado.")
    .addField("Duracao", formatBanDuration(banRecord), true)
    .setFooter(ee.footertext, ee.footericon);
}

async function sendWebhookLog(payload) {
  const webhookUrl = String(process.env.LOGS_MOD || "").trim();
  if (!webhookUrl) {
    console.log("[sendWebhookLog] LOGS_MOD nao configurado");
    return;
  }
  if (!webhookUrl.startsWith("https://discord.com/api/webhooks/")) {
    console.error("[sendWebhookLog] URL invalida:", webhookUrl.substring(0, 50));
    return;
  }
  try {
    const response = await axios.post(webhookUrl, payload, {
      timeout: 5000,
      headers: { 'Content-Type': 'application/json' }
    });
    console.log("[sendWebhookLog] Webhook enviado:", response.status);
  } catch (error) {
    console.error("[sendWebhookLog] Erro:", error.message);
    if (error.response) {
      console.error("[sendWebhookLog] Status:", error.response.status);
      console.error("[sendWebhookLog] Resposta:", error.response.data);
    }
  }
}

async function sendDevActionLog(action, data = {}) {
  const colorMap = {
    ban: 0xef4444,
    unban: 0x22c55e,
    addkc: 0x00bfff,
    removekc: 0xf59e0b
  };
  const embed = {
    title: `Dev Action: ${action}`,
    color: colorMap[action] || 0x5865f2,
    fields: [
      { name: "Usuario", value: data.targetTag ? `${data.targetTag} (${data.targetId})` : String(data.targetId || "desconhecido"), inline: false },
      { name: "Executor", value: data.executorTag ? `${data.executorTag} (${data.executorId})` : String(data.executorId || "desconhecido"), inline: false }
    ],
    timestamp: new Date().toISOString()
  };
  if (ee.footertext || ee.footericon) {
    embed.footer = { text: ee.footertext || "King" };
    if (ee.footericon) embed.footer.icon_url = ee.footericon;
  }
  if (data.reason) embed.fields.push({ name: "Motivo", value: String(data.reason), inline: false });
  if (data.durationLabel) embed.fields.push({ name: "Duracao", value: String(data.durationLabel), inline: true });
  if (typeof data.amount === "number") embed.fields.push({ name: "KC", value: `+/- ${data.amount.toLocaleString()} ${emojis.King_Coin}`, inline: true });
  if (typeof data.newBalance === "number") embed.fields.push({ name: "Novo saldo", value: `${data.newBalance.toLocaleString()} ${emojis.King_Coin}`, inline: true });
  await sendWebhookLog({ embeds: [embed] });
}

async function notifyUserBotBan(client, targetId, reason, durationLabel) {
  const user = await client.users.fetch(String(targetId)).catch(() => null);
  if (!user) return null;
  const embed = new Discord.MessageEmbed()
    .setColor(ee.wrongcolor)
    .setTitle("Voce foi banido de usar o King")
    .setDescription(reason || "Sem motivo informado.")
    .addField("Duracao", durationLabel || "Permanente", true)
    .setFooter(ee.footertext, ee.footericon);
  await user.send({ embeds: [embed] }).catch(() => null);
  return user;
}

async function applyBotBan({ client, targetId, executorId, reason, durationInput }) {
  const parsedDuration = parseDurationInput(durationInput);
  if (!parsedDuration.ok) return parsedDuration;
  const expiresAt = parsedDuration.ms ? new Date(Date.now() + parsedDuration.ms) : null;
  const banRecord = await BotBan.findOneAndUpdate(
    { userId: String(targetId) },
    { $set: { bannedBy: String(executorId), reason: reason || "Sem motivo informado.", expiresAt } },
    { upsert: true, returnDocument: 'after' }
  );
  const targetUser = await notifyUserBotBan(client, targetId, reason, parsedDuration.label);
  const executorUser = await client.users.fetch(String(executorId)).catch(() => null);
  await sendDevActionLog("ban", {
    targetId: String(targetId),
    targetTag: targetUser?.tag || null,
    executorId: String(executorId),
    executorTag: executorUser?.tag || null,
    reason,
    durationLabel: parsedDuration.label
  });
  return { ok: true, banRecord, durationLabel: parsedDuration.label, targetUser };
}

async function revokeBotBan({ client, targetId, executorId }) {
  const deleted = await BotBan.findOneAndDelete({ userId: String(targetId) });
  const targetUser = await client.users.fetch(String(targetId)).catch(() => null);
  const executorUser = await client.users.fetch(String(executorId)).catch(() => null);
  await sendDevActionLog("unban", {
    targetId: String(targetId),
    targetTag: targetUser?.tag || null,
    executorId: String(executorId),
    executorTag: executorUser?.tag || null
  });
  return { ok: true, deleted, targetUser };
}

async function addKingCoins({ client, targetId, amount, executorId }) {
  const userData = await UserCoins.findOneOrCreate(String(targetId));
  await UserCoins.findOneAndUpdate(
    { userId: String(targetId) },
    { $inc: { coins: amount, totalEarned: amount } }
  );
  const targetUser = await client.users.fetch(String(targetId)).catch(() => null);
  const executorUser = await client.users.fetch(String(executorId)).catch(() => null);
  await sendDevActionLog("addkc", {
    targetId: String(targetId),
    targetTag: targetUser?.tag || null,
    executorId: String(executorId),
    executorTag: executorUser?.tag || null,
    amount,
    newBalance: userData.coins + amount
  });
  return { ok: true, targetUser, previousBalance: userData.coins, newBalance: userData.coins + amount };
}

async function removeKingCoins({ client, targetId, amount, executorId }) {
  const userData = await UserCoins.findOneOrCreate(String(targetId));
  if (userData.coins < amount) {
    return { ok: false, code: "insufficient_funds", currentBalance: userData.coins };
  }
  await UserCoins.findOneAndUpdate(
    { userId: String(targetId) },
    { $inc: { coins: -amount } }
  );
  const targetUser = await client.users.fetch(String(targetId)).catch(() => null);
  const executorUser = await client.users.fetch(String(executorId)).catch(() => null);
  await sendDevActionLog("removekc", {
    targetId: String(targetId),
    targetTag: targetUser?.tag || null,
    executorId: String(executorId),
    executorTag: executorUser?.tag || null,
    amount,
    newBalance: userData.coins - amount
  });
  return { ok: true, targetUser, previousBalance: userData.coins, newBalance: userData.coins - amount };
}

module.exports = {
  getDeveloperIds,
  isDeveloper,
  parseDurationInput,
  formatBanDuration,
  getBotBan,
  createBotBanEmbed,
  sendDevActionLog,
  applyBotBan,
  revokeBotBan,
  addKingCoins,
  removeKingCoins
};
