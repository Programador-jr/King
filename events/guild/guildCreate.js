const { MessageEmbed } = require("discord.js");
const { addUserJoined } = require("../../databases/mongodb");
const ee = require("../../botconfig/embed.json");
const GuildAudit = require("../../databases/guildAudit");

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
    
    // Envia mensagem de entrada em um novo servidor
    const logChannelId = process.env.LOG_CHANNEL_ID;
    if (logChannelId) {
      const logChannel = client.channels.cache.get(logChannelId);
      if (logChannel) {
        const embed = new MessageEmbed()
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
          .setFooter(ee.footertext, ee.footericon)
          .setTimestamp();
        
        logChannel.send({ embeds: [embed] }).catch(() => {});
      }
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e || "");
    console.log(`Erro no evento guildCreate: ${message.replace(/\s+/g, " ").trim()}`);
  }
};
