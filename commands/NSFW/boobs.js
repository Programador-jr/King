const client = require('nekos.life');
const Discord = require('discord.js');
const errors = require('../../assets/json/errors');
const neko = new client();

module.exports = {
  name: "boobs",
  category: "NSFW",
  run: async (client, message, args) => {
		message.delete({timeout: 5000})
        var errMessage = errors[Math.round(Math.random() * (errors.length - 1))];
        if (!message.channel.nsfw) {
            message.react('💢');
            return message.channel.send(new Discord.MessageEmbed()
						.setColor('#ff0000')
						.setTitle(errMessage)).then(msg => {
      msg.delete({ timeout: 5000 })
      })
        }

        async function work() {
        let owo = (await neko.nsfw.boobs());

        const hentaigif = new Discord.MessageEmbed()
        .setTitle("A imagem não está carregando? Clique aqui")
				.setDescription('Aqui está sua imagem...👀')
        .setImage(owo.url)
        .setColor(`#FF1493`)
        .setURL(owo.url);
        message.channel.send(hentaigif);

}

      work();
}
                };