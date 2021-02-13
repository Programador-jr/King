const client = require('nekos.life');
const Discord = require('discord.js')
const neko = new client();

module.exports = {
  name: "hentaigif",
  category: "NSFW",
  run: async (client, message, args) => {

  var errMessage =(new Discord.MessageEmbed()
	.setColor('#FF0000')
	.setTitle("🔐 Você deve usar este comando em uma sala nsfw!")
	);
  if (!message.channel.nsfw) {
      message.react('💢');

      return message.reply(errMessage)
      .then(msg => {
      msg.delete({ timeout: 4000 })
      })
      
  }

        async function work() {
        let owo = (await neko.nsfw.randomHentaiGif());

        const hentaigif = new Discord.MessageEmbed()
        .setTitle("Hentai Gif")
        .setImage(owo.url)
        .setColor(`#FF1493`)
        .setURL(owo.url);
        message.channel.send(hentaigif);

}

      work();
}
                };