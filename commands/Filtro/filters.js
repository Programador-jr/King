const { MessageEmbed, MessageActionRow, StringSelectMenuBuilder, MessageButton } = require("discord.js");
const config = require("../../botconfig/config.json");
const ee = require("../../botconfig/embed.json");
const FiltersSettings = require("../../botconfig/filters.json");
const { check_if_dj } = require("../../handlers/functions");

const SPECIAL_FILTERS = new Set(["custombassboost", "clear"]);
const REGULAR_FILTERS = Object.keys(FiltersSettings).filter((name) => !SPECIAL_FILTERS.has(name));
const PAGE_SIZE = 25;

const getCurrentFilters = (queue) => {
  if (!queue) return [];
  if (Array.isArray(queue.filters?.names)) return queue.filters.names;
  if (queue.filters?.collection) return [...queue.filters.collection.keys()];
  return [];
};

const makeEmbed = (title, description) => new MessageEmbed()
  .setColor(ee.color)
  .setTitle(title)
  .setDescription(description || "\u200b");

module.exports = {
  name: "filters",
  category: "Filtro",
  usage: "filters",
  aliases: ["filtros", "filtro", "filter"],
  description: "Mostra e gerencia os filtros de áudio ativos.",
  cooldown: 5,
  requiredroles: [],
  alloweduserids: [],
  run: async (client, message) => {
    try {
      const { member, guild, guildId } = message;
      if (!member || !guild) {
        return message.reply({ embeds: [makeEmbed(`${client.allEmojis.x} Este comando só funciona em servidores.`)] });
      }

      const voiceChannel = member.voice?.channel;
      if (!voiceChannel) {
        return message.reply({ embeds: [makeEmbed(`${client.allEmojis.x} Entre em um canal de voz para gerenciar os filtros.`)] });
      }

      const queue = client.distube.getQueue(guildId);
      const hasQueue = Boolean(queue?.songs?.length);
      const botVoiceChannel = guild.members.me?.voice?.channel;
      if ((hasQueue && !botVoiceChannel) || (botVoiceChannel && botVoiceChannel.id !== voiceChannel.id)) {
        return message.reply({ embeds: [makeEmbed(`${client.allEmojis.x} Entre no meu canal de voz para gerenciar os filtros.`)] });
      }
      if (hasQueue) {
        const djError = check_if_dj(client, member, queue.songs[0]);
        if (djError) {
          return message.reply({
            embeds: [makeEmbed(`${client.allEmojis.x} Você não tem autorização para alterar os filtros.`, `Cargos DJ exigidos:\n> ${djError}`)]
          });
        }
      }

      const prefix = client.settings.get(guildId, "prefix") || config.prefix;
      const createMainMenu = (disabled = false) => new MessageActionRow().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("filter_action")
          .setPlaceholder("Escolha uma ação")
          .addOptions([
            { label: "Adicionar filtro", value: "add" },
            { label: "Remover filtro", value: "remove" },
          ])
          .setDisabled(disabled)
      );

      const createSelection = (action, activeFilters, requestedPage = 0) => {
        const available = action === "add"
          ? REGULAR_FILTERS.filter((name) => !activeFilters.includes(name))
          : activeFilters.filter((name) => REGULAR_FILTERS.includes(name));
        if (!available.length) return null;

        const pageCount = Math.ceil(available.length / PAGE_SIZE);
        const page = Math.max(0, Math.min(pageCount - 1, requestedPage));
        const options = available.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map((name) => ({ label: name, value: name }));
        const rows = [new MessageActionRow().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(`filter_${action}_${page}`)
            .setPlaceholder(`Selecione filtros · página ${page + 1}/${pageCount}`)
            .setMinValues(1)
            .setMaxValues(Math.min(options.length, 5))
            .addOptions(options)
        )];

        if (pageCount > 1) {
          rows.push(new MessageActionRow().addComponents(
            new MessageButton()
              .setCustomId(`filter_page:${action}:${page - 1}`)
              .setLabel("Anterior")
              .setStyle("SECONDARY")
              .setDisabled(page === 0),
            new MessageButton()
              .setCustomId(`filter_page:${action}:${page + 1}`)
              .setLabel("Próxima")
              .setStyle("SECONDARY")
              .setDisabled(page >= pageCount - 1)
          ));
        }

        return { rows, page, pageCount };
      };

      const currentEmbed = (filters) => {
        const active = filters.length ? filters.map((name) => `\`${name}\``).join(", ") : "Nenhum";
        return makeEmbed("Filtros de áudio", `**Ativos:** ${active}\n\nUse \`${prefix}custombassboost <0-20>\` para definir o bassboost personalizado ou \`${prefix}clearfilters\` para limpar os filtros.`);
      };

      const msg = await message.reply({
        embeds: [currentEmbed(getCurrentFilters(queue))],
        components: [createMainMenu(!hasQueue)],
      });

      const collector = msg.createMessageComponentCollector({ time: 120000 });
      collector.on("collect", async (interaction) => {
        try {
          if (interaction.user.id !== message.author.id) {
            return interaction.reply({ content: `${client.allEmojis.x} Só quem abriu este painel pode usá-lo.`, flags: 64 }).catch(() => {});
          }

          const liveMember = await guild.members.fetch(interaction.user.id).catch(() => null);
          const liveQueue = client.distube.getQueue(guildId);
          if (!liveMember?.voice?.channel) {
            return interaction.reply({ content: `${client.allEmojis.x} Entre em um canal de voz para alterar os filtros.`, flags: 64 }).catch(() => {});
          }
          const liveBotVoice = guild.members.me?.voice?.channel;
          if ((liveQueue?.songs?.length && !liveBotVoice) || (liveBotVoice && liveBotVoice.id !== liveMember.voice.channel.id)) {
            return interaction.reply({ content: `${client.allEmojis.x} Entre no meu canal de voz para alterar os filtros.`, flags: 64 }).catch(() => {});
          }
          if (liveQueue?.songs?.length) {
            const djError = check_if_dj(client, liveMember, liveQueue.songs[0]);
            if (djError) {
              return interaction.reply({ content: `${client.allEmojis.x} Você não tem autorização para alterar os filtros. Cargos DJ exigidos: ${djError}`, flags: 64 }).catch(() => {});
            }
          }

          if (!liveQueue?.songs?.length) {
            await interaction.deferUpdate().catch(() => {});
            return interaction.editReply({
              content: `${client.allEmojis.x} Não há música tocando.`,
              components: [createMainMenu(true)],
            }).catch(() => {});
          }

          await interaction.deferUpdate().catch(() => {});
          const filters = getCurrentFilters(liveQueue);

          if (interaction.customId === "filter_action") {
            const action = interaction.values[0];
            const selection = createSelection(action, filters);
            if (!selection) {
              const text = action === "add" ? "Todos os filtros disponíveis já estão ativos." : "Não há filtros regulares ativos para remover.";
              return interaction.editReply({ content: text, embeds: [currentEmbed(filters)], components: [createMainMenu()] }).catch(() => {});
            }
            return interaction.editReply({
              content: "Selecione os filtros para alterar.",
              embeds: [makeEmbed(action === "add" ? "Adicionar filtros" : "Remover filtros", `Página ${selection.page + 1}/${selection.pageCount}.`)],
              components: selection.rows,
            }).catch(() => {});
          }

          const pageMatch = interaction.customId.match(/^filter_page:(add|remove):(\d+)$/);
          if (pageMatch) {
            const [, action, rawPage] = pageMatch;
            const selection = createSelection(action, filters, Number(rawPage));
            if (!selection) {
              return interaction.editReply({ content: "Nenhum filtro disponível nesta ação.", embeds: [currentEmbed(filters)], components: [createMainMenu()] }).catch(() => {});
            }
            return interaction.editReply({
              content: "Selecione os filtros para alterar.",
              embeds: [makeEmbed(action === "add" ? "Adicionar filtros" : "Remover filtros", `Página ${selection.page + 1}/${selection.pageCount}.`)],
              components: selection.rows,
            }).catch(() => {});
          }

          const selectMatch = interaction.customId.match(/^filter_(add|remove)_\d+$/);
          if (selectMatch) {
            const isAdd = selectMatch[1] === "add";
            const selected = interaction.values;
            if (isAdd) await liveQueue.filters.add(selected);
            else await liveQueue.filters.remove(selected);

            const updated = getCurrentFilters(client.distube.getQueue(guildId));
            return interaction.editReply({
              content: `${client.allEmojis.check_mark} Filtros ${isAdd ? "adicionados" : "removidos"}: ${selected.map((name) => `\`${name}\``).join(", ")}`,
              embeds: [currentEmbed(updated)],
              components: [createMainMenu()],
            }).catch(() => {});
          }

          return interaction.deferUpdate().catch(() => {});
        } catch (error) {
          console.error("Erro no painel de filtros:", error);
          if (interaction.deferred || interaction.replied) {
            await interaction.editReply({ content: `${client.allEmojis.x} Não foi possível aplicar os filtros.`, components: [] }).catch(() => {});
          } else {
            await interaction.reply({ content: `${client.allEmojis.x} Não foi possível aplicar os filtros.`, flags: 64 }).catch(() => {});
          }
        }
      });

      collector.on("end", async () => {
        await msg.edit({ components: [createMainMenu(true)] }).catch(() => {});
      });
    } catch (error) {
      console.error(error?.stack || error);
      return message.reply({
        content: `${client.allEmojis.x} | Erro:`,
        embeds: [new MessageEmbed().setColor(ee.wrongcolor).setDescription(`\`\`\`${error}\`\`\``)],
      }).catch(() => {});
    }
  },
};
