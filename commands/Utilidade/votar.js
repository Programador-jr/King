const Discord = require("discord.js");
const ee = require("../../botconfig/embed.json");
const emojis = require("../../botconfig/emojis.json");

const TOPGG_BOT_ID = process.env.TOPGG_BOT_ID || "816415065405915146";
const TOPGG_VOTE_URL = `https://top.gg/bot/${TOPGG_BOT_ID}/vote`;

module.exports = {
  name: "votar",
  category: "Utilidade",
  description: "Mostra o link para votar no bot no Top.gg.",
  aliases: ["vote", "topgg"],
  run: async (client, message, args, default_prefix) => {
    const embed = new Discord.MessageEmbed()
      .setColor(ee.color)
      .setAuthor(`${message.author.tag}`, message.author.displayAvatarURL({ dynamic: true, size: 2048 }))
      .setTitle(`Vote no King Bot!`)
      .setDescription(`Ajude o bot a crescer votando no Top.gg!\n\nCada voto te dá **500** ${emojis.King_Coin} de recompensa!`)
      .addField("Link para votar", `[Clique aqui para votar](${TOPGG_VOTE_URL})`, false)
      .setFooter(ee.footertext, ee.footericon);

    message.reply({ embeds: [embed] });
  }
};
