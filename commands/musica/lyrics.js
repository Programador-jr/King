const {
    KSoftClient
} = require('@ksoft/api');
const config = require("../../config.json")
const ksoft = new KSoftClient(config.ksoftapi);
const functions = require("../../functions")
module.exports = {
    name: "lyrics",
    cooldown: 5,
    category: "MUSIC COMMANDS",
    aliases: ["ly", "songtext", "letra"],
    useage: "lyrics",
    description: "Shows you the Lyrics for the CURRENT playing song, ..",
    run: async (client, message, args) => {
        //if not a dj, return error - DISABLED CAUSE NOT NEEDED
        //if (functions.check_if_dj(message))
        //    return functions.embedbuilder(client, 6000, message, config.colors.no, "DJ-ROLE", `❌ You don\'t have permission for this Command! You need to have: ${functions.check_if_dj(message)}`)

        //If Bot not connected, return error
        if (!message.guild.me.voice.channel) return functions.embedbuilder(client, 3000, message, config.colors.no, "Nada tocando")

        //if member not connected return error
        if (!message.member.voice.channel) return functions.embedbuilder(client, 5000, message, config.colors.no, "`" + message.author.tag + "`" + " Você deve entrar em um canal de voz")

        //if they are not in the same channel, return error
        if (message.member.voice.channel.id != message.guild.me.voice.channel.id) return functions.embedbuilder(client, 5000, message, config.colors.no, "`" + message.author.tag + "`" + " Você deve entrar no meu canal de voz: " + ` \`${message.guild.me.voice.channel.name ? message.guild.me.voice.channel.name : ""}\``)

        //get the queue
        let queue = client.distube.getQueue(message);

        //if no queue return error
        if (!queue) return functions.embedbuilder("null", message, config.colors.no, "Não há nada jogando!");

        let cursong = queue.songs[0];
        functions.embedbuilder(client, 3000, message, config.colors.yes, "Procurando!", cursong.name);
        let lyrics;

        await ksoft.lyrics.get(cursong.name).then(
            async track => {
                if (!track.lyrics) return message.reply("NENHUMA LETRA ENCONTRADA!");
                lyrics = track.lyrics;
            

            let currentPage = 0;
            const embeds = functions.lyricsEmbed(client, message, lyrics, cursong);

            const queueEmbed = await message.channel.send(
                `**Pagina atual - ${currentPage + 1}/${embeds.length}**`,
                embeds[currentPage]
            );

            try {
                await queueEmbed.react("⬅️");
                await queueEmbed.react("➡️");
                await queueEmbed.react("⏹");
            } catch (error) {
                console.error(error);
                functions.embedbuilder(client, 5000, message, config.colors.no, "ERROR: ", "```" + error.toString().substr(0, 100) + "```" + "\n\n**Erro enviado ao meu proprietário!**")
                functions.errorbuilder(error.stack.toString().substr(0, 2000))
            }

            const filter = (reaction, user) => ["⬅️", "⏹", "➡️"].includes(reaction.emoji.id || reaction.emoji.name) && message.author.id === user.id;
            const collector = queueEmbed.createReactionCollector(filter, {
                time: 60000
            });

            collector.on("collect", async (reaction, user) => {
                try {
                    if (reaction.emoji.id === "➡️" || reaction.emoji.name === "➡️") {
                        if (currentPage < embeds.length - 1) {
                            currentPage++;
                            queueEmbed.edit(`**Pagina atual - ${currentPage + 1}/${embeds.length}**`, embeds[currentPage]);
                        }
                    } else if (reaction.emoji.id === "➡️" || reaction.emoji.name === "⬅️") {
                        if (currentPage !== 0) {
                            --currentPage;
                            queueEmbed.edit(`**Pagina atual - ${currentPage + 1}/${embeds.length}**`, embeds[currentPage]);
                        }
                    } else {
                        collector.stop();
                        reaction.message.reactions.removeAll();
                    }
                    await reaction.users.remove(message.author.id);
                } catch (error) {
                    functions.embedbuilder(client, 5000, message, config.colors.no, "ERROR: ", "```" + error.toString().substr(0, 100) + "```" + "\n\n**Erro enviado ao meu proprietário!**")
                    functions.errorbuilder(error.stack.toString().substr(0, 2000))
                }
            });

        });
    }
};
/**
 * @INFO
 * Bot Coded by Tomato#6966 | https://github.com/Tomato6966/discord-js-lavalink-Music-Bot-erela-js
 * @INFO
 * Work for Milrato Development | https://milrato.eu
 * @INFO
 * Please mention Him / Milrato Development, when using this Code!
 * @INFO
 */
