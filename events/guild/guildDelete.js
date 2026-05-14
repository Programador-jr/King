const { EmbedBuilder } = require("discord.js");
const ee = require("../../botconfig/embed.json");
const GuildAudit = require("../../databases/guildAudit");
const leaveMessages = require("../../botconfig/LeaveMessages.json");

module.exports = async (_client, guild) => {
  try {
    await GuildAudit.create({
      guildId: guild.id,
      guildName: guild.name,
      ownerId: guild.ownerId || null,
      ownerTag: null,
      memberCount: guild.memberCount || 0,
      action: "leave"
    }).catch(() => null);

    console.log(`Bot removido do servidor ${guild.name} (${guild.id}).`);

    const owner = await guild.fetchOwner().catch(() => null);
    if (owner?.user) {
      const messages = Object.values(leaveMessages.leaveMessages);
      const randomMsg = messages[Math.floor(Math.random() * messages.length)];
      const images = leaveMessages.images;
      const randomImage = images.length > 0 ? images[Math.floor(Math.random() * images.length)] : null;

      const embed = new EmbedBuilder()
        .setColor(ee.wrongcolor)
        .setTitle(randomMsg.title)
        .setDescription(randomMsg.description)
        .setThumbnail(guild.iconURL({ dynamic: true }))
        .setFooter({ text: randomMsg.footer.text, iconURL: ee.footericon })
        .setTimestamp();

      if (randomImage) embed.setImage(randomImage);

      await owner.user.send({ embeds: [embed] }).catch(() => null);
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e || "");
    console.log(`Erro no evento guildDelete: ${message.replace(/\s+/g, " ").trim()}`);
  }
};
