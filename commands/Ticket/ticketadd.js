const {
    MessageEmbed,
    Permissions
} = require("discord.js");
const config = require("../../botconfig/config.json");
var ee = require("../../botconfig/embed.json");

module.exports = {
    name: "ticketadd",
    category: "Ticket",
    usage: "ticketadd [usuário]",
    aliases: ["add"],
    cooldown: 5,
    description: "Adiciona um usuário ao ticket",
    memberpermissions: ["MANAGE_CHANNELS"],
    run: async (client, message, args) => {
        try {
            const channel = message.channel;
            const channelName = channel.name;

            if (!channelName.startsWith("ticket-") && !channelName.startsWith("closed-")) {
                return message.reply({ content: "❌ Este canal não é um ticket.", ephemeral: true });
            }

            const user = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
            
            if (!user) {
                return message.reply({ content: "❌ Mencione um usuário válido.", ephemeral: true });
            }

            await channel.permissionOverwrites.create(user, {
                VIEW_CHANNEL: true,
                SEND_MESSAGES: true,
                READ_MESSAGE_HISTORY: true
            });

            const embed = new MessageEmbed()
                .setColor(ee.color)
                .setTitle("✅ Usuário adicionado")
                .setDescription(`${user.user.tag} foi adicionado ao ticket.`)
                .setFooter({ text: ee.footertext, iconURL: ee.footericon });

            message.reply({ embeds: [embed] });

        } catch (e) {
            console.log(String(e.stack).bgRed);
            message.reply({ content: "❌ Ocorreu um erro.", ephemeral: true });
        }
    }
};
