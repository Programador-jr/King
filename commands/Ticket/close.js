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
    name: "close",
    category: "Ticket",
    usage: "close [número do ticket]",
    aliases: ["fechar"],
    cooldown: 5,
    description: "Fecha um ticket",
    memberpermissions: ["MANAGE_CHANNELS"],
    run: async (client, message, args) => {
        try {
            if (!client.ticketHandler) {
                const TicketHandler = require("../../handlers/tickets");
                client.ticketHandler = new TicketHandler(client);
            }

            const channel = message.channel;
            const channelName = channel.name;

            if (!channelName.startsWith("ticket-") && !channelName.startsWith("closed-")) {
                return message.reply({ content: "❌ Este canal não é um ticket.", ephemeral: true });
            }

            const ticketNumber = parseInt(channelName.replace(/[^0-9]/g, ""));
            if (!ticketNumber) {
                return message.reply({ content: "❌ Não foi possível identificar o ticket.", ephemeral: true });
            }

            const ticketData = client.ticketHandler.getTicket(message.guild.id, ticketNumber);
            if (!ticketData) {
                return message.reply({ content: "❌ Ticket não encontrado.", ephemeral: true });
            }

            const closedTicket = await client.ticketHandler.closeTicket(
                message.guild.id,
                ticketNumber,
                message.author.id,
                message.author.tag
            );

            await client.ticketHandler.sendCloseLog(
                message.guild.id,
                closedTicket,
                message.guild,
                message.author
            );

            const customCloseEmbed = client.settings.get(message.guild.id, "ticketCloseEmbed");
            let embed;

            if (customCloseEmbed) {
                embed = new MessageEmbed();
                if (customCloseEmbed.color) embed.setColor(customCloseEmbed.color);
                if (customCloseEmbed.title) embed.setTitle(customCloseEmbed.title);
                if (customCloseEmbed.description) embed.setDescription(
                    customCloseEmbed.description
                        .replace(/{user}/g, message.author.toString())
                        .replace(/{username}/g, message.author.username)
                        .replace(/{ticket}/g, `#${ticketNumber}`)
                        .replace(/{usertag}/g, message.author.tag)
                        .replace(/{closer}/g, message.author.tag)
                );
                if (customCloseEmbed.url) embed.setURL(customCloseEmbed.url);
                if (customCloseEmbed.footer?.text) embed.setFooter({ text: customCloseEmbed.footer.text, iconURL: customCloseEmbed.footer.icon_url || null });
                if (customCloseEmbed.image) embed.setImage(customCloseEmbed.image);
                if (customCloseEmbed.thumbnail) embed.setThumbnail(customCloseEmbed.thumbnail);
                if (customCloseEmbed.author?.name) embed.setAuthor({ name: customCloseEmbed.author.name, url: customCloseEmbed.author.url || null, iconURL: customCloseEmbed.author.icon_url || null });
                if (customCloseEmbed.fields?.length) customCloseEmbed.fields.forEach(f => { if (f.name) embed.addField(f.name, f.value || '\u200b', f.inline || false); });
                embed.addField("🎫 Ticket", `#${ticketNumber}`, true);
                embed.addField("👤 Fechado por", message.author.toString(), true);
                embed.setTimestamp();
            } else {
                embed = new MessageEmbed()
                    .setColor(ee.color)
                    .setTitle("🎫 Ticket Fechado")
                    .setDescription(`Este ticket foi fechado por ${message.author.tag}.`)
                    .addField("Ticket", `#${ticketNumber}`, true)
                    .addField("Fechado por", message.author.tag, true)
                    .setTimestamp()
                    .setFooter({ text: ee.footertext, iconURL: ee.footericon });
            }

            await channel.send({ embeds: [embed] });

            const row = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId("reopen_ticket")
                        .setLabel("🔓 Reabrir Ticket")
                        .setStyle("SECONDARY"),
                    new MessageButton()
                        .setCustomId("delete_ticket")
                        .setLabel("🗑️ Deletar Ticket")
                        .setStyle("DANGER")
                );

            await channel.send({
                content: "O ticket foi fechado. Use os botões abaixo para:",
                components: [row]
            });

        } catch (e) {
            console.log(String(e.stack).bgRed);
            message.reply({ content: "❌ Ocorreu um erro ao fechar o ticket.", ephemeral: true });
        }
    }
};
