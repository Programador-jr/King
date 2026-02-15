const { MessageEmbed, MessageActionRow, MessageSelectMenu, MessageButton } = require("discord.js");
const config = require("../../botconfig/config.json");
const ee = require("../../botconfig/embed.json");
const {
  getDashboardBaseUrl,
  getDashboardSupportUrl,
} = require("../../handlers/dashboardConfig");

const CATEGORY_ICON = {
  musica: "🎵",
  fila: "📋",
  filtro: "🎚️",
  configuracoes: "⚙️",
  info: "ℹ️",
  utilidade: "🔧",
  diversao: "🎉",
  jogos: "🎮",
  dev: "🛠️",
  outros: "📁",
};

const CUSTOM_EMOJI_REGEX = /^<(a?):([a-zA-Z0-9_]{2,32}):(\d{17,20})>$/;

const normalize = (value) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const titleCase = (value) =>
  String(value || "")
    .split(/\s+/g)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

const isUnicodeEmoji = (value) => /[^\x00-\x7F]/.test(value);

const resolveConfiguredEmoji = (client, guild, identifier) => {
  const value = String(identifier || "").trim();
  if (!value) return { display: "", component: null };

  const custom = value.match(CUSTOM_EMOJI_REGEX);
  if (custom) {
    return {
      display: `<${custom[1] ? "a" : ""}:${custom[2]}:${custom[3]}>`,
      component: {
        id: custom[3],
        name: custom[2],
        animated: Boolean(custom[1])
      }
    };
  }

  if (/^\d{17,20}$/.test(value)) {
    const byId = guild?.emojis?.cache?.get(value) || client?.emojis?.cache?.get(value);
    if (!byId) return { display: "", component: null };
    return {
      display: byId.toString(),
      component: {
        id: byId.id,
        name: byId.name,
        animated: Boolean(byId.animated)
      }
    };
  }

  const byName =
    guild?.emojis?.cache?.find((emoji) => normalize(emoji.name) === normalize(value)) ||
    client?.emojis?.cache?.find((emoji) => normalize(emoji.name) === normalize(value)) ||
    null;

  if (byName) {
    return {
      display: byName.toString(),
      component: {
        id: byName.id,
        name: byName.name,
        animated: Boolean(byName.animated)
      }
    };
  }

  if (isUnicodeEmoji(value)) {
    return {
      display: value,
      component: { name: value }
    };
  }

  return { display: "", component: null };
};

const getConfiguredCategoryIcon = (category) => CATEGORY_ICON[normalize(category)] || CATEGORY_ICON.outros;

const getCategoryDisplayIcon = (client, guild, category) =>
  resolveConfiguredEmoji(client, guild, getConfiguredCategoryIcon(category)).display;

const getCategoryComponentIcon = (client, guild, category) =>
  resolveConfiguredEmoji(client, guild, getConfiguredCategoryIcon(category)).component;

const getDashboardCommandsUrl = () => {
  const base = getDashboardBaseUrl();
  if (!base) return "";
  return `${base}/commands`;
};

const getSupportUrl = () => {
  return getDashboardSupportUrl();
};

const formatCommandTags = (commands, maxLen = 980, prefix = "", useUsage = false) => {
  const names = [...commands].sort((left, right) => left.name.localeCompare(right.name, "pt-BR"));
  const lines = names.map((command) =>
    useUsage ? `- \`${prefix}${command.usage || command.name}\`` : `- \`${command.name}\``
  );

  let output = "";
  let used = 0;
  for (const line of lines) {
    const next = output ? `${output}\n${line}` : line;
    if (next.length > maxLen) break;
    output = next;
    used += 1;
  }
  if (used < names.length) {
    output += `\n+ ${names.length - used} comando(s)`;
  }

  return output || "- `nenhum`";
};

const resolveCommandHelpDetails = (command) => {
  try {
    if (!command) return "";
    if (typeof command.helpDetails === "function") {
      return String(command.helpDetails() || "").trim();
    }
    if (typeof command.helpDetails === "string") {
      return command.helpDetails.trim();
    }
    return "";
  } catch {
    return "";
  }
};

const truncateField = (text, max = 1024) => {
  const value = String(text || "");
  return value.length > max ? `${value.slice(0, max - 3)}...` : value;
};

const collectCategories = (client) => {
  const map = new Map();
  client.commands.forEach((command) => {
    const category = command.category || "Outros";
    const key = normalize(category);
    if (!map.has(key)) map.set(key, { name: category, commands: [] });
    map.get(key).commands.push(command);
  });
  return [...map.values()].sort((left, right) => left.name.localeCompare(right.name, "pt-BR"));
};

const buildHomeEmbed = ({ client, guild, prefix, categories, dashboardCommandsUrl, supportUrl, requestedBy }) => {
  const totalCommands = categories.reduce((sum, c) => sum + c.commands.length, 0);

  const embed = new MessageEmbed()
    .setColor(ee.color)
    .setAuthor("Central de Ajuda", client.user.displayAvatarURL({ dynamic: true }))
    .setTitle("Painel de Comandos")
    .setDescription(
      [
        "Escolha uma categoria no menu abaixo.",
        `Prefixo atual: \`${prefix}\``,
        `Comandos: \`${totalCommands}\` | Categorias: \`${categories.length}\``,
        "",
        `- \`${prefix}help <comando>\` para detalhes de um comando`,
        `- \`${prefix}help <categoria>\` para abrir uma categoria direto`
      ].join("\n")
    )
    .setFooter(`Solicitado por ${requestedBy.tag}`, requestedBy.displayAvatarURL({ dynamic: true }))
    .setThumbnail(client.user.displayAvatarURL({ dynamic: true }));

  const preview = categories
    .slice(0, 8)
    .map((category) => {
      const emoji = getCategoryDisplayIcon(client, guild, category.name);
      const prefixText = emoji ? `${emoji}   ` : "";
      return `${prefixText}\`${titleCase(category.name)}\`   (\`${category.commands.length}\`)`;
    })
    .join("\n\u200b\n");

  if (preview) {
    embed.addField("Categorias", preview, false);
  }

  if (dashboardCommandsUrl || supportUrl) {
    embed.addField(
      "Links",
      [dashboardCommandsUrl ? `[Comandos no dashboard](${dashboardCommandsUrl})` : null, supportUrl ? `[Suporte](${supportUrl})` : null]
        .filter(Boolean)
        .join(" | "),
      false
    );
  }

  return embed;
};

const buildCategoryEmbed = ({ client, guild, prefix, category, requestedBy }) => {
  const categoryEmoji = getCategoryDisplayIcon(client, guild, category.name);
  const titlePrefix = categoryEmoji ? `${categoryEmoji}   ` : "";
  return new MessageEmbed()
    .setColor(ee.color)
    .setAuthor("Central de Ajuda", client.user.displayAvatarURL({ dynamic: true }))
    .setTitle(`${titlePrefix}${titleCase(category.name)}`)
    .setDescription(
      [
        `Comandos nesta categoria: \`${category.commands.length}\``,
        `Use \`${prefix}help <comando>\` para ver detalhes de um comando especifico.`
      ].join("\n")
    )
    .addField("Comandos", formatCommandTags(category.commands), false)
    .addField("Uso rapido", formatCommandTags(category.commands, 980, prefix, true), false)
    .setFooter(`Solicitado por ${requestedBy.tag}`, requestedBy.displayAvatarURL({ dynamic: true }))
    .setThumbnail(client.user.displayAvatarURL({ dynamic: true }));
};

const buildCommandEmbed = ({ client, guild, command, prefix, requestedBy, dashboardCommandsUrl }) => {
  const usage = command.usage ? `${prefix}${command.usage}` : `${prefix}${command.name}`;
  const aliases = command.aliases?.length ? command.aliases.map((alias) => `\`${alias}\``).join(", ") : "`sem aliases`";
  const restrictions = [];
  const helpDetails = resolveCommandHelpDetails(command);
  const categoryEmoji = getCategoryDisplayIcon(client, guild, command.category);
  const titlePrefix = categoryEmoji ? `${categoryEmoji}   ` : "";

  if (Array.isArray(command.memberpermissions) && command.memberpermissions.length) {
    restrictions.push(`Permissoes: \`${command.memberpermissions.join("`, `")}\``);
  }
  if (Array.isArray(command.requiredroles) && command.requiredroles.length) {
    restrictions.push(`Cargos exigidos: ${command.requiredroles.map((id) => `<@&${id}>`).join(", ")}`);
  }
  if (Array.isArray(command.alloweduserids) && command.alloweduserids.length) {
    restrictions.push(`Usuarios permitidos: ${command.alloweduserids.map((id) => `<@${id}>`).join(", ")}`);
  }

  const embed = new MessageEmbed()
    .setColor(ee.color)
    .setAuthor("Central de Ajuda", client.user.displayAvatarURL({ dynamic: true }))
    .setTitle(`${titlePrefix}${titleCase(command.name)}`)
    .setDescription(command.description || "Sem descricao.")
    .addField("Uso", `\`${usage}\``, false)
    .addField("Aliases", aliases, false)
    .addField("Cooldown", `\`${typeof command.cooldown === "number" ? command.cooldown : 1}s\``, true)
    .addField("Categoria", `\`${command.category || "Outros"}\``, true)
    .setFooter(`Solicitado por ${requestedBy.tag}`, requestedBy.displayAvatarURL({ dynamic: true }))
    .setThumbnail(client.user.displayAvatarURL({ dynamic: true }));

  if (dashboardCommandsUrl) {
    embed.addField("Dashboard", `[Abrir pagina de comandos](${dashboardCommandsUrl})`, false);
  }

  if (helpDetails) {
    embed.addField("Detalhes", truncateField(helpDetails), false);
  }

  if (restrictions.length) {
    embed.addField("Restricoes", truncateField(restrictions.join("\n")), false);
  }

  return embed;
};

const buildComponents = ({ client, guild, categories, dashboardCommandsUrl, supportUrl, disabled = false }) => {
  const options = [];
  options.push({
    label: "Inicio",
    description: "Visao geral dos comandos",
    value: "home",
    emoji: { name: "🏠" }
  });

  for (const category of categories.slice(0, 24)) {
    const option = {
      label: titleCase(category.name).slice(0, 100),
      description: `${category.commands.length} comando(s)`.slice(0, 100),
      value: `cat:${normalize(category.name)}`
    };

    const optionEmoji = getCategoryComponentIcon(client, guild, category.name);
    if (optionEmoji) option.emoji = optionEmoji;

    options.push(option);
  }

  const menu = new MessageSelectMenu()
    .setCustomId("help_category_select")
    .setPlaceholder("Escolha uma categoria")
    .addOptions(options)
    .setDisabled(disabled);

  const menuRow = new MessageActionRow().addComponents(menu);

  const buttons = [
    new MessageButton().setCustomId("help_home_btn").setLabel("Inicio").setStyle("SECONDARY").setEmoji("🏠").setDisabled(disabled),
    new MessageButton().setCustomId("help_close_btn").setLabel("Fechar").setStyle("DANGER").setDisabled(disabled)
  ];

  if (dashboardCommandsUrl) {
    buttons.push(new MessageButton().setStyle("LINK").setLabel("Dashboard").setURL(dashboardCommandsUrl).setDisabled(disabled));
  }

  if (supportUrl) {
    buttons.push(new MessageButton().setStyle("LINK").setLabel("Suporte").setURL(supportUrl).setDisabled(disabled));
  }

  const buttonRow = new MessageActionRow().addComponents(buttons.slice(0, 5));
  return [menuRow, buttonRow];
};

module.exports = {
  name: "help",
  category: "Info",
  usage: "help [comando|categoria]",
  aliases: ["ajuda", "h", "halp", "helpme", "hilfe"],
  cooldown: 1,
  description: "Mostra todos os comandos, uma categoria ou detalhes de um comando.",
  memberpermissions: [],
  requiredroles: [],
  alloweduserids: [],
  run: async (client, message, args) => {
    const prefix = message.guild ? client.settings.get(message.guild.id, "prefix") : config.prefix;
    const categories = collectCategories(client);
    const query = String(args.join(" ") || "").trim();
    const dashboardCommandsUrl = getDashboardCommandsUrl();
    const supportUrl = getSupportUrl();

    if (query) {
      const lowered = query.toLowerCase();
      const command = client.commands.get(lowered) || client.commands.get(client.aliases.get(lowered));

      if (command) {
        return message.reply({
          embeds: [
            buildCommandEmbed({
              client,
              guild: message.guild,
              command,
              prefix,
              requestedBy: message.author,
              dashboardCommandsUrl
            })
          ]
        });
      }

      const categoryMatch = categories.find((entry) => normalize(entry.name) === normalize(query));
      if (categoryMatch) {
        return message.reply({
          embeds: [buildCategoryEmbed({ client, guild: message.guild, prefix, category: categoryMatch, requestedBy: message.author })]
        });
      }

      return message.reply({
        embeds: [
          new MessageEmbed()
            .setColor(ee.wrongcolor)
            .setTitle(`${client.allEmojis.x} Comando ou categoria nao encontrada`)
            .setDescription(`Use \`${prefix}help\` para abrir a central de ajuda.`)
        ]
      });
    }

    const homeEmbed = buildHomeEmbed({
      client,
      guild: message.guild,
      prefix,
      categories,
      dashboardCommandsUrl,
      supportUrl,
      requestedBy: message.author
    });

    const components = buildComponents({ client, guild: message.guild, categories, dashboardCommandsUrl, supportUrl, disabled: false });
    const helpMessage = await message.reply({ embeds: [homeEmbed], components });

    const collector = helpMessage.createMessageComponentCollector({ time: 180000 });

    collector.on("collect", async (interaction) => {
      if (interaction.user.id !== message.author.id) {
        return interaction.reply({
          content: `${client.allEmojis.x} Apenas quem executou o comando pode usar este painel.`,
          ephemeral: true
        }).catch(() => {});
      }

      if (interaction.isButton() && interaction.customId === "help_close_btn") {
        await interaction.deferUpdate().catch(() => {});
        collector.stop("closed");
        return helpMessage.delete().catch(() => {});
      }

      if (interaction.isButton() && interaction.customId === "help_home_btn") {
        return interaction.update({
          embeds: [
            buildHomeEmbed({
              client,
              guild: message.guild,
              prefix,
              categories,
              dashboardCommandsUrl,
              supportUrl,
              requestedBy: message.author
            })
          ],
          components: buildComponents({ client, guild: message.guild, categories, dashboardCommandsUrl, supportUrl, disabled: false })
        }).catch(() => {});
      }

      if (!interaction.isSelectMenu() || interaction.customId !== "help_category_select") {
        return interaction.deferUpdate().catch(() => {});
      }

      const selected = String(interaction.values?.[0] || "");
      if (selected === "home") {
        return interaction.update({
          embeds: [
            buildHomeEmbed({
              client,
              guild: message.guild,
              prefix,
              categories,
              dashboardCommandsUrl,
              supportUrl,
              requestedBy: message.author
            })
          ],
          components: buildComponents({ client, guild: message.guild, categories, dashboardCommandsUrl, supportUrl, disabled: false })
        }).catch(() => {});
      }

      if (!selected.startsWith("cat:")) return interaction.deferUpdate().catch(() => {});

      const selectedCategory = selected.slice(4);
      const category = categories.find((entry) => normalize(entry.name) === selectedCategory);
      if (!category) return interaction.deferUpdate().catch(() => {});

      return interaction.update({
        embeds: [buildCategoryEmbed({ client, guild: message.guild, prefix, category, requestedBy: message.author })],
        components: buildComponents({ client, guild: message.guild, categories, dashboardCommandsUrl, supportUrl, disabled: false })
      }).catch(() => {});
    });

    collector.on("end", async (_, reason) => {
      if (reason === "closed") return;
      await helpMessage
        .edit({
          components: buildComponents({ client, guild: message.guild, categories, dashboardCommandsUrl, supportUrl, disabled: true })
        })
        .catch(() => {});
    });

    return helpMessage;
  }
};
