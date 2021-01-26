const { MessageEmbed } = require("discord.js");
const fetch = require("node-fetch");

module.exports = {
  name: "changemymind",
	usage: "cmm <texto>",
  aliases: ["cmm", "ideia",],
  description: "Coloque sua frase dentro de uma imagem Change my mind",
  category: "imagem",
  run: async(bot, message, args) => {
    const text = args.join(" ");

    if (!text) return message.channel.send("Por favor, forneça um texto");

    const sendMsg = await message.channel.send("⚙ Processando imagem..");

    const data = await fetch(
      `https://nekobot.xyz/api/imagegen?type=changemymind&text=${text}`
    ).then((res) => res.json());

    sendMsg.delete();
    const embed = new MessageEmbed()
      .setFooter(message.author.username)
      .setColor("BLUE")
      .setDescription(
        `[Clique aqui se a imagem não carregar.](${data.message})`
      )
      .setImage(data.message)
      .setTimestamp();

    message.channel.send({ embed });
  },
};