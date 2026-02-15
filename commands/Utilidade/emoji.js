const { MessageEmbed } = require("discord.js");
const ee = require("../../botconfig/embed.json");

const FULL_CUSTOM_EMOJI_REGEX = /^<(a?):([a-zA-Z0-9_]{2,32}):(\d{17,20})>$/;
const PARTIAL_CUSTOM_EMOJI_REGEX = /^<(a?):([a-zA-Z0-9_]{2,32}):>$/;
const COLON_NAME_REGEX = /^:([a-zA-Z0-9_]{2,32}):$/;
const NAME_ONLY_REGEX = /^[a-zA-Z0-9_]{2,32}$/;

const UNICODE_HINTS = {
  "✔": ["check", "checkmark", "check_mark", "verify", "verificado"],
  "✅": ["check", "checkmark", "check_mark", "verify", "verificado"],
  "☑️": ["check", "checkmark", "check_mark", "verify", "verificado"]
};

function buildCustomEmojiString(emoji) {
  return `<${emoji.animated ? "a" : ""}:${emoji.name}:${emoji.id}>`;
}

function findEmojiByName(client, message, rawName) {
  const name = String(rawName || "").toLowerCase();
  if (!name) return null;

  const guildEmoji = message.guild?.emojis?.cache?.find((emoji) => emoji.name?.toLowerCase() === name);
  if (guildEmoji) return guildEmoji;

  return client.emojis.cache.find((emoji) => emoji.name?.toLowerCase() === name) || null;
}

function findEmojiByHints(client, message, input) {
  const hints = UNICODE_HINTS[input];
  if (!Array.isArray(hints) || !hints.length) return null;

  for (const hint of hints) {
    const guildEmoji =
      message.guild?.emojis?.cache?.find((emoji) => emoji.name?.toLowerCase() === hint) ||
      message.guild?.emojis?.cache?.find((emoji) => emoji.name?.toLowerCase()?.includes(hint));
    if (guildEmoji) return guildEmoji;

    const globalEmoji =
      client.emojis.cache.find((emoji) => emoji.name?.toLowerCase() === hint) ||
      client.emojis.cache.find((emoji) => emoji.name?.toLowerCase()?.includes(hint));
    if (globalEmoji) return globalEmoji;
  }

  return null;
}

function sendTimedError(client, message, text) {
  return message
    .reply({
      embeds: [
        new MessageEmbed()
          .setColor(ee.wrongcolor)
          .setFooter(ee.footertext, ee.footericon)
          .setTitle(`${client.allEmojis.x} ${text}`)
      ]
    })
    .then((msg) => {
      setTimeout(() => {
        msg.delete().catch(() => {});
      }, 4000);
    })
    .catch(() => {});
}

module.exports = {
  name: "emoji",
  aliases: ["emojiid", "emote"],
  usage: "emoji <emoji|nome>",
  description: "Mostra nome, ID e formato de um emoji personalizado.",
  category: "Utilidade",
  cooldown: 3,
  run: async (client, message, args) => {
    const input = String(args.join(" ") || "").trim();
    if (!input) {
      return sendTimedError(client, message, `Use: \`${client.settings.get(message.guild.id, "prefix")}emoji <emoji|nome>\``);
    }

    const fullMatch = input.match(FULL_CUSTOM_EMOJI_REGEX);
    if (fullMatch) {
      const emojiId = fullMatch[3];
      const cachedEmoji = client.emojis.cache.get(emojiId);
      const emoji = cachedEmoji || {
        animated: Boolean(fullMatch[1]),
        name: fullMatch[2],
        id: emojiId,
        url: `https://cdn.discordapp.com/emojis/${emojiId}.${fullMatch[1] ? "gif" : "png"}`
      };

      const embed = new MessageEmbed()
        .setColor(ee.color)
        .setTitle("Emoji encontrado")
        .addField("Nome", `\`${emoji.name}\``, true)
        .addField("ID", `\`${emoji.id}\``, true)
        .addField("Formato", `\`${buildCustomEmojiString(emoji)}\``, false)
        .addField("Link", `[Abrir imagem](${emoji.url})`, false)
        .setFooter(ee.footertext, ee.footericon);

      return message.reply({ embeds: [embed] });
    }

    const partialMatch = input.match(PARTIAL_CUSTOM_EMOJI_REGEX);
    const colonNameMatch = input.match(COLON_NAME_REGEX);
    const isNameOnly = NAME_ONLY_REGEX.test(input);
    const possibleName = partialMatch?.[2] || colonNameMatch?.[1] || (isNameOnly ? input : null);

    if (possibleName) {
      const resolvedEmoji = findEmojiByName(client, message, possibleName);
      if (!resolvedEmoji) {
        return sendTimedError(client, message, `Nao achei emoji com o nome \`${possibleName}\`.`);
      }

      const embed = new MessageEmbed()
        .setColor(ee.color)
        .setTitle("Emoji encontrado")
        .addField("Nome", `\`${resolvedEmoji.name}\``, true)
        .addField("ID", `\`${resolvedEmoji.id}\``, true)
        .addField("Formato", `\`${buildCustomEmojiString(resolvedEmoji)}\``, false)
        .addField("Link", `[Abrir imagem](${resolvedEmoji.url})`, false)
        .setFooter(ee.footertext, ee.footericon);

      return message.reply({ embeds: [embed] });
    }

    const hintedEmoji = findEmojiByHints(client, message, input);
    if (hintedEmoji) {
      const embed = new MessageEmbed()
        .setColor(ee.color)
        .setTitle("Emoji encontrado por semelhanca")
        .setDescription(`Entrada: ${input}`)
        .addField("Nome", `\`${hintedEmoji.name}\``, true)
        .addField("ID", `\`${hintedEmoji.id}\``, true)
        .addField("Formato", `\`${buildCustomEmojiString(hintedEmoji)}\``, false)
        .addField("Link", `[Abrir imagem](${hintedEmoji.url})`, false)
        .setFooter(ee.footertext, ee.footericon);

      return message.reply({ embeds: [embed] });
    }

    const codepoints = [...input]
      .map((char) => `U+${char.codePointAt(0).toString(16).toUpperCase()}`)
      .join(" ");

    const embed = new MessageEmbed()
      .setColor(ee.color)
      .setTitle("Emoji padrao (Unicode)")
      .setDescription("Esse emoji nao tem ID de Discord.")
      .addField("Emoji", input, true)
      .addField("Nome", "`Emoji padrao`", true)
      .addField("ID", "`Nao possui`", true)
      .addField("Unicode", `\`${codepoints}\``, false)
      .setFooter(ee.footertext, ee.footericon);

    return message.reply({ embeds: [embed] });
  }
};

