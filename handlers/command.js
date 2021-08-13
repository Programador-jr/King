const {readdirSync} = require("fs");
const c = require('colors')
const config = require("../config.json")
const ascii = require("ascii-table");
let table = new ascii("Commands");
const functions = require("../functions")
table.setHeading(c.brightCyan("Comando", "status"));
console.log(c.brightCyan("Bem-vindo ao SERVIÇO DE MANIPULAÇÃO"))
module.exports = (client) => {
    readdirSync("./commands/").forEach(dir => {
        const commands = readdirSync(`./commands/${dir}/`).filter(file => file.endsWith(".js"));
        for (let file of commands) {
            let pull = require(`../commands/${dir}/${file}`);
            if (pull.name) {
                client.commands.set(pull.name, pull);
                table.addRow(file, '✅');
            } else {
                table.addRow(file, `❌ -> cmd.name ausente ou cmd.name não é uma string.`);
                continue;
            }
            if (pull.aliases && Array.isArray(pull.aliases)) pull.aliases.forEach(alias => client.aliases.set(alias, pull.name));
        }
    });

    const guildonlycounter = new Map();


    client.distube
        .on("playSong", async (message, queue, song) => {

            client.infos.set("global", Number(client.infos.get("global", "songs")) + 1, "songs");

            try {
                queue.connection.voice.setDeaf(true);
            } catch (error) {
                console.error(error)
                functions.embedbuilder(client, 5000, message, config.colors.no, "ERROR: ", "```" + error.toString().substr(0, 100) + "```" + "\n\n**Erro enviado ao meu proprietário!**")
                functions.errorbuilder(error.stack.toString().substr(0, 2000))
            }
            try {
                queue.connection.voice.setSelfDeaf(true);
            } catch (error) {
                console.error(error)
                functions.embedbuilder(client, 5000, message, config.colors.no, "ERROR: ", "```" + error.toString().substr(0, 100) + "```" + "\n\n**Erro enviado ao meu proprietário!**")
                functions.errorbuilder(error.stack.toString().substr(0, 2000))
            }
            try {
                functions.playsongyes(client, message, queue, song);
            } catch (error) {
                console.error(error)
                functions.embedbuilder(client, 5000, message, config.colors.no, "ERROR: ", "```" + error.toString().substr(0, 100) + "```" + "\n\n**Erro enviado ao meu proprietário!**")
                functions.errorbuilder(error.stack.toString().substr(0, 2000))
            }
        })
        .on("addSong", (message, queue, song) => {
            try {
                return functions.embedbuilder(client, 7500, message, config.colors.yes, "Adicionou uma música!", `Música: [\`${song.name}\`](${song.url})  -  \`${song.formattedDuration}\` \n\nRequerido por: ${song.user}\n\nTempo estimado: ${queue.songs.length - 1} músicas(s) - \`${(Math.floor((queue.duration - song.duration) / 60 * 100) / 100).toString().replace(".", ":")}\`\nDuração da fila: \`${queue.formattedDuration}\``, song.thumbnail)
            } catch (error) {
                console.error(error)
                functions.embedbuilder(client, 5000, message, config.colors.no, "ERROR: ", "```" + error.toString().substr(0, 100) + "```" + "\n\n**Erro enviado ao meu proprietário!**")
                functions.errorbuilder(error.stack.toString().substr(0, 2000))
            }
        })
        .on("playList", (message, queue, playlist, song) => {
            try {
                queue.connection.voice.setDeaf(true);
            } catch (error) {
                console.error(error)
                functions.embedbuilder(5000, message, config.colors.no, "ERROR: ", "```" + error.toString().substr(0, 100) + "```" + "\n\n**Erro enviado ao meu proprietário!**")
                functions.errorbuilder(error.stack.toString().substr(0, 2000))
            }
            try {
                queue.connection.voice.setSelfDeaf(true);
            } catch (error) {
                console.error(error)
                functions.embedbuilder(client, 5000, message, config.colors.no, "ERROR: ", "```" + error.toString().substr(0, 100) + "```" + "\n\n**Erro enviado ao meu proprietário!**")
                functions.errorbuilder(error.stack.toString().substr(0, 2000))
            }
            functions.embedbuilder(client, 7500, message, config.colors.yes, "Adcionado a playList", `Playlist: [\`${playlist.name}\`](${playlist.url ? playlist.url : ""})  -  \`${playlist.songs.length ? playlist.songs.length : "undefinied"} música\` \n\nRequerido por: ${queue.songs[0].user ? queue.songs[0].user : "error"}`, playlist.thumbnail.url ? playlist.thumbnail.url : "")

            try {
                functions.playsongyes(client, message, queue, queue.songs[0]);
            } catch (error) {
                console.error(error)
                functions.embedbuilder(client, 5000, message, "#ff264a", "ERROR: ", "```" + error.toString().substr(0, 100) + "```" + "\n\n**Erro enviado ao meu proprietário!**")
                functions.errorbuilder(error.stack.toString().substr(0, 2000))
            }
        })
        .on("addList", (message, queue, playlist) => {
            try {
                return functions.embedbuilder(client, 7500, message, config.colors.yes, "Adicionado a Playlist!", `Playlist: [\`${playlist.name}\`](${playlist.url ? playlist.url : ""})  -  \`${playlist.songs.length ? playlist.songs.length : "undefinied"} músicas\` \n\nRequerido por: ${queue.songs[0].user ? queue.songs[0].user : "error"}`, playlist.thumbnail.url ? playlist.thumbnail.url : "")
            } catch (error) {
                console.error(error)
                functions.embedbuilder(client, 5000, message, config.colors.no, "ERROR: ", "```" + error.toString().substr(0, 100) + "```" + "\n\n**Erro enviado ao meu proprietário!**")
                functions.errorbuilder(error.stack.toString().substr(0, 2000))
            }
        })
        .on("searchResult", (message, result) => {
            try {
                let i = 0;
                return functions.embedbuilder(client, "null", message, config.colors.yes, "", `**Escolha uma opção abaixo**\n${result.map(song => `**${++i}**. [${song.name}](${song.url}) - \`${song.formattedDuration}\``).join("\n")}\n*Digite qualquer outra coisa ou aguarde 60 segundos para cancelar*`)
            } catch (error) {
                console.error(error)
                functions.embedbuilder(client, 5000, message, config.colors.no, "ERROR: ", "```" + error.toString().substr(0, 100) + "```" + "\n\n**Erro enviado ao meu proprietário!**")
                functions.errorbuilder(error.stack.toString().substr(0, 2000))
            }
        })
        .on("searchCancel", (message) => {
            try {
                message.reactions.removeAll();
                message.react("❌")
            } catch (error) {
                console.error(error)
                functions.embedbuilder(client, 5000, message, config.colors.no, "ERROR: ", "```" + error.toString().substr(0, 100) + "```" + "\n\n**Erro enviado ao meu proprietário!**")
                functions.errorbuilder(error.stack.toString().substr(0, 2000))
            }
            try {
                return functions.embedbuilder(client, 5000, message, config.colors.yes, `Pesquisa cancelada`, "")
            } catch (error) {
                console.error(error)
                functions.embedbuilder(client, 5000, message, config.colors.no, "ERROR: ", "```" + error.toString().substr(0, 100) + "```" + "\n\n**Erro enviado ao meu proprietário!**")
                functions.errorbuilder(error.stack.toString().substr(0, 2000))
            }
        })
        .on("error", (message, err) => {
            try {
                message.reactions.removeAll();
                message.react("❌")
            } catch (error) {
                console.error(error)
                functions.embedbuilder(client, 5000, message, config.colors.no, "ERROR: ", "```" + error.toString().substr(0, 100) + "```" + "\n\n**Erro enviado ao meu proprietário!**")
                functions.errorbuilder(error.stack.toString().substr(0, 2000))
            }
            console.log(err);
            try {
                return functions.embedbuilder(client, "null", message, config.colors.yes, "Um erro encontrado:", "```" + err + "```")
            } catch (error) {
                console.error(error)
                functions.embedbuilder(client, 5000, message, config.colors.no, "ERROR: ", "```" + error.toString().substr(0, 100) + "```" + "\n\n**Erro enviado ao meu proprietário!**")
                functions.errorbuilder(error.stack.toString().substr(0, 2000))
            }
        })
        .on("finish", message => {
            try {
                return functions.embedbuilder(client, 5000, message, config.colors.yes, "SINDO DO CANAL", "Não há mais músicas restantes")
            } catch (error) {
                console.error(error)
                functions.embedbuilder(client, 5000, message, config.colors.no, "ERROR: ", "```" + error.toString().substr(0, 100) + "```" + "\n\n**Erro enviado ao meu proprietário!**")
                functions.errorbuilder(error.stack.toString().substr(0, 2000))
            }
        })
        .on("empty", message => {

            try {
                return functions.embedbuilder(client, 5000, message, config.colors.yes, "Sai do canal porque ficou vazio!")
            } catch (error) {
                console.error(error)
                functions.embedbuilder(client, 5000, message, config.colors.no, "ERROR: ", "```" + error.toString().substr(0, 100) + "```" + "\n\n**Erro enviado ao meu proprietário!**")
                functions.errorbuilder(error.stack.toString().substr(0, 2000))
            }
        })
        .on("noRelated", message => {
            try {
                return functions.embedbuilder(client, 5000, message, config.colors.yes, "Não é possível encontrar o vídeo relacionado para reproduzir. Pare de tocar música.")
            } catch (error) {
                console.error(error)
                functions.embedbuilder(client, 5000, message, config.colors.no, "ERROR: ", "```" + error.toString().substr(0, 100) + "```" + "\n\n**Erro enviado ao meu proprietário!**")
                functions.errorbuilder(error.stack.toString().substr(0, 2000))
            }
        })
        .on("initQueue", queue => {
            try {
                queue.autoplay = false;
                queue.volume = 50;
                queue.filter = "bassboost6";
            } catch (error) {
                console.error(error)
                functions.errorbuilder(error.stack.toString().substr(0, 2000))
            }
        });
			

    console.log(table.toString());
    console.log(c.brightCyan("Bem-vindo ao SERVIÇO DE MANUTENÇÃO"))
    console.log(c.brightRed("lOGANDO NO BOT DO USUÁRIO..."));
}
