const { MessageEmbed } = require("discord.js");
const { addUserJoined } = require("../../databases/mongodb");
const ee = require("../../botconfig/embed.json");

module.exports = async (client, guild) => {
  try {
    addUserJoined(guild.id);
    console.log(`Bot entrou no servidor: ${guild.name} (${guild.id})`);
    
    // Envia mensagem de entrada em um novo servidor
    const logChannelId = process.env.LOG_CHANNEL_ID;
    if (logChannelId) {
      const logChannel = client.channels.cache.get(logChannelId);
      if (logChannel) {
        const owner = await guild.fetchOwner();
        
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
    console.log("Erro no evento guildCreate:", e);
  }
};
