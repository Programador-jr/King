const jimp = require("jimp")

module.exports = {
	name:"monkey",
	aliases:["macaco"],
	run:async (client, message, args, prefix) => {
        let img = jimp.read("https://media.discordapp.net/attachments/804379222025961505/816492068578263040/download_2.png?width=487&height=406")
        if (!args[0]) return message.channel.send("Você precisa escrever algo.")
        if(args[0].length > 50) {
            return message.reply('você ultrapassou o limite de 50 caracteres.')
            }
        message.channel.send(`📝 | editando...`).then(msg => {
        img.then(image => {
            jimp.loadFont(jimp.FONT_SANS_32_BLACK).then(font => {
                image.resize(685, 500)
                image.print(font, 20, 30, args.join(" "), 700)
                image.getBuffer(jimp.MIME_PNG, (err, i) => {
                    message.channel.send({files: [{ attachment: i, name: "monkey.png"}]}).then(m => {
                            msg.delete()
                        })
                    })
                })
            })
        })
    }
		}