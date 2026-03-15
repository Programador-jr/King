//Import Modules
const config = require(`../../botconfig/config.json`);
const ee = require(`../../botconfig/embed.json`);
const settings = require(`../../botconfig/settings.json`);
const { onCoolDown, replacemsg } = require("../../handlers/functions");
const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ChannelType,
  PermissionFlagsBits
} = require("discord.js");

module.exports = async (client, interaction) => {
  // Debug log
  console.log(`[Interaction] Tipo: ${interaction.type}, CustomId: ${interaction.customId}, User: ${interaction.user.tag}`);

  // ===============================
  // MODAL SUBMIT (TICKETS COM PERGUNTAS)
  // ===============================
  if (interaction.isModalSubmit() && interaction.customId.startsWith("ticket_modal_")) {
    if (!client.ticketHandler) {
      const TicketHandler = require("../../handlers/tickets");
      client.ticketHandler = new TicketHandler(client);
    }

    try {
      console.log("[Ticket Modal Submit] Processando respostas do modal...");
      
      // Coletar respostas das perguntas
      const answers = {};
      let reason = "Ticket criado via painel";
      
      // Obter todos os campos do modal
      interaction.fields.fields.forEach((field, customId) => {
        answers[customId] = field.value;
        if (customId === 'reason' || field.value.length > 0) {
          reason = field.value;
        }
      });

      console.log("[Ticket Modal Submit] Respostas coletadas:", Object.keys(answers).length);

      // Verificar novamente se o usuário já tem um ticket aberto
      const existingTicket = client.ticketHandler.getUserTicket(interaction.guild.id, interaction.user.id);
      if (existingTicket) {
        return interaction.reply({
          content: `❌ Você já tem um ticket aberto: <#${existingTicket.channelId}>`,
          ephemeral: true
        });
      }

      // Criar o ticket com as respostas
      const ticketData = await client.ticketHandler.createTicket(
        interaction.guild.id,
        interaction.user.id,
        reason,
        interaction.user.tag
      );

      if (!ticketData) {
        return interaction.reply({
          content: "❌ Não foi possível criar o ticket.",
          ephemeral: true
        });
      }

      // Criar o canal do ticket sem categoria específica
      const ticketChannel = await client.ticketHandler.createTicketChannel(
        interaction.guild,
        ticketData,
        null // Sem categoria específica
      );

      if (!ticketChannel) {
        return interaction.reply({
          content: "❌ Não foi possível criar o canal do ticket.",
          ephemeral: true
        });
      }

      // Enviar embed de boas-vindas com as respostas e botão de fechar
      const { MessageActionRow, MessageButton, EmbedBuilder } = require("discord.js");
      
      const embed = new EmbedBuilder()
        .setColor("#5865F2")
        .setTitle("🎫 Ticket Criado")
        .setDescription(`Olá ${interaction.user}!\n\nSeu ticket foi criado com sucesso.\nA equipe irá responder assim que possível.`)
        .addFields(
          { name: "Ticket", value: `#${ticketData.ticketNumber}`, inline: true },
          { name: "Criado por", value: interaction.user.tag, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: "Atendimento • Suporte" });

      // Adicionar as respostas das perguntas como campos
      Object.entries(answers).forEach(([customId, answer], index) => {
        if (answer && answer.trim()) {
          embed.addFields({
            name: `Resposta ${index + 1}`,
            value: answer.length > 1024 ? answer.substring(0, 1021) + "..." : answer,
            inline: false
          });
        }
      });

      // Criar botão de fechar
      const closeButton = new MessageActionRow()
        .addComponents(
          new MessageButton()
            .setCustomId("close_ticket")
            .setLabel("🔒 Fechar Ticket")
            .setStyle("DANGER")
        );

      await ticketChannel.send({
        content: `${interaction.user}`,
        embeds: [embed],
        components: [closeButton]
      });

      // Responder ao usuário
      await interaction.reply({
        content: `✅ Ticket criado com sucesso! <#${ticketChannel.id}>`,
        ephemeral: true
      });

    } catch (error) {
      console.error("[Ticket Modal Submit] Erro:", error);
      await interaction.reply({
        content: "❌ Ocorreu um erro ao criar seu ticket.",
        ephemeral: true
      });
    }
    return;
  }

  // ===============================
  // BOTÕES / SELECT MENU (CONFISSÃO)
  // ===============================
  if (interaction.isButton() || interaction.isStringSelectMenu() || interaction.isModalSubmit()) {

    // ===============================
    // BOTÕES DE TICKETS
    // ===============================
    if (interaction.customId === "create_ticket" || interaction.customId.startsWith("create_ticket_")) {
      if (!client.ticketHandler) {
        const TicketHandler = require("../../handlers/tickets");
        client.ticketHandler = new TicketHandler(client);
      }

      try {
        console.log("[Create Ticket] Botão clicado, verificando ticket existente...");
        
        // Verificar se usuário já tem um ticket aberto
        const existingTicket = client.ticketHandler.getUserTicket(interaction.guild.id, interaction.user.id);
        if (existingTicket) {
          return interaction.reply({
            content: `❌ Você já tem um ticket aberto: <#${existingTicket.channelId}>`,
            ephemeral: true
          });
        }

        console.log("[Create Ticket] Buscando painel para verificar perguntas...");
        
        // Encontrar o painel correspondente
        const panel = client.ticketHandler.findPanelByCustomId(interaction.guild.id, interaction.customId);
        
        if (!panel) {
          console.log("[Create Ticket] Painel não encontrado, criando ticket diretamente...");
          // Se não encontrar painel, cria ticket diretamente
          return createTicketDirectly(interaction, client.ticketHandler, "Ticket criado via painel");
        }

        console.log("[Create Ticket] Painel encontrado:", panel.panelId);
        console.log("[Create Ticket] Perguntas configuradas:", panel.questions?.length || 0);

        // Verificar se o painel tem perguntas
        if (panel.questions && panel.questions.length > 0) {
          console.log("[Create Ticket] Abrindo modal com perguntas...");
          return createTicketModal(interaction, panel.questions);
        } else {
          console.log("[Create Ticket] Sem perguntas, criando ticket diretamente...");
          return createTicketDirectly(interaction, client.ticketHandler, "Ticket criado via painel");
        }

      } catch (error) {
        console.error("[Create Ticket] Erro:", error);
        await interaction.reply({
          content: "❌ Ocorreu um erro ao criar seu ticket.",
          ephemeral: true
        });
      }
      return;
    }

    // Função para criar modal com perguntas
    async function createTicketModal(interaction, questions) {
      const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require("discord.js");
      
      const modal = new ModalBuilder()
        .setCustomId(`ticket_modal_${Date.now()}`)
        .setTitle("Abrir Ticket");

      questions.forEach((question, index) => {
        const input = new TextInputBuilder()
          .setCustomId(question.id || `question_${index}`)
          .setLabel(question.label || 'Pergunta')
          .setStyle(question.type === 'textarea' ? TextInputStyle.Paragraph : TextInputStyle.Short)
          .setPlaceholder(question.placeholder || '')
          .setRequired(question.required !== false)
          .setMaxLength(1000);

        const actionRow = new ActionRowBuilder().addComponents(input);
        modal.addComponents(actionRow);
      });

      await interaction.showModal(modal);
    }

    // Função para criar ticket diretamente
    async function createTicketDirectly(interaction, ticketHandler, reason) {
      const ticketData = await ticketHandler.createTicket(
        interaction.guild.id,
        interaction.user.id,
        reason,
        interaction.user.tag
      );

      if (!ticketData) {
        return interaction.reply({
          content: "❌ Não foi possível criar o ticket.",
          ephemeral: true
        });
      }

      // Criar o canal do ticket sem categoria específica
      const ticketChannel = await ticketHandler.createTicketChannel(
        interaction.guild,
        ticketData,
        null // Sem categoria específica
      );

      if (!ticketChannel) {
        return interaction.reply({
          content: "❌ Não foi possível criar o canal do ticket.",
          ephemeral: true
        });
      }

      // Enviar embed de boas-vindas com botão de fechar
      const { MessageActionRow, MessageButton, EmbedBuilder } = require("discord.js");
      
      const embed = new EmbedBuilder()
        .setColor("#5865F2")
        .setTitle("🎫 Ticket Criado")
        .setDescription(`Olá ${interaction.user}!\n\nSeu ticket foi criado com sucesso.\nA equipe irá responder assim que possível.`)
        .addFields(
          { name: "Ticket", value: `#${ticketData.ticketNumber}`, inline: true },
          { name: "Criado por", value: interaction.user.tag, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: "Atendimento • Suporte" });

      // Criar botão de fechar
      const closeButton = new MessageActionRow()
        .addComponents(
          new MessageButton()
            .setCustomId("close_ticket")
            .setLabel("🔒 Fechar Ticket")
            .setStyle("DANGER")
        );

      await ticketChannel.send({
        content: `${interaction.user}`,
        embeds: [embed],
        components: [closeButton]
      });

      // Responder ao usuário
      await interaction.reply({
        content: `✅ Ticket criado com sucesso! <#${ticketChannel.id}>`,
        ephemeral: true
      });
    }

    if (interaction.customId === "reopen_ticket") {
      if (!client.ticketHandler) {
        const TicketHandler = require("../../handlers/tickets");
        client.ticketHandler = new TicketHandler(client);
      }

      const channelName = interaction.channel.name;
      if (!channelName.startsWith("closed-")) {
        return interaction.reply({
          content: "❌ Este não é um ticket fechado.",
          ephemeral: true
        });
      }

      const ticketNumber = parseInt(channelName.replace(/[^0-9]/g, ""));
      if (!ticketNumber) {
        return interaction.reply({
          content: "❌ Não foi possível identificar o ticket.",
          ephemeral: true
        });
      }

      try {
        const reopenedTicket = await client.ticketHandler.reopenTicket(
          interaction.guild.id,
          ticketNumber,
          interaction.user.id,
          interaction.user.tag
        );

        await interaction.channel.setName(`ticket-${ticketNumber}`);
        await interaction.channel.permissionOverwrites.edit(interaction.user, {
          ViewChannel: true,
          SendMessages: true,
          ReadMessageHistory: true
        });

        const embed = new EmbedBuilder()
          .setColor(ee.color)
          .setTitle("🔓 Ticket Reaberto")
          .setDescription(`Este ticket foi reaberto por ${interaction.user.tag}.`)
          .addFields(
            { name: "Ticket", value: `#${ticketNumber}`, inline: true },
            { name: "Reaberto por", value: interaction.user.tag, inline: true }
          )
          .setTimestamp()
          .setFooter({ text: ee.footertext, iconURL: ee.footericon });

        await interaction.reply({ embeds: [embed] });

      } catch (error) {
        console.error("[Reopen Ticket] Erro:", error);
        await interaction.reply({
          content: "❌ Ocorreu um erro ao reabrir o ticket.",
          ephemeral: true
        });
      }
      return;
    }

    if (interaction.customId === "delete_ticket") {
      if (!client.ticketHandler) {
        const TicketHandler = require("../../handlers/tickets");
        client.ticketHandler = new TicketHandler(client);
      }

      const channelName = interaction.channel.name;
      if (!channelName.startsWith("closed-")) {
        return interaction.reply({
          content: "❌ Este não é um ticket fechado.",
          ephemeral: true
        });
      }

      const ticketNumber = parseInt(channelName.replace(/[^0-9]/g, ""));
      if (!ticketNumber) {
        return interaction.reply({
          content: "❌ Não foi possível identificar o ticket.",
          ephemeral: true
        });
      }

      try {
        await client.ticketHandler.deleteTicket(interaction.guild.id, ticketNumber);
        await interaction.reply({
          content: "🗑️ O ticket será deletado em 3 segundos...",
        });
        
        setTimeout(() => {
          interaction.channel.delete().catch(console.error);
        }, 3000);

      } catch (error) {
        console.error("[Delete Ticket] Erro:", error);
        await interaction.reply({
          content: "❌ Ocorreu um erro ao deletar o ticket.",
          ephemeral: true
        });
      }
      return;
    }

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
    botchannel: [],
    musicChannels: [],
    confessionChannel: null,
    mixDefault: "youtube"
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

  try {
    if (command.runSlash) {
      await Promise.resolve(command.runSlash(client, interaction));
    } else {
      await Promise.resolve(command.run(client, interaction));
    }
  } catch (error) {
    console.error("[interactionCreate] Falha ao executar comando:", error);
    const payload = {
      ephemeral: true,
      embeds: [
        new EmbedBuilder()
          .setColor(ee.wrongcolor)
          .setTitle("Erro ao executar o comando.")
      ]
    };

    if (interaction.deferred || interaction.replied) {
      await interaction.followUp(payload).catch(() => {});
    } else {
      await interaction.reply(payload).catch(() => {});
    }
  }
};
