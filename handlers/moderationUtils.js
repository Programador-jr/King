const axios = require("axios");
const { MessageEmbed } = require("discord.js");
const ee = require("../botconfig/embed.json");

const MODERATION_DEFAULTS = {
  moderationRoles: [],
  moderationLogEnabled: false,
  moderationLogType: "channel",
  moderationLogChannelId: null,
  moderationLogWebhook: null
};

const MAX_TIMEOUT_MS = 28 * 24 * 60 * 60 * 1000;

function ensureModerationDefaults(client, guildId) {
  if (!client || !client.settings || !guildId) return MODERATION_DEFAULTS;
  return client.settings.ensure(guildId, MODERATION_DEFAULTS);
}

function getModerationRoles(client, guildId) {
  ensureModerationDefaults(client, guildId);
  const roles = client.settings.get(guildId, "moderationRoles") || [];
  return Array.isArray(roles) ? roles : [];
}

function hasModerationPermission(client, member) {
  if (!client || !member) return false;
  if (member.permissions?.has("ADMINISTRATOR")) return true;
  const roles = getModerationRoles(client, member.guild?.id);
  if (!roles.length) return false;
  return member.roles?.cache?.some((role) => roles.includes(role.id));
}

function assertModerationPermission(client, message) {
  if (!message || !message.guild || !message.member) return false;
  if (hasModerationPermission(client, message.member)) return true;

  const embed = new MessageEmbed()
    .setColor(ee.wrongcolor || "#ff0000")
    .setTitle(`${client?.allEmojis?.x || "❌"} **Permissão insuficiente.**`)
    .setDescription("Apenas administradores ou cargos de moderação configurados podem usar este comando.");
  message.reply({ embeds: [embed] }).catch(() => {});
  return false;
}

function extractId(input) {
  if (!input) return null;
  const cleaned = String(input).replace(/[<@!>]/g, "").trim();
  if (!/^\d{17,20}$/.test(cleaned)) return null;
  return cleaned;
}

async function resolveMember(message, arg) {
  if (!message?.guild) return null;
  const mention = message.mentions?.members?.first();
  if (mention) return mention;
  const id = extractId(arg);
  if (!id) return null;
  try {
    return await message.guild.members.fetch(id);
  } catch {
    return null;
  }
}

async function resolveUser(client, arg) {
  const id = extractId(arg);
  if (!client || !id) return null;
  try {
    return await client.users.fetch(id);
  } catch {
    return null;
  }
}

function checkHierarchy(executor, target, botMember) {
  if (!executor || !target) return "Usuário inválido.";
  if (target.id === executor.id) return "Você não pode usar este comando em si mesmo.";
  const ownerId = executor.guild?.ownerId;
  if (ownerId && target.id === ownerId) return "Você não pode moderar o dono do servidor.";

  const executorPos = executor.roles?.highest?.position ?? 0;
  const targetPos = target.roles?.highest?.position ?? 0;
  if (executor.id !== ownerId && targetPos >= executorPos) {
    return "Você não pode moderar alguém com cargo igual ou superior ao seu.";
  }

  if (botMember) {
    const botPos = botMember.roles?.highest?.position ?? 0;
    if (targetPos >= botPos) {
      return "Meu cargo precisa estar acima do usuário para executar esta ação.";
    }
  }

  return null;
}

function sanitizeReason(reason, fallback = "Sem motivo informado") {
  const value = String(reason || "").trim();
  if (!value) return fallback;
  if (value.length <= 512) return value;
  return value.slice(0, 509) + "...";
}

function parseDuration(input) {
  if (!input) return null;
  const raw = String(input).trim().toLowerCase();
  const match = raw.match(/^(\d+)(s|m|h|d)$/);
  if (!match) return null;
  const value = Number(match[1]);
  if (!Number.isFinite(value) || value <= 0) return null;
  const unit = match[2];
  const multiplier = unit === "s" ? 1000 : unit === "m" ? 60000 : unit === "h" ? 3600000 : 86400000;
  return value * multiplier;
}

function formatDuration(ms) {
  const totalSeconds = Math.floor(Math.max(0, ms) / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (seconds || parts.length === 0) parts.push(`${seconds}s`);
  return parts.join(" ");
}

async function resolveLogChannel(guild, channelId) {
  if (!guild || !channelId) return null;
  let channel = guild.channels.cache.get(channelId);
  if (channel) return channel;
  try {
    channel = await guild.channels.fetch(channelId);
    return channel || null;
  } catch {
    return null;
  }
}

async function sendModerationLog(client, guild, payload) {
  if (!client || !guild) return;
  ensureModerationDefaults(client, guild.id);

  const enabled = client.settings.get(guild.id, "moderationLogEnabled");
  if (!enabled) return;

  const type = client.settings.get(guild.id, "moderationLogType") === "webhook" ? "webhook" : "channel";
  const channelId = client.settings.get(guild.id, "moderationLogChannelId");
  const webhookUrl = client.settings.get(guild.id, "moderationLogWebhook");

  const embed = new MessageEmbed()
    .setColor(ee.color || "#00bfff")
    .setTitle(`🛡️ ${payload.action || "Ação de moderação"}`)
    .setTimestamp();

  if (payload.moderator) {
    embed.addField("Moderador", `${payload.moderator.tag} (<@${payload.moderator.id}>)`, true);
  }
  if (payload.target) {
    embed.addField("Alvo", `${payload.target.tag} (<@${payload.target.id}>)`, true);
  }
  if (payload.channel) {
    embed.addField("Canal", `${payload.channel}`, true);
  }
  if (payload.duration) {
    embed.addField("Duração", `${payload.duration}`, true);
  }
  if (payload.amount) {
    embed.addField("Quantidade", String(payload.amount), true);
  }
  if (payload.reason) {
    embed.addField("Motivo", payload.reason, false);
  }

  const data = { embeds: [embed] };

  if (type === "webhook" && webhookUrl) {
    try {
      await axios.post(webhookUrl, data);
    } catch {}
    return;
  }

  if (type === "channel" && channelId) {
    const channel = await resolveLogChannel(guild, channelId);
    if (channel && typeof channel.isTextBased === "function" && channel.isTextBased()) {
      channel.send(data).catch(() => {});
    }
  }
}

module.exports = {
  ensureModerationDefaults,
  hasModerationPermission,
  assertModerationPermission,
  resolveMember,
  resolveUser,
  extractId,
  checkHierarchy,
  sanitizeReason,
  parseDuration,
  formatDuration,
  sendModerationLog,
  MAX_TIMEOUT_MS
};
