module.exports = async (client, member) => {
  try {
    if (!client.automodHandler) return;
    
    client.settings.ensure(member.guild.id, {
      automodEnabled: false,
      automodAntiNewAccountsEnabled: false,
      automodAntiNewAccountsMinDays: 1
    });
    
    const violation = await client.automodHandler.checkNewAccount(member);
    if (violation) {
      await client.automodHandler.logViolation(member.guild, violation, null, member);
      
      if (violation.action === "kick") {
        await member.kick(violation.reason).catch(() => {});
        console.log(`[AutoMod] Membro kickado por conta nova: ${member.user.tag} (${member.user.id})`);
      }
    }
  } catch (e) {
    console.log("[guildMemberAdd-AutoMod] Erro:", e.message);
  }
};
