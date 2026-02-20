const { MessageEmbed } = require("discord.js");
const ee = require("../../botconfig/embed.json");

const CONFESSION_TIMEOUT = 120000;
const pendingConfessions = new Map();

module.exports = {
  name: "confissão",
  aliases: ["confessar", "conf", "anonimo", "anonymous"],
  category: "utilidade",
  usage: "confissão",
  description: "Envie uma confissão anônima.",
  cooldown: 10,

  run: async (client, message, args) => {
    await startConfession(client, message, message ? message.author : message.user);
  },

  runSlash: async (client, interaction) => {
    await startConfession(client, interaction, interaction.user);
  }
};

async function startConfession(client, context, user) {
  const userId = user.id;
  const isInteraction = context.isCommand || context.isContextMenu;

  if (pendingConfessions.has(userId)) {
    const embed = new MessageEmbed()
      .setColor(ee.color)
      .setTitle("💭 Confissão")
      .setDescription("Você já tem uma confissão pendente.\nAguarde ou cancele enviando `cancelar`.")
      .setFooter(ee.footertext, ee.footericon);

    if (isInteraction) {
      return context.reply({ embeds: [embed], ephemeral: true });
    }
    return context.reply({ embeds: [embed] }).then(() => {
      setTimeout(() => context.delete().catch(() => {}), 3000);
    });
  }

  const dmChannel = await user.createDM().catch(() => null);

  if (!dmChannel) {
    const embed = new MessageEmbed()
      .setColor(ee.color)
      .setTitle("💭 Confissão")
      .setDescription("❌ Não foi possível abrir DM com você.\nVerifique suas configurações de privacidade.")
      .setFooter(ee.footertext, ee.footericon);

    if (isInteraction) {
      return context.reply({ embeds: [embed], ephemeral: true });
    }
    return context.reply({ embeds: [embed] }).then(() => {
      setTimeout(() => context.delete().catch(() => {}), 3000);
    });
  }

  let guildId, channelId;

  if (isInteraction) {
    guildId = context.guildId;
    client.settings.ensure(guildId, { confessionChannel: null });
    channelId = client.settings.get(guildId, "confessionChannel");
  } else {
    guildId = context.guild.id;
    client.settings.ensure(guildId, { confessionChannel: null });
    channelId = client.settings.get(guildId, "confessionChannel");
  }

  const instructionsEmbed = new MessageEmbed()
    .setColor(ee.color)
    .setTitle("💭 Confissão Anônima")
    .setDescription(
      "Você está prestes a enviar uma confissão anônima.\n\n" +
      "📝 **Como funciona:**\n" +
      "1. Você tem 2 minutos para escrever sua confissão aqui\n" +
      "2. Quando enviar, ela será postada anonimamente no servidor\n" +
      "3. Para cancelar, digite `cancelar`\n\n" +
      "⏰ **Tempo restante:** 2 minutos"
    )
    .setFooter(ee.footertext, ee.footericon);

  await dmChannel.send({ embeds: [instructionsEmbed] }).catch(() => null);

  pendingConfessions.set(userId, {
    guildId: guildId,
    channelId: channelId,
    timeout: setTimeout(() => {
      if (pendingConfessions.has(userId)) {
        pendingConfessions.delete(userId);
        dmChannel.send({
          embeds: [
            new MessageEmbed()
              .setColor(ee.color)
              .setTitle("💭 Confissão")
              .setDescription("⏰ Tempo expirado. Sua confissão foi cancelada.")
              .setFooter(ee.footertext, ee.footericon)
          ]
        }).catch(() => {});
      }
    }, CONFESSION_TIMEOUT)
  });

  const confirmEmbed = new MessageEmbed()
    .setColor(ee.color)
    .setTitle("💭 Confissão")
    .setDescription("✅ Uma DM foi enviada para você com as instruções!\nVerifique suas mensagens diretas.")
    .setFooter(ee.footertext, ee.footericon);

  if (isInteraction) {
    return context.reply({ embeds: [confirmEmbed], ephemeral: true });
  }

  const reply = await context.reply({ embeds: [confirmEmbed] }).catch(() => {});
  if (context.deletable) {
    setTimeout(() => {
      context.delete().catch(() => {});
      if (reply) reply.delete().catch(() => {});
    }, 3000);
  }
}

module.exports.handleDM = async (client, dmMessage) => {
  const userId = dmMessage.author.id;
  const content = dmMessage.content.trim();

  if (!pendingConfessions.has(userId)) return;

  if (content.toLowerCase() === "cancelar") {
    clearTimeout(pendingConfessions.get(userId).timeout);
    pendingConfessions.delete(userId);

    dmMessage.reply({
      embeds: [
        new MessageEmbed()
          .setColor(ee.color)
          .setTitle("💭 Confissão")
          .setDescription("❌ Confissão cancelada.")
          .setFooter(ee.footertext, ee.footericon)
      ]
    }).catch(() => {});

    return;
  }

  const { guildId, channelId } = pendingConfessions.get(userId);
  clearTimeout(pendingConfessions.get(userId).timeout);
  pendingConfessions.delete(userId);

  const guild = client.guilds.cache.get(guildId);
  if (!guild) {
    dmMessage.reply({
      embeds: [
        new MessageEmbed()
          .setColor(ee.color)
          .setTitle("💭 Confissão")
          .setDescription("❌ Servidor não encontrado.")
          .setFooter(ee.footertext, ee.footericon)
      ]
    }).catch(() => {});
    return;
  }

  const targetChannel = channelId
    ? guild.channels.cache.get(channelId) || await guild.channels.fetch(channelId).catch(() => null)
    : guild.systemChannel || guild.channels.cache.find(c => c.type === "GUILD_TEXT") || await guild.channels.fetch().then(channels => channels.find(c => c.type === "GUILD_TEXT")).catch(() => null);

  if (!targetChannel) {
    dmMessage.reply({
      embeds: [
        new MessageEmbed()
          .setColor(ee.color)
          .setTitle("💭 Confissão")
          .setDescription("❌ Nenhum canal disponível para enviar a confissão.")
          .setFooter(ee.footertext, ee.footericon)
      ]
    }).catch(() => {});
    return;
  }

  const confessionEmbed = new MessageEmbed()
    .setColor(ee.color)
    .setTitle("💭 Nova Confissão")
    .setDescription(content)
    .setFooter(ee.footertext, ee.footericon)
    .setTimestamp();

  await targetChannel.send({ embeds: [confessionEmbed] }).catch(async () => {
    dmMessage.reply({
      embeds: [
        new MessageEmbed()
          .setColor(ee.color)
          .setTitle("💭 Confissão")
          .setDescription("❌ Erro ao enviar confissão. O bot pode não ter permissão.")
          .setFooter(ee.footertext, ee.footericon)
      ]
    }).catch(() => {});
    return;
  });

  dmMessage.reply({
    embeds: [
      new MessageEmbed()
        .setColor(ee.color)
        .setTitle("💭 Confissão Enviada!")
        .setDescription(
          "✅ Sua confissão foi enviada com sucesso!\n\n" +
          (channelId ? `📍 Canal: ${targetChannel}` : "📍 Canal: Canal padrão do servidor")
        )
        .setFooter(ee.footertext, ee.footericon)
    ]
  }).catch(() => {});
};
