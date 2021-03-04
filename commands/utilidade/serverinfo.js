const discord = require("discord.js");

module.exports = {
  name: "serverinfo",
  category: "info",
	aliases:["servidorinfo"],
  description: "Get the info of any server",
  run: async (client, message, args) => {
    if (message.guild.premiumTier === "Level 0") message.guild.premiumTier = " 0"
    if (message.guild.premiumTier === "Level 1") message.guild.premiumTier = "<:boost:812908034132672552> 1"
    if (message.guild.premiumTier === "Level 2") message.guild.premiumTier = "<:boost3:812908518562201650> 2"
    if (message.guild.premiumTier === "Level 3") message.guild.premiumTier = "<:boost:812908909806223380> 3"
    
    if (message.guild.region === "india") message.guild.region = "🇮🇳 India"
    if (message.guild.region === "brazil") message.guild.region = "🇧🇷 Brasil"
    if (message.guild.region === "japan") message.guild.region = "🇯🇵 Japão"
    if (message.guild.region === "russia") message.guild.region = "🇷🇺 Russia"
    if (message.guild.region === "europe") message.guild.region = "🇪🇺 Europa"
    if (message.guild.region === "sydney") message.guild.region = "🇦🇺 Sydney"
    if (message.guild.region === "singapore") message.guild.region = "🇸🇬 Singapura"
    if (message.guild.region === "hongkong") message.guild.region = "🇭🇰 Hong Kong"
    if (message.guild.region === "southafrica") message.guild.region = "🇿🇦 Africa do sul"
    if (message.guild.region === "us-east") message.guild.region = "🇺🇸 Leste dos Estados Unidos"
    if (message.guild.region === "us-west") message.guild.region = "🇺🇸 Oeste americano"
    if (message.guild.region === "us-central") message.guild.region = "🇺🇸 US Central"
    if (message.guild.region === "us-south") message.guild.region = "🇺🇸 Sul dos Estados Unidos "
    
      let boostlevel = message.guild.premiumTier
    
    let aicon = message.author.avatarURL({ dynamic: true, size: 2048 });

    let sicon = message.guild.iconURL({ dynamic: true, size: 2048 });
    
    let embed = new discord.MessageEmbed()
      .setTitle(message.guild)
      .setDescription(
        `
<:king2:814342839735287851> **PROPRIETÁRIO**
${message.guild.owner.user.tag}
<:id:814337350762233866> **ID DO SERVIDOR**
${message.guild.id}
<:region:814337618199969802> **REGIÃO**
${message.guild.region}
<:people:814336053648949268> **MEMBROS  **
${message.guild.memberCount}
<:channel:814339037325164544> **CANAIS **
 ${message.guild.channels.cache.size}
<:role:814339727258943498> **CARGOS**
${message.guild.roles.cache.size}
<:alias:807391421656334398> **EMOJIS **
${message.guild.emojis.cache.size}
<:date:814336828727361576> **SERVIDOR CRIADO EM**
${message.guild.createdAt.toLocaleDateString("pt-br")}
<:boost3:812908518562201650> **SERVER BOOST**
${message.guild.premiumSubscriptionCount} 
<:boost2:812908146636226591> **NÍVEL DO BOOST**
${boostlevel} 
<:securit:814335706079166484> **NÍVEL DE SEGURANÇA** 
${message.guild.verificationLevel}
`)
      .setThumbnail(message.guild.iconURL())
      .setColor("#00bfff")
      .setFooter(`${message.author.username}`)
			.setTimestamp()

    message.channel.send(embed);
  }
};