const {
    MessageEmbed,
    MessageActionRow,
    MessageButton,
    Permissions
} = require("discord.js");
const config = require("../../botconfig/config.json");
var ee = require("../../botconfig/embed.json");
const settings = require("../../botconfig/settings.json");

module.exports = {
    name: "painelticket",
    category: "Ticket",
    usage: "painelticket",
    aliases: ["painel"],
    cooldown: 10,
    description: "Cria um painel de tickets",
    memberpermissions: ["MANAGE_GUILD"],
    run: async (client, message, args) => {
        try {
            const guildData = client.settings.get(message.guild.id);
            
            const row = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId("create_ticket")
                        .setLabel("🎫 Criar Ticket")
                        .setStyle("PRIMARY")
                );

            const embed = new MessageEmbed()
                .setColor(ee.color)
                .setTitle("🎫 Central de Tickets")
                .setDescription("Precisa de ajuda? Clique no botão abaixo para criar um ticket.")
                .setFooter({ text: ee.footertext, iconURL: ee.footericon });

            const panelMessage = await message.channel.send({
                embeds: [embed],
                components: [row]
            });

            if (!client.ticketHandler) {
                const TicketHandler = require("../../handlers/tickets");
                client.ticketHandler = new TicketHandler(client);
            }

            await client.ticketHandler.createPanel(message.guild.id, {
                channelId: message.channel.id,
                messageId: panelMessage.id,
                categoryId: guildData.ticketCategory || null,
                supportRoles: guildData.ticketRoles || [],
                webhookUrl: guildData.ticketWebhook || null
            });

            client.settings.ensure(message.guild.id, {
                ticketPanelMessageId: panelMessage.id,
                ticketCategory: null,
                ticketRoles: [],
                ticketWebhook: null
            });
            client.settings.set(message.guild.id, message.channel.id, "ticketPanelChannelId");
            client.settings.set(message.guild.id, panelMessage.id, "ticketPanelMessageId");

            message.reply({ content: "✅ Painel de tickets criado com sucesso!", ephemeral: true });

        } catch (e) {
            console.log(String(e.stack).bgRed);
            message.reply({ content: "❌ Ocorreu um erro ao criar o painel.", ephemeral: true });
        }
    }
};
