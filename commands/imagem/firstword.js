const Discord = require('discord.js')
var Jimp = require("jimp")

module.exports = {
	name:"firstword",
	aliases:["first", "word", "primeirapalavra"],
	run:async (bot, message, args) => {

    if (message.content.split(' ').slice(1).join(' ').length < 1) {
        message.channel.send(`📝 | Você não escreveu nada.`)
    } else {
        if (message.content.split(' ').slice(1).join(' ').length > 50) {
            message.channel.send('📝 Você ultrapassou o limite de 50 caracteres.')
        } else {
            if (message.member.hasPermission('ATTACH_FILES')) {
                var authorMessage = message
                message.channel.send(`📝 | editando...`).then(msg => {
                    Jimp.read(`https://cdn.discordapp.com/attachments/538711394137407488/567123894956457984/tirinha_baby.png`, function (err, image) {
                        if (err) message.reply('ocorreu um erro ao criar a imagem.')
                        Jimp.loadFont(Jimp.FONT_SANS_32_BLACK).then(function (font) {
                            image.print(font, 11, 13, authorMessage.content.split(' ').slice(1).join(' ')[0] + '... ' + authorMessage.content.split(' ').slice(1).join(' ')[0] + '...', 400)
                            image.print(font, 19, 290, authorMessage.content.split(' ').slice(1).join(' '), 320)
                            image.getBuffer(Jimp.MIME_PNG, (err, buffer) => {
                                const attachment = new Discord.MessageAttachment(buffer, 'primeiraspalavras.png')
                                message.channel.send(attachment).then(message => {
                                    msg.delete()
                                    })
                                })
                            })
                        })
                    })
            } else {
                message.channel.send('Eu não tenho a permissão necessária para fazer isso. `ATTACH_FILES`')
            }
        }
    }
}
}