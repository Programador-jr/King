const Discord = require("discord.js");
const ee = require("../botconfig/embed.json");

if (!Discord.__legacyCompatPatched) {
  const {
    EmbedBuilder,
    ButtonBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonStyle,
    PermissionFlagsBits,
    PermissionsBitField,
    BaseInteraction,
    Guild,
    Message,
  } = Discord;

  const ERROR_DELETE_MS = 4000;

  const toColorNumber = (value) => {
    if (typeof value === "number" && Number.isFinite(value)) return value >>> 0;
    if (typeof value !== "string") return null;
    const normalized = value.trim().replace(/^#/, "");
    if (!/^[a-f0-9]{6}$/i.test(normalized)) return null;
    return parseInt(normalized, 16);
  };

  const WRONG_COLOR = toColorNumber(ee?.wrongcolor);

  const scheduleDelete = (target, delay = ERROR_DELETE_MS) => {
    if (!target || typeof target.delete !== "function") return;
    setTimeout(() => {
      target.delete().catch(() => {});
    }, delay);
  };

  const scheduleDeleteReferenced = async (msg) => {
    try {
      const refId = msg?.reference?.messageId;
      if (!refId || !msg?.channel?.messages?.fetch) return;
      const referenced = await msg.channel.messages.fetch(refId).catch(() => null);
      scheduleDelete(referenced);
    } catch {
      // ignore reference delete failures
    }
  };

  const contentLooksLikeError = (text) => {
    if (!text || typeof text !== "string") return false;
    return /(^|\s)(error|erro)\b|nao encontrei|n[oã]o encontrei|sem permiss|uso de comando errado|nada tocando|junte-se|canal de voz primeiro|n[aã]o estou tocando|lembre-se de mencionar|usuario valido|usu[aá]rio v[aá]lido|eu preciso da permiss[aã]o/i.test(
      text
    );
  };

  const extractEmbeds = (payload) => {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.embeds)) return payload.embeds;
    if (payload.embed) return [payload.embed];
    return [];
  };

  const embedLooksLikeError = (embed) => {
    if (!embed || typeof embed !== "object") return false;
    const color = toColorNumber(embed?.data?.color ?? embed?.color ?? embed?.hexColor ?? null);
    if (WRONG_COLOR !== null && color === WRONG_COLOR) return true;
    const text = [
      embed?.data?.title ?? embed?.title,
      embed?.data?.description ?? embed?.description,
      embed?.data?.footer?.text ?? embed?.footer?.text,
    ]
      .filter(Boolean)
      .join(" ");
    return contentLooksLikeError(text);
  };

  const payloadLooksLikeError = (payload) => {
    if (!payload) return false;
    if (typeof payload === "string") return contentLooksLikeError(payload);
    if (typeof payload !== "object") return false;
    if (contentLooksLikeError(payload.content)) return true;
    return extractEmbeds(payload).some(embedLooksLikeError);
  };

  class LegacyMessageEmbed extends EmbedBuilder {
    setFooter(text, iconURL) {
      if (text && typeof text === "object" && !Array.isArray(text)) {
        return super.setFooter(text);
      }
      return super.setFooter({
        text: text !== undefined && text !== null ? String(text) : "\u200b",
        iconURL: iconURL ?? undefined,
      });
    }

    setAuthor(name, iconURL, url) {
      if (name && typeof name === "object" && !Array.isArray(name)) {
        return super.setAuthor(name);
      }
      return super.setAuthor({
        name: name !== undefined && name !== null ? String(name) : "\u200b",
        iconURL: iconURL ?? undefined,
        url: url ?? undefined,
      });
    }

    addField(name, value, inline = false) {
      return super.addFields({
        name: String(name),
        value: String(value),
        inline: Boolean(inline),
      });
    }
  }

  class LegacyMessageButton extends ButtonBuilder {
    setStyle(style) {
      if (typeof style === "string") {
        const mapped = {
          PRIMARY: ButtonStyle.Primary,
          SECONDARY: ButtonStyle.Secondary,
          SUCCESS: ButtonStyle.Success,
          DANGER: ButtonStyle.Danger,
          LINK: ButtonStyle.Link,
        }[style.trim().toUpperCase()];
        if (mapped !== undefined) return super.setStyle(mapped);
      }
      return super.setStyle(style);
    }
  }

  class LegacyMessageActionRow extends ActionRowBuilder {
    addComponents(...components) {
      if (components.length === 1 && Array.isArray(components[0])) {
        return super.addComponents(...components[0]);
      }
      return super.addComponents(...components);
    }
  }

  class LegacyMessageSelectMenu extends StringSelectMenuBuilder {}

  const legacyPermissionMap = {};
  for (const key of Object.keys(PermissionFlagsBits)) {
    legacyPermissionMap[key.toUpperCase()] = key;
    legacyPermissionMap[key.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toUpperCase()] = key;
  }

  const normalizePermission = (value) => {
    if (Array.isArray(value)) return value.map(normalizePermission).filter(Boolean);
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (PermissionFlagsBits[trimmed] !== undefined) return trimmed;
    const key = trimmed.replace(/[\s-]+/g, "_").toUpperCase();
    return legacyPermissionMap[key] || trimmed;
  };

  const originalHas = PermissionsBitField.prototype.has;
  PermissionsBitField.prototype.has = function patchedHas(permission, checkAdmin = true) {
    try {
      return originalHas.call(this, normalizePermission(permission), checkAdmin);
    } catch {
      return false;
    }
  };

  if (BaseInteraction && !BaseInteraction.prototype.isSelectMenu) {
    BaseInteraction.prototype.isSelectMenu = function legacyIsSelectMenu() {
      return typeof this.isStringSelectMenu === "function" ? this.isStringSelectMenu() : false;
    };
  }

  if (Message && !Message.prototype.__errorAutoDeletePatched) {
    const originalReply = Message.prototype.reply;
    Message.prototype.reply = async function patchedReply(options) {
      const sent = await originalReply.call(this, options);
      try {
        if (payloadLooksLikeError(options)) {
          scheduleDelete(sent);
          scheduleDelete(this);
        }
      } catch {
        // ignore auto-delete guard failures
      }
      return sent;
    };
    const originalEdit = Message.prototype.edit;
    Message.prototype.edit = async function patchedEdit(options) {
      const edited = await originalEdit.call(this, options);
      try {
        if (payloadLooksLikeError(options)) {
          scheduleDelete(edited);
          scheduleDeleteReferenced(edited);
        }
      } catch {
        // ignore auto-delete guard failures
      }
      return edited;
    };
    Message.prototype.__errorAutoDeletePatched = true;
  }

  const meDescriptor = Object.getOwnPropertyDescriptor(Guild.prototype, "me");
  if (!meDescriptor) {
    Object.defineProperty(Guild.prototype, "me", {
      configurable: true,
      enumerable: false,
      get() {
        return this.members?.me ?? null;
      },
    });
  }

  Discord.MessageEmbed = LegacyMessageEmbed;
  Discord.MessageButton = LegacyMessageButton;
  Discord.MessageActionRow = LegacyMessageActionRow;
  Discord.MessageSelectMenu = LegacyMessageSelectMenu;
  Discord.__legacyCompatPatched = true;
}

module.exports = Discord;
