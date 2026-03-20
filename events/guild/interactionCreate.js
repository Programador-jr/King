const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuBuilder,
  ChannelType,
  PermissionFlagsBits
} = require("discord.js");

module.exports = async (client, interaction) => {
  client.settings.ensure(interaction.guildId, {
    prefix: client.config?.prefix || "!",
    defaultvolume: 50,
    defaultautoplay: false,
    defaultfilters: ["bassboost6", "clear"],
    djroles: [],
    botchannel: [],
    musicChannels: [],
    confessionChannel: null,
    mixDefault: "youtube"
  });

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
      
      const modalParts = interaction.customId.split('_');
      const categoryId = modalParts.length > 3 ? (modalParts[3] === 'null' ? null : modalParts[3]) : null;
      
      console.log("[Ticket Modal Submit] Categoria extraída:", categoryId);
      
      const answers = {};
      let reason = "Ticket criado via painel";
      
      interaction.fields.fields.forEach((field) => {
        const customId = field.customId;
        answers[customId] = field.value;
        if (customId === 'reason' || field.value.length > 0) {
          reason = field.value;
        }
      });

      console.log("[Ticket Modal Submit] Respostas coletadas:", Object.keys(answers).length);

      const existingTicket = client.ticketHandler.getUserTicket(interaction.guild.id, interaction.user.id);
      if (existingTicket) {
        return interaction.reply({
          content: `❌ Você já tem um ticket aberto: <#${existingTicket.channelId}>`,
          ephemeral: true
        });
      }

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

      const ticketChannel = await client.ticketHandler.createTicketChannel(
        interaction.guild,
        ticketData,
        categoryId
      );

      if (!ticketChannel) {
        return interaction.reply({
          content: "❌ Não foi possível criar o canal do ticket.",
          ephemeral: true
        });
      }

      try {
        await client.ticketHandler.sendOpenLog(interaction.guild.id, ticketData, interaction.guild, interaction.user);
      } catch (logError) {
        console.error("[Ticket Modal Submit] Erro ao enviar log de abertura:", logError);
      }
      
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

      Object.entries(answers).forEach(([customId, answer], index) => {
        if (answer && answer.trim()) {
          embed.addFields({
            name: `Resposta ${index + 1}`,
            value: answer.length > 1024 ? answer.substring(0, 1021) + "..." : answer,
            inline: false
          });
        }
      });

      const closeButton = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId("close_ticket")
            .setLabel("🔒 Fechar Ticket")
            .setStyle(ButtonStyle.Danger)
        );

      await ticketChannel.send({
        content: `${interaction.user}`,
        embeds: [embed],
        components: [closeButton]
      });

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
  // BOTÕES / SELECT MENU
  // ===============================
  if (interaction.isButton() || interaction.isStringSelectMenu()) {

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
        
        const existingTicket = client.ticketHandler.getUserTicket(interaction.guild.id, interaction.user.id);
        if (existingTicket) {
          return interaction.reply({
            content: `❌ Você já tem um ticket aberto: <#${existingTicket.channelId}>`,
            ephemeral: true
          });
        }

        console.log("[Create Ticket] Buscando painel para verificar perguntas...");
        
        const panel = client.ticketHandler.findPanelByCustomId(interaction.guild.id, interaction.customId);
        
        if (!panel) {
          console.log("[Create Ticket] Painel não encontrado, criando ticket diretamente...");
          return createTicketDirectly(interaction, client.ticketHandler, "Ticket criado via painel", null);
        }

        console.log("[Create Ticket] Painel encontrado:", panel.panelId);
        console.log("[Create Ticket] Perguntas configuradas:", panel.questions?.length || 0);

        let categoryId = null;
        if (panel.useCategory && panel.categoryId) {
          categoryId = panel.categoryId;
          console.log("[Create Ticket] Usando categoria:", categoryId);
        }

        if (panel.questions && panel.questions.length > 0) {
          console.log("[Create Ticket] Abrindo modal com perguntas...");
          return createTicketModal(interaction, panel.questions, categoryId);
        } else {
          console.log("[Create Ticket] Sem perguntas, criando ticket diretamente...");
          return createTicketDirectly(interaction, client.ticketHandler, "Ticket criado via painel", categoryId);
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

    // ===============================
    // BOTÃO DE FECHAR TICKET
    // ===============================
    if (interaction.customId === "close_ticket") {
      if (!client.ticketHandler) {
        const TicketHandler = require("../../handlers/tickets");
        client.ticketHandler = new TicketHandler(client);
      }

      try {
        console.log("[Close Ticket] Botão de fechar clicado...");
        console.log("[Close Ticket] Canal:", interaction.channel.name);
        console.log("[Close Ticket] Usuário:", interaction.user.tag);

        const channelName = interaction.channel.name;
        if (!channelName.startsWith("ticket-") && !channelName.startsWith("closed-")) {
          console.log("[Close Ticket] Erro: Canal não é um ticket");
          return interaction.reply({
            content: "❌ Este não é um canal de ticket.",
            ephemeral: true
          });
        }

        const ticketNumber = parseInt(channelName.replace(/[^0-9]/g, ""));
        if (!ticketNumber) {
          console.log("[Close Ticket] Erro: Não foi possível extrair número do ticket");
          return interaction.reply({
            content: "❌ Não foi possível identificar o número do ticket.",
            ephemeral: true
          });
        }

        console.log("[Close Ticket] Número do ticket:", ticketNumber);

        const ticketData = client.ticketHandler.getTicket(interaction.guild.id, ticketNumber);
        if (!ticketData) {
          console.log("[Close Ticket] Erro: Ticket não encontrado no banco");
          return interaction.reply({
            content: "❌ Ticket não encontrado.",
            ephemeral: true
          });
        }

        console.log("[Close Ticket] Dados do ticket:", {
          userId: ticketData.userId,
          status: ticketData.status,
          createdBy: ticketData.userId
        });

        const isTicketOwner = ticketData.userId === interaction.user.id;
        const hasManageGuildPermission = interaction.member.permissions.has(PermissionFlagsBits.ManageGuild);
        
        console.log("[Close Ticket] Permissões:", {
          isTicketOwner,
          hasManageGuildPermission,
          interactionUserId: interaction.user.id,
          ticketUserId: ticketData.userId
        });
        
        if (!isTicketOwner && !hasManageGuildPermission) {
          console.log("[Close Ticket] Erro: Usuário sem permissão");
          return interaction.reply({
            content: "❌ Apenas o dono do ticket ou staff pode fechar o ticket.",
            ephemeral: true
          });
        }

        const closedTicket = await client.ticketHandler.closeTicket(
          interaction.guild.id,
          ticketNumber,
          interaction.user.id,
          interaction.user.tag
        );

        console.log("[Close Ticket] closeTicket retornou:", closedTicket ? "sucesso" : "falha");

        if (!closedTicket) {
          console.log("[Close Ticket] Erro: closeTicket retornou null");
          return interaction.reply({
            content: "❌ Não foi possível fechar o ticket.",
            ephemeral: true
          });
        }

        const duration = closedTicket.closedAt && closedTicket.createdAt 
          ? Math.floor((closedTicket.closedAt - closedTicket.createdAt) / 1000 / 60)
          : 0;
        const durationText = duration > 0 
          ? `${duration} minuto${duration !== 1 ? 's' : ''}`
          : "menos de 1 minuto";

        await interaction.channel.permissionOverwrites.edit(closedTicket.userId, {
          ViewChannel: false,
          SendMessages: false
        });

        try {
          await client.ticketHandler.sendCloseLog(interaction.guild.id, closedTicket, interaction.guild, interaction.user);
        } catch (logError) {
          console.error("[Close Ticket] Erro ao enviar log de fechamento:", logError);
        }

        const embed = new EmbedBuilder()
          .setColor("#FF6B6B")
          .setTitle("🔒 Ticket Fechado")
          .setDescription(`Ticket fechado por ${interaction.user.tag}`)
          .addFields(
            { name: "Ticket", value: `#${ticketNumber}`, inline: true },
            { name: "Fechado por", value: interaction.user.tag, inline: true },
            { name: "Duração", value: durationText, inline: true }
          )
          .setTimestamp()
          .setFooter({ text: "Atendimento • Suporte" });

        const actionButtons = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId("reopen_ticket")
              .setLabel("🔓 Reabrir Ticket")
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId("delete_ticket")
              .setLabel("🗑️ Excluir Ticket")
              .setStyle(ButtonStyle.Danger)
          );

        await interaction.channel.send({ 
          embeds: [embed],
          components: [actionButtons]
        });

        await interaction.reply({
          content: "✅ Ticket fechado com sucesso!",
          ephemeral: true
        });

      } catch (error) {
        console.error("[Close Ticket] Erro:", error);
        await interaction.reply({
          content: "❌ Ocorreu um erro ao fechar o ticket.",
          ephemeral: true
        });
      }
      return;
    }

    // ===============================
    // REABRIR TICKET
    // ===============================
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
          .setColor("#00D26A")
          .setTitle("🔓 Ticket Reaberto")
          .setDescription(`Este ticket foi reaberto por ${interaction.user.tag}.`)
          .addFields(
            { name: "Ticket", value: `#${ticketNumber}`, inline: true },
            { name: "Reaberto por", value: interaction.user.tag, inline: true }
          )
          .setTimestamp()
          .setFooter({ text: "Atendimento • Suporte" });

        const closeButton = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId("close_ticket")
              .setLabel("🔒 Fechar Ticket")
              .setStyle(ButtonStyle.Danger)
          );

        await interaction.reply({ 
          embeds: [embed],
          components: [closeButton]
        });

      } catch (error) {
        console.error("[Reopen Ticket] Erro:", error);
        await interaction.reply({
          content: "❌ Ocorreu um erro ao reabrir o ticket.",
          ephemeral: true
        });
      }
      return;
    }

    // ===============================
    // DELETAR TICKET
    // ===============================
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

    // ===============================
    // CONFESSION CHANNEL SETUP
    // ===============================
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
  // SLASH COMMANDS
  // ===============================
  const CategoryName = interaction.commandName;

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

  const musicChannels = client.settings.get(interaction.guildId, "musicChannels") || [];
  const isMusicCommand = command.category === "Musica";

  if (isMusicCommand && musicChannels.length > 0) {
    if (!musicChannels.includes(interaction.channelId) &&
        !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        ephemeral: true,
        embeds: [
          new EmbedBuilder()
            .setColor(client.embedColor?.wrong || "#FF0000")
            .setTitle("❌ Este comando só pode ser usado em canais específicos!")
            .setDescription(`Por favor, use em um desses canais:\n> ${musicChannels.map(c => `<#${c}>`).join(", ")}`)
        ]
      });
    }
  }

  let botchannels = client.settings.get(interaction.guildId, "botchannel");
  if (!botchannels || !Array.isArray(botchannels)) botchannels = [];

  if (botchannels.length > 0) {
    if (!botchannels.includes(interaction.channelId) &&
        !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        ephemeral: true,
        embeds: [
          new EmbedBuilder()
            .setColor(client.embedColor?.wrong || "#FF0000")
            .setTitle("❌ Você não pode usar esse comando aqui.")
            .setDescription(`Use em:\n> ${botchannels.map(c => `<#${c}>`).join(", ")}`)
        ]
      });
    }
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
          .setColor(client.embedColor?.wrong || "#FF0000")
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

// ===============================
// FUNÇÕES AUXILIARES
// ===============================
async function createTicketModal(interaction, questions, categoryId = null) {
  const modal = new ModalBuilder()
    .setCustomId(`ticket_modal_${Date.now()}_${categoryId || 'null'}`)
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

async function createTicketDirectly(interaction, ticketHandler, reason, categoryId = null) {
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

  const ticketChannel = await ticketHandler.createTicketChannel(
    interaction.guild,
    ticketData,
    categoryId
  );

  if (!ticketChannel) {
    return interaction.reply({
      content: "❌ Não foi possível criar o canal do ticket.",
      ephemeral: true
    });
  }

  try {
    await ticketHandler.sendOpenLog(interaction.guild.id, ticketData, interaction.guild, interaction.user);
  } catch (logError) {
    console.error("[Create Ticket Directly] Erro ao enviar log de abertura:", logError);
  }

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

  const closeButton = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId("close_ticket")
        .setLabel("🔒 Fechar Ticket")
        .setStyle(ButtonStyle.Danger)
    );

  await ticketChannel.send({
    content: `${interaction.user}`,
    embeds: [embed],
    components: [closeButton]
  });

  await interaction.reply({
    content: `✅ Ticket criado com sucesso! <#${ticketChannel.id}>`,
    ephemeral: true
  });
}
