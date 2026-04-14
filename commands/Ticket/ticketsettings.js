const {
    MessageEmbed,
    MessageActionRow,
    MessageSelectMenu,
    MessageButton,
    Permissions
} = require("discord.js");
const config = require("../../botconfig/config.json");
var ee = require("../../botconfig/embed.json");
const settings = require("../../botconfig/settings.json");

module.exports = {
    name: "ticketsettings",
    category: "Ticket",
    usage: "ticketsettings",
    aliases: ["tset"],
    cooldown: 5,
    description: "Configura o sistema de tickets",
    memberpermissions: ["MANAGE_GUILD"],
    run: async (client, message, args) => {
        try {
            const guildData = client.settings.get(message.guild.id);

            if (!args[0]) {
                const embed = new MessageEmbed()
                    .setColor(ee.color)
                    .setTitle("🎫 Configurações de Tickets")
                    .setDescription("Use o comando com uma opção:")
                    .addField("📁 Categoria", "`ticketsettings category` - Define a categoria dos tickets")
                    .addField("👮 Cargo Suporte", "`ticketsettings role` - Define cargos de suporte")
                    .addField("🔗 Webhook", "`ticketsettings webhook [url]` - Define URL do webhook")
                    .addField("📋 Painel", "`ticketsettings panel` - Recria o painel de tickets")
                    .setFooter({ text: ee.footertext, iconURL: ee.footericon });

                return message.reply({ embeds: [embed] });
            }

            const option = args[0].toLowerCase();

            if (option === "category" || option === "categoria") {
                const category = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
                
                if (!category || category.type !== "GUILD_CATEGORY") {
                    return message.reply({ content: "❌ Mencione uma categoria válida.", flags: 64 });
                }

                client.settings.set(message.guild.id, category.id, "ticketCategory");
                
                const embed = new MessageEmbed()
                    .setColor(ee.color)
                    .setTitle("✅ Categoria definida!")
                    .setDescription(`Tickets serão criados em: ${category.name}`)
                    .setFooter({ text: ee.footertext, iconURL: ee.footericon });

                return message.reply({ embeds: [embed] });
            }

            if (option === "role" || option === "cargo") {
                const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
                
                if (!role) {
                    return message.reply({ content: "❌ Mencione um cargo válido.", flags: 64 });
                }

                const currentRoles = client.settings.get(message.guild.id, "ticketRoles") || [];
                
                if (currentRoles.includes(role.id)) {
                    const newRoles = currentRoles.filter(r => r !== role.id);
                    client.settings.set(message.guild.id, newRoles, "ticketRoles");
                    
                    return message.reply({ content: `❌ Cargo ${role.name} removido da lista de suporte.`, flags: 64 });
                }

                currentRoles.push(role.id);
                client.settings.set(message.guild.id, currentRoles, "ticketRoles");

                const embed = new MessageEmbed()
                    .setColor(ee.color)
                    .setTitle("✅ Cargo adicionado!")
                    .setDescription(`${role.name} agora pode visualizar tickets.`)
                    .setFooter({ text: ee.footertext, iconURL: ee.footericon });

                return message.reply({ embeds: [embed] });
            }

            if (option === "webhook") {
                const webhookUrl = args.slice(1).join(" ");

                if (!webhookUrl) {
                    const embed = new MessageEmbed()
                        .setColor(ee.color)
                        .setTitle("🔗 Webhook de Tickets")
                        .setDescription("Forneça a URL do webhook para receber notificações.")
                        .addField("Como usar", "`ticketsettings webhook [url]`")
                        .addField("Exemplo", "`ticketsettings webhook https://discord.com/api/webhooks/...`")
                        .setFooter({ text: ee.footertext, iconURL: ee.footericon });

                    return message.reply({ embeds: [embed] });
                }

                if (!webhookUrl.startsWith("https://discord.com/api/webhooks/")) {
                    return message.reply({ content: "❌ URL de webhook inválida.", flags: 64 });
                }

                client.settings.set(message.guild.id, webhookUrl, "ticketWebhook");

                const embed = new MessageEmbed()
                    .setColor(ee.color)
                    .setTitle("✅ Webhook configurado!")
                    .setDescription("Você receberá notificações sobre tickets neste webhook.")
                    .setFooter({ text: ee.footertext, iconURL: ee.footericon });

                return message.reply({ embeds: [embed] });
            }

            if (option === "panel" || option === "painel") {
                const panelChannelId = client.settings.get(message.guild.id, "ticketPanelChannelId");
                
                if (panelChannelId) {
                    const oldChannel = message.guild.channels.cache.get(panelChannelId);
                    if (oldChannel) {
                        try {
                            const oldMessage = await oldChannel.messages.fetch(
                                client.settings.get(message.guild.id, "ticketPanelMessageId")
                            );
                            if (oldMessage) await oldMessage.delete();
                        } catch (e) {}
                    }
                }

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

                client.settings.set(message.guild.id, message.channel.id, "ticketPanelChannelId");
                client.settings.set(message.guild.id, panelMessage.id, "ticketPanelMessageId");

                return message.reply({ content: "✅ Painel de tickets recriado!", flags: 64 });
            }

            if (option === "status") {
                const category = client.settings.get(message.guild.id, "ticketCategory");
                const roles = client.settings.get(message.guild.id, "ticketRoles") || [];
                const webhook = client.settings.get(message.guild.id, "ticketWebhook");
                const panelChannel = client.settings.get(message.guild.id, "ticketPanelChannelId");

                const embed = new MessageEmbed()
                    .setColor(ee.color)
                    .setTitle("🎫 Configurações Atuais de Tickets")
                    .addField("📁 Categoria", category ? `<#${category}>` : "Não definida", true)
                    .addField("🔗 Webhook", webhook ? "✅ Configurado" : "❌ Não configurado", true)
                    .addField("📋 Painel", panelChannel ? `<#${panelChannel}>` : "Não criado", true)
                    .addField("👮 Cargos de Suporte", roles.length > 0 ? roles.map(r => `<@&${r}>`).join(", ") : "Nenhum cargo definido")
                    .setFooter({ text: ee.footertext, iconURL: ee.footericon });

                return message.reply({ embeds: [embed] });
            }

            return message.reply({ content: "❌ Opção inválida. Use `ticketsettings` para ver as opções.", flags: 64 });

        } catch (e) {
            console.log(String(e.stack).bgRed);
            message.reply({ content: "❌ Ocorreu um erro.", flags: 64 });
        }
    }
};
