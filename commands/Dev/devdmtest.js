const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { isDeveloper } = require("../../handlers/devUtils");
const ee = require("../../botconfig/embed.json");
const joinMessages = require("../../botconfig/JoinMessages.json");
const leaveMessages = require("../../botconfig/LeaveMessages.json");

module.exports = {
  name: "devdmtest",
  aliases: ["ddm", "devguildmsg", "dgm"],
  category: "Dev",
  description: "Envia as mensagens de teste de entrada/saída de servidor para sua DM.",
  usage: "devdmtest <join|leave> [@usuario|id]",
  cooldown: 1,
  run: async (client, message, args) => {
    if (!isDeveloper(message.author.id)) {
      return message.reply(`${client.allEmojis.x} Comando restrito aos desenvolvedores.`);
    }

    const type = args[0] ? args[0].toLowerCase() : null;
    if (!type || !["join", "leave"].includes(type)) {
      return message.reply(`${client.allEmojis.x} Use \`devdmtest <join|leave> [@usuario|id]\`.`);
    }

    const targetUser = message.mentions.users.first() || args[1]
      ? await client.users.fetch(args[1]).catch(() => null)
      : message.author;

    if (!targetUser) {
      return message.reply(`${client.allEmojis.x} Usuário não encontrado.`);
    }

    const isJoin = type === "join";
    const messages = isJoin
      ? Object.values(joinMessages.joinMessages)
      : Object.values(leaveMessages.leaveMessages);
    const randomMsg = messages[Math.floor(Math.random() * messages.length)];
    const images = isJoin ? joinMessages.images : leaveMessages.images;
    const randomImage = images.length > 0 ? images[Math.floor(Math.random() * images.length)] : null;

    const embed = new EmbedBuilder()
      .setColor(isJoin ? ee.color : ee.wrongcolor)
      .setTitle(randomMsg.title)
      .setDescription(randomMsg.description)
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: randomMsg.footer.text, iconURL: ee.footericon })
      .setTimestamp();

    if (randomImage) embed.setImage(randomImage);

    const components = [];

    if (isJoin) {
      const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel("🆘 Suporte").setStyle(ButtonStyle.Link).setURL("https://example.com"),
        new ButtonBuilder().setLabel("📋 Comandos").setStyle(ButtonStyle.Link).setURL("https://example.com")
      );
      components.push(buttons);
    }

    const sent = await targetUser.send({ embeds: [embed], components }).catch(() => null);
    if (!sent) {
      return message.reply(`${client.allEmojis.x} Não foi possível enviar DM para **${targetUser.tag}**. As DMs podem estar fechadas.`);
    }

    const label = isJoin ? "entrada (join)" : "saída (leave)";
    return message.reply(`${client.allEmojis.check_mark} Mensagem de **${label}** enviada para **${targetUser.tag}**.`);
  }
};
