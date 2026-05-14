const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { addUserJoined } = require("../../databases/mongodb");
const ee = require("../../botconfig/embed.json");
const GuildAudit = require("../../databases/guildAudit");
const joinMessages = require("../../botconfig/JoinMessages.json");

module.exports = async (client, guild) => {
  try {
    addUserJoined(guild.id);
    console.log("Bot entrou em um servidor.");
    const owner = await guild.fetchOwner().catch(() => null);
    await GuildAudit.create({
      guildId: guild.id,
      guildName: guild.name,
      ownerId: owner?.user?.id || guild.ownerId || null,
      ownerTag: owner?.user?.tag || null,
      memberCount: guild.memberCount || 0,
      action: "join"
    }).catch(() => null);

    if (owner?.user) {
      const messages = Object.values(joinMessages.joinMessages);
      const randomMsg = messages[Math.floor(Math.random() * messages.length)];
      const images = joinMessages.images;
      const randomImage = images.length > 0 ? images[Math.floor(Math.random() * images.length)] : null;

      const embed = new EmbedBuilder()
        .setColor(ee.color)
        .setTitle(randomMsg.title)
        .setDescription(randomMsg.description)
        .setThumbnail(guild.iconURL({ dynamic: true }))
        .setFooter({ text: randomMsg.footer.text, iconURL: ee.footericon })
        .setTimestamp();

      if (randomImage) embed.setImage(randomImage);

      const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel("<:support:1503537701637587164> Suporte").setStyle(ButtonStyle.Link).setURL("https://discord.gg/NypBbRgBJ3"),
        new ButtonBuilder().setLabel("<:commands:1503535909499437107> Comandos").setStyle(ButtonStyle.Link).setURL("https://kingbot.shardweb.app/commands")
      );

      await owner.user.send({ embeds: [embed], components: [buttons] }).catch(() => null);
    }

    const logChannelId = process.env.LOG_CHANNEL_ID;
    if (logChannelId) {
      const logChannel = client.channels.cache.get(logChannelId);
      if (logChannel) {
        const embed = new EmbedBuilder()
          .setColor(ee.color)
          .setTitle("🎉 Novo Servidor!")
          .setThumbnail(guild.iconURL({ dynamic: true }))
          .addFields(
            { name: "Servidor", value: `**${guild.name}**`, inline: true },
            { name: "ID", value: `\`${guild.id}\``, inline: true },
            { name: "Dono", value: `${owner?.user?.tag || "Desconhecido"}`, inline: true },
            { name: "Membros", value: `👥 \`${guild.memberCount}\``, inline: true },
            { name: "Criado em", value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`, inline: true }
          )
          .setFooter({ text: ee.footertext, iconURL: ee.footericon })
          .setTimestamp();

        logChannel.send({ embeds: [embed] }).catch(() => null);
      }
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e || "");
    console.log(`Erro no evento guildCreate: ${message.replace(/\s+/g, " ").trim()}`);
  }
};
