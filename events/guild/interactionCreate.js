//Import Modules
const config = require(`../../botconfig/config.json`);
const ee = require(`../../botconfig/embed.json`);
const settings = require(`../../botconfig/settings.json`);
const { onCoolDown, replacemsg } = require("../../handlers/functions");
const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ChannelType,
  PermissionFlagsBits
} = require("discord.js");

module.exports = async (client, interaction) => {

  // ===============================
  // BOTÕES / SELECT MENU (CONFISSÃO)
  // ===============================
  if (interaction.isButton() || interaction.isStringSelectMenu()) {

    if (interaction.customId === "setup_confession_channel") {

      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return interaction.reply({
          content: "❌ Apenas administradores podem configurar.",
          ephemeral: true
        });
      }

      const channels = interaction.guild.channels.cache
        .filter(c => c.type === ChannelType.GuildText)
        .first(25);

      if (!channels.length) {
        return interaction.reply({
          content: "❌ Nenhum canal de texto encontrado.",
          ephemeral: true
        });
      }

      const menu = new StringSelectMenuBuilder()
        .setCustomId("select_confession_channel")
        .setPlaceholder("Selecione um canal")
        .addOptions(
          channels.map(c => ({
            label: c.name,
            value: c.id
          }))
        );

      const row = new ActionRowBuilder().addComponents(menu);

      return interaction.reply({
        content: "Escolha o canal de confissões:",
        components: [row],
        ephemeral: true
      });
    }

    if (interaction.customId === "select_confession_channel") {

      const channelId = interaction.values[0];

      client.settings.set(interaction.guild.id, channelId, "confessionChannel");

      return interaction.update({
        content: `✅ Canal configurado com sucesso: <#${channelId}>`,
        components: []
      });
    }
  }

  // ===============================
  // SUA LÓGICA ANTIGA (INALTERADA)
  // ===============================

  const CategoryName = interaction.commandName;

  client.settings.ensure(interaction.guildId, {
    prefix: config.prefix,
    defaultvolume: 50,
    defaultautoplay: false,
    defaultfilters: [`bassboost6`, `clear`],
    djroles: [],
    musicChannels: []
  });

  let prefix = client.settings.get(interaction.guildId, "prefix");

  let command = false;

  try {
    if (interaction.options.getSubcommand()) {
      if (client.slashCommands.has(CategoryName + interaction.options.getSubcommand())) {
        command = client.slashCommands.get(CategoryName + interaction.options.getSubcommand());
      }
    }
  } catch {}

  if (!command) {
    if (client.slashCommands.has("normal" + CategoryName)) {
      command = client.slashCommands.get("normal" + CategoryName);
    } else if (client.slashCommands.has(CategoryName)) {
      command = client.slashCommands.get(CategoryName);
    }
  }

  if (!command) return;

  // Verificação de canais de música
  const musicChannels = client.settings.get(interaction.guildId, "musicChannels") || [];
  const isMusicCommand = command.category === "Musica";

  if (isMusicCommand && musicChannels.length > 0) {
    if (!musicChannels.includes(interaction.channelId) &&
        !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {

      return interaction.reply({
        ephemeral: true,
        embeds: [
          new EmbedBuilder()
            .setColor(ee.wrongcolor)
            .setTitle("❌ Este comando só pode ser usado em canais específicos!")
            .setDescription(`Por favor, use em um desses canais:\n> ${musicChannels.map(c => `<#${c}>`).join(", ")}`)
        ]
      });
    }
  }

  let botchannels = client.settings.get(interaction.guildId, `botchannel`);
  if (!botchannels || !Array.isArray(botchannels)) botchannels = [];

  if (botchannels.length > 0) {
    if (!botchannels.includes(interaction.channelId) &&
        !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {

      return interaction.reply({
        ephemeral: true,
        embeds: [
          new EmbedBuilder()
            .setColor(ee.wrongcolor)
            .setTitle("❌ Você não pode usar esse comando aqui.")
            .setDescription(`Use em:\n> ${botchannels.map(c => `<#${c}>`).join(", ")}`)
        ]
      });
    }
  }

  if (onCoolDown(interaction, command)) {
    return interaction.reply({
      ephemeral: true,
      embeds: [
        new EmbedBuilder()
          .setColor(ee.wrongcolor)
          .setTitle(replacemsg(settings.messages.cooldown, {
            prefix: prefix,
            command: command,
            timeLeft: onCoolDown(interaction, command)
          }))
      ]
    });
  }

  if (command.runSlash) {
    command.runSlash(client, interaction);
  } else {
    command.run(client, interaction);
  }
};