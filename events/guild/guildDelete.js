const GuildAudit = require("../../databases/guildAudit");

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
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e || "");
    console.log(`Erro no evento guildDelete: ${message.replace(/\s+/g, " ").trim()}`);
  }
};
