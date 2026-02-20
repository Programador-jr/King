const { 
  MessageEmbed, 
  MessageActionRow, 
  MessageButton,
  MessageSelectMenu
} = require("discord.js");

const ee = require("../../botconfig/embed.json");

module.exports = {
  name: "botchat",
  category: "Configurações",
  aliases: ["confcanal"],
  usage: "botchat",
  cooldown: 3,
  description: "Configura o canal de confissões.",
  memberpermissions: ["MANAGE_GUILD"],

  run: async (client, message) => {

    client.settings.ensure(message.guild.id, {
      confessionChannel: null
    });

    const currentChannel = client.settings.get(message.guild.id, "confessionChannel");

    const row = new MessageActionRow().addComponents(
      new MessageButton()
        .setCustomId("setup_confession_channel")
        .setLabel("Selecionar Canal")
        .setStyle("PRIMARY")
    );

    const embed = new MessageEmbed()
      .setColor(ee.color)
      .setTitle("⚙️ Configuração de Confissões")
      .setDescription(
        currentChannel
          ? `Canal atual: <#${currentChannel}>\n\nClique abaixo para alterar.`
          : "Nenhum canal configurado.\n\nClique abaixo para selecionar um canal."
      )
      .setFooter(ee.footertext, ee.footericon);

    return message.reply({
      embeds: [embed],
      components: [row]
    });
  }
};