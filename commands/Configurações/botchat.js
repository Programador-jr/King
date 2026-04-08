const { 
  MessageEmbed, 
  MessageActionRow, 
  MessageButton,
  StringSelectMenuBuilder,
  ChannelType
} = require("discord.js");

const ee = require("../../botconfig/embed.json");

function isIgnorableInteractionError(error) {
  return error?.code === 10062 || error?.code === 40060;
}

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
      const currentConfession = client.settings.get(message.guild.id, "confessionChannel");

      return new MessageEmbed()
        .setColor(ee.color)
        .setTitle("⚙️ Configuração de Confissões")
        .setDescription(
          currentConfession
            ? `Canal atual: <#${currentConfession}>\n\nClique abaixo para alterar.`
            : "Nenhum canal configurado.\n\nSem este canal, o comando de confissão não funciona. Clique abaixo para selecionar."
        )
        .setFooter(ee.footertext, ee.footericon);
    };

    const getMusicEmbed = () => {
      const currentMusicChannels = client.settings.get(message.guild.id, "musicChannels") || [];
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
      const currentConfession = client.settings.get(message.guild.id, "confessionChannel");
      const currentMusicChannels = client.settings.get(message.guild.id, "musicChannels") || [];
      const confessionStatus = currentConfession ? `<#${currentConfession}>` : "Não configurado (comando desativado)";
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

    const safeUpdate = async (interaction, payload) => {
      try {
        if (interaction.deferred || interaction.replied) {
          return await interaction.editReply(payload);
        }
        return await interaction.update(payload);
      } catch (error) {
        if (isIgnorableInteractionError(error)) return null;
        throw error;
      }
    };

    let currentView = "main";

    collector.on("collect", async (interaction) => {
      try {
        if (interaction.user.id !== message.author.id) {
          return interaction.reply({ content: `${client.allEmojis.x} Você não pode usar isso!`, flags: 64 }).catch(() => null);
        }

        if (interaction.customId === "botchat_menu") {
          const value = interaction.values[0];
          
          if (value === "confession") {
            currentView = "confession";
            return safeUpdate(interaction, {
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
            return safeUpdate(interaction, {
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
          return safeUpdate(interaction, {
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

          return safeUpdate(interaction, {
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
          return safeUpdate(interaction, {
            content: `${client.allEmojis.check_mark} Canal de confissões configurado: <#${channelId}>`,
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

          return safeUpdate(interaction, {
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
          return safeUpdate(interaction, {
            content: channelIds.length > 0 
              ? `${client.allEmojis.check_mark} Canais de música atualizados: ${channelIds.map(c => `<#${c}>`).join(", ")}`
              : `${client.allEmojis.check_mark} Canais de música removidos. Agora qualquer canal pode usar comandos de música.`,
            embeds: [getMainEmbed()],
            components: [mainRow]
          });
        }

        if (interaction.customId === "clear_music_channels") {
          client.settings.set(message.guild.id, [], "musicChannels");
          
          currentView = "main";
          return safeUpdate(interaction, {
            content: `${client.allEmojis.check_mark} Todos os canais de música foram removidos.`,
            embeds: [getMainEmbed()],
            components: [mainRow]
          });
        }

      } catch (e) {
        if (isIgnorableInteractionError(e)) return;
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
