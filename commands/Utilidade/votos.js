const Discord = require("discord.js");
const ee = require("../../botconfig/embed.json");
const emojis = require("../../botconfig/emojis.json");
const { getUserVoteCount, getLastVote } = require("../../handlers/voteReward");

module.exports = {
  name: "votos",
  category: "Utilidade",
  description: "Mostra seu histórico de votos no Top.gg.",
  aliases: ["votes", "votohistorico"],
  run: async (client, message, args, default_prefix) => {
    const userId = message.author.id;

    const voteCount = await getUserVoteCount(userId);
    const lastVote = await getLastVote(userId);

    let lastVoteText = "Você ainda não votou!";
    if (lastVote) {
      const voteDate = new Date(lastVote.votedAt);
      const formattedDate = voteDate.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
      lastVoteText = formattedDate;
    }

    const embed = new Discord.MessageEmbed()
      .setColor(ee.color)
      .setAuthor(`${message.author.tag}`, message.author.displayAvatarURL({ dynamic: true, size: 2048 }))
      .setTitle(`Histórico de Votos`)
      .addField("Total de votos", `**${voteCount}** voto(s)`, true)
      .addField("Último voto", lastVoteText, true)
      .setFooter(ee.footertext, ee.footericon);

    message.reply({ embeds: [embed] });
  }
};
