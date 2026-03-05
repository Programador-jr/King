const {
  MessageEmbed,
  MessageActionRow,
  StringSelectMenuBuilder,
  MessageButton
} = require("discord.js");
const config = require("../../botconfig/config.json");
const ee = require("../../botconfig/embed.json");
const FiltersSettings = require("../../botconfig/filters.json");

const getCurrentFilters = (queue) => {
  if (!queue) return [];
  if (Array.isArray(queue.filters?.names)) return queue.filters.names;
  if (queue.filters?.collection) return [...queue.filters.collection.keys()];
  return [];
};

const allFilters = Object.keys(FiltersSettings);

const specialFilters = {
  custombassboost: { name: "Bassboost Personalizado", desc: "Use o comando {prefix}custombassboost <valor> (0-20)", requiresValue: true },
  clear: { name: "Limpar Filtros", desc: "Remove todos os filtros ativos", isClear: true }
};

const regularFilters = allFilters.filter(f => !specialFilters[f]);

module.exports = {
  name: "filters",
  category: "Filtro",
  usage: "filters",
  aliases: ["filtros", "filtro", "filter"],
  description: "Liste todos os filtros ativos e possíveis!",
  cooldown: 5,
  requiredroles: [],
  alloweduserids: [],
  run: async (client, message, args) => {
    try {
      const { member, guildId, guild } = message;
      const { channel } = member.voice;
      
      let newQueue = client.distube.getQueue(guildId);
      const currentFilters = getCurrentFilters(newQueue);
      
      const prefix = client.settings.get(guildId, "prefix") || config.prefix;
      
      const createMainMenu = (filters, queueExists) => {
        const regularActive = filters.filter(f => regularFilters.includes(f));
        
        const row = new MessageActionRow().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId("filter_action")
            .setPlaceholder("Escolha uma ação")
            .addOptions([
              {
                label: "Adicionar Filtro",
                value: "add",
                emoji: "➕"
              },
              {
                label: "Remover Filtro",
                value: "remove",
                emoji: "➖"
              }
            ])
            .setDisabled(!queueExists)
        );
        return [row];
      };
      
      const createFilterSelect = (action, filters) => {
        const availableFilters = action === "add" 
          ? regularFilters.filter(f => !filters.includes(f))
          : filters.filter(f => regularFilters.includes(f));
        
        if (availableFilters.length === 0) {
          return null;
        }
        
        const options = availableFilters.slice(0, 25).map(f => ({
          label: f,
          value: f
        }));
        
        return new MessageActionRow().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(`filter_${action}`)
            .setPlaceholder(action === "add" ? "Selecione filtros para adicionar" : "Selecione filtros para remover")
            .setMinValues(1)
            .setMaxValues(Math.min(options.length, 5))
            .addOptions(options)
        );
      };
      
      const getEmbed = (filters, showSpecial = false) => {
        const embed = new MessageEmbed()
          .setColor(ee.color)
          .setFooter(ee.footertext, ee.footericon)
          .setTitle("🎛️ Filtros");
        
        if (filters.length > 0) {
          embed.addField("**Filtros Ativos:**", filters.map(f => `\`${f}\``).join(", "));
        } else {
          embed.addField("**Filtros Ativos:**", "Nenhum");
        }
        
        if (showSpecial) {
          const specialActive = filters.filter(f => specialFilters[f]);
          if (specialActive.length > 0) {
            const specialDesc = specialActive.map(f => {
              const s = specialFilters[f];
              if (f === "clear") return `\`clear\``;
              if (f === "custombassboost") return `\`custombassboost\` (use ${prefix}custombassboost)`;
              return `\`${f}\``;
            }).join(", ");
            embed.addField("**Filtros Especiais:**", specialDesc);
          }
        }
        
        embed.addField("**Nota:**", `⚠️ Filtros \`custombassboost\` e \`clear\` requerem comandos especiais:\n> \`${prefix}custombassboost <0-20>\` - Bassboost\n> \`${prefix}clear\` - Limpar todos`);
        
        return embed;
      };
      
      const hasQueue = newQueue && newQueue.songs && newQueue.songs.length > 0;
      
      const msg = await message.reply({
        embeds: [getEmbed(currentFilters, true)],
        components: createMainMenu(currentFilters, hasQueue)
      });
      
      const collector = msg.createMessageComponentCollector({
        filter: (i) => i.user.id === member.id,
        time: 120000
      });
      
      collector.on("collect", async (interaction) => {
        try {
          if (interaction.user.id !== member.id) {
            return interaction.reply({
              content: "<a:declined:876968121116807208> Você não pode usar isso!",
              ephemeral: true
            }).catch(() => {});
          }
          
          await interaction.deferUpdate().catch(() => {});
          
          const queue = client.distube.getQueue(guildId);
          if (!queue) {
            return interaction.editReply({
              content: "<a:declined:876968121116807208> Não há música tocando!",
              components: []
            }).catch(() => {});
          }
          
          if (interaction.customId === "filter_action") {
            const action = interaction.values[0];
            const currentFilters = getCurrentFilters(queue);
            
            const selectRow = createFilterSelect(action, currentFilters);
            
            if (!selectRow) {
              return interaction.editReply({
                content: action === "add" ? "<a:true:891138804734373918> Todos os filtros regulares já estão ativos!" : "<a:declined:876968121116807208> Nenhum filtro regular ativo para remover!",
                components: []
              }).catch(() => {});
            }
            
            return interaction.editReply({
              embeds: [
                new MessageEmbed()
                  .setColor(ee.color)
                  .setTitle(action === "add" ? "➕ Adicionar Filtros" : "➖ Remover Filtros")
                  .setDescription(`Selecione um ou mais filtros abaixo:\n\n⚠️ **Nota:** \`custombassboost\` e \`clear\` são filtros especiais.\n> Use \`${prefix}custombassboost <0-20>\` para bassboost\n> Use \`${prefix}clear\` para limpar todos`)
              ],
              components: [selectRow]
            }).catch(() => {});
          }
          else if (interaction.customId === "filter_add" || interaction.customId === "filter_remove") {
            const isAdd = interaction.customId === "filter_add";
            const selectedFilters = interaction.values;
            const queueFilters = queue.filters;
            
            if (isAdd) {
              await queueFilters.add(selectedFilters);
            } else {
              await queueFilters.remove(selectedFilters);
            }
            
            const updatedFilters = getCurrentFilters(client.distube.getQueue(guildId));
            
            await interaction.editReply({
              content: isAdd 
                ? `<a:true:891138804734373918> Filtros adicionados: ${selectedFilters.map(f => `\`${f}\``).join(", ")}` 
                : `<a:true:891138804734373918> Filtros removidos: ${selectedFilters.map(f => `\`${f}\``).join(", ")}`,
              embeds: [
                new MessageEmbed()
                  .setColor(ee.color)
                  .setTitle("🎛️ Filtros Atuais")
                  .addField("**Filtros Ativos:**", updatedFilters.length ? updatedFilters.map(f => `\`${f}\``).join(", ") : "Nenhum")
              ],
              components: []
            }).catch(() => {});
            
            await msg.edit({
              embeds: [getEmbed(updatedFilters, true)],
              components: createMainMenu(updatedFilters, true)
            }).catch(() => {});
          }
        } catch (e) {
          console.log("Collector error:", e);
        }
      });
      
      collector.on("end", async () => {
        try {
          const expiredQueue = client.distube.getQueue(guildId);
          const expiredFilters = getCurrentFilters(expiredQueue);
          await msg.edit({
            embeds: [getEmbed(expiredFilters, true)],
            components: createMainMenu(expiredFilters, !!expiredQueue)
          }).catch(() => {});
        } catch (e) {
          console.log("End collector error:", e);
        }
      });
      
    } catch (e) {
      console.log(e.stack ? e.stack : e);
      message.reply({
        content: `${client.allEmojis.x} | Erro: `,
        embeds: [new MessageEmbed().setColor(ee.wrongcolor).setDescription(`\`\`\`${e}\`\`\``)]
      });
    }
  }
};
