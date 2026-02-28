const { 
  MessageEmbed, 
  MessageActionRow, 
  MessageButton,
  StringSelectMenuBuilder,
  ChannelType
} = require("discord.js");

const ee = require("../../botconfig/embed.json");

module.exports = {
  name: "botchat",
  category: "Configurações",
  aliases: ["confcanal", "musicchannel", "canalmusica"],
  usage: "botchat",
  cooldown: 3,
  description: "Configura o canal de confissões e canais de música.",
  memberpermissions: ["MANAGE_GUILD"],

  run: async (client, message) => {

    client.settings.ensure(message.guild.id, {
      confessionChannel: null,
      musicChannels: []
    });

    const currentConfession = client.settings.get(message.guild.id, "confessionChannel");
    const currentMusicChannels = client.settings.get(message.guild.id, "musicChannels");

    const createMainMenu = () => {
      return new MessageActionRow().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("botchat_menu")
          .setPlaceholder("Selecione uma opção")
          .addOptions([
            {
              label: "🎭 Canal de Confissões",
              value: "confession",
              description: "Configure o canal para confissões anônimas"
            },
            {
              label: "🎵 Canais de Música",
              value: "music",
              description: "Configure onde comandos de música podem ser usados"
            }
          ])
      );
    };

    const getConfessionEmbed = () => {
      return new MessageEmbed()
        .setColor(ee.color)
        .setTitle("⚙️ Configuração de Confissões")
        .setDescription(
          currentConfession
            ? `Canal atual: <#${currentConfession}>\n\nClique abaixo para alterar.`
            : "Nenhum canal configurado.\n\nClique abaixo para selecionar um canal."
        )
        .setFooter(ee.footertext, ee.footericon);
    };

    const getMusicEmbed = () => {
      const channels = currentMusicChannels.length > 0 
        ? currentMusicChannels.map(c => `<#${c}>`).join(", ")
        : "Nenhum canal configurado";
      
      return new MessageEmbed()
        .setColor(ee.color)
        .setTitle("🎵 Configuração de Canais de Música")
        .setDescription(
          `**Canais ativos:** ${channels}\n\n` +
          "Se nenhum canal for configurado, comandos de música poderão ser usados em qualquer canal.\n" +
          "Se houver canais configurados, apenas neles será permitido usar comandos de música."
        )
        .setFooter(ee.footertext, ee.footericon);
    };

    const getMainEmbed = () => {
      const confessionStatus = currentConfession ? `<#${currentConfession}>` : "Não configurado";
      const musicStatus = currentMusicChannels.length > 0 
        ? currentMusicChannels.map(c => `<#${c}>`).join(", ")
        : "Qualquer canal";
      
      return new MessageEmbed()
        .setColor(ee.color)
        .setTitle("⚙️ Configurações do Bot")
        .addFields(
          { name: "🎭 Canal de Confissões", value: confessionStatus, inline: true },
          { name: "🎵 Canais de Música", value: musicStatus, inline: true }
        )
        .setFooter(ee.footertext, ee.footericon);
    };

    const mainRow = createMainMenu();
    const backRow = new MessageActionRow().addComponents(
      new MessageButton()
        .setCustomId("botchat_back")
        .setLabel("Voltar")
        .setStyle("SECONDARY")
        .setEmoji("⬅️")
    );

    const msg = await message.reply({
      embeds: [getMainEmbed()],
      components: [mainRow]
    });

    const collector = msg.createMessageComponentCollector({
      filter: (i) => i.user.id === message.author.id,
      time: 120000
    });

    let currentView = "main";

    collector.on("collect", async (interaction) => {
      try {
        if (interaction.user.id !== message.author.id) {
          return interaction.reply({ content: "❌ Você não pode usar isso!", ephemeral: true });
        }

        await interaction.deferUpdate();

        if (interaction.customId === "botchat_menu") {
          const value = interaction.values[0];
          
          if (value === "confession") {
            currentView = "confession";
            return interaction.editReply({
              embeds: [getConfessionEmbed()],
              components: [
                new MessageActionRow().addComponents(
                  new MessageButton()
                    .setCustomId("setup_confession_channel")
                    .setLabel("Selecionar Canal")
                    .setStyle("PRIMARY")
                ),
                backRow
              ]
            });
          }
          
          if (value === "music") {
            currentView = "music";
            return interaction.editReply({
              embeds: [getMusicEmbed()],
              components: [
                new MessageActionRow().addComponents(
                  new MessageButton()
                    .setCustomId("setup_music_channels")
                    .setLabel("Adicionar/Remover Canais")
                    .setStyle("PRIMARY"),
                  new MessageButton()
                    .setCustomId("clear_music_channels")
                    .setLabel("Limpar Todos")
                    .setStyle("DANGER")
                ),
                backRow
              ]
            });
          }
        }

        if (interaction.customId === "botchat_back") {
          currentView = "main";
          return interaction.editReply({
            embeds: [getMainEmbed()],
            components: [mainRow]
          });
        }

        if (interaction.customId === "setup_confession_channel") {
          const channels = message.guild.channels.cache
            .filter(c => c.type === ChannelType.GuildText)
            .first(25);

          const menu = new StringSelectMenuBuilder()
            .setCustomId("select_confession_channel")
            .setPlaceholder("Selecione um canal")
            .addOptions(channels.map(c => ({
              label: c.name,
              value: c.id
            })));

          return interaction.editReply({
            content: "Selecione o canal de confissões:",
            embeds: [],
            components: [
              new MessageActionRow().addComponents(menu),
              backRow
            ]
          });
        }

        if (interaction.customId === "select_confession_channel") {
          const channelId = interaction.values[0];
          client.settings.set(message.guild.id, channelId, "confessionChannel");
          
          currentView = "main";
          return interaction.editReply({
            content: `✅ Canal de confissões configurado: <#${channelId}>`,
            embeds: [getMainEmbed()],
            components: [mainRow]
          });
        }

        if (interaction.customId === "setup_music_channels") {
          const existingChannels = client.settings.get(message.guild.id, "musicChannels") || [];
          const allChannels = message.guild.channels.cache
            .filter(c => c.type === ChannelType.GuildText)
            .first(25);

          const options = allChannels.map(c => ({
            label: c.name,
            value: c.id,
            default: existingChannels.includes(c.id)
          }));

          const menu = new StringSelectMenuBuilder()
            .setCustomId("select_music_channels")
            .setPlaceholder("Selecione os canais de música")
            .setMinValues(0)
            .setMaxValues(options.length)
            .addOptions(options);

          return interaction.editReply({
            content: "Selecione os canais onde comandos de música podem ser usados:",
            embeds: [],
            components: [
              new MessageActionRow().addComponents(menu),
              backRow
            ]
          });
        }

        if (interaction.customId === "select_music_channels") {
          const channelIds = interaction.values;
          client.settings.set(message.guild.id, channelIds, "musicChannels");
          
          currentView = "main";
          return interaction.editReply({
            content: channelIds.length > 0 
              ? `✅ Canais de música atualizados: ${channelIds.map(c => `<#${c}>`).join(", ")}`
              : "✅ Canais de música removidos. Agora qualquer canal pode usar comandos de música.",
            embeds: [getMainEmbed()],
            components: [mainRow]
          });
        }

        if (interaction.customId === "clear_music_channels") {
          client.settings.set(message.guild.id, [], "musicChannels");
          
          currentView = "main";
          return interaction.editReply({
            content: "✅ Todos os canais de música foram removidos.",
            embeds: [getMainEmbed()],
            components: [mainRow]
          });
        }

      } catch (e) {
        console.log("Botchat collector error:", e);
      }
    });

    collector.on("end", async () => {
      try {
        await msg.edit({ components: [] }).catch(() => {});
      } catch (e) {}
    });
  }
};
