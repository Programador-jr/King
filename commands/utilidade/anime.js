const Discord = require("discord.js");
const { MessageEmbed } = require("discord.js");
const Color = `#00FF7F`; 
const Scraper = require("mal-scraper");

module.exports = {
    name: "anime",
    category: "utilidade",
    description: "Informações sobre Anime!",
    usage: "anime <nome>",
    run: async (client, message, args) => {

        //Start

        let Text = args.join(" ");

        if (!Text) return message.channel.send(`Por favor, diga o nome do anime!`);

        if (Text.length > 200) return message.channel.send(`Limite de Texto - 200`);

        let Replaced = Text.replace(/ +/g, " ");

        let Anime;

        let Embed;

        try {

        Anime = await Scraper.getInfoFromName(Replaced);

        if (!Anime.genres[0] || Anime.genres[0] === null) Anime.genres[0] = "None";

        Embed = new MessageEmbed()
        .setColor(Color || "#00FF7F")
        .setURL(Anime.url)
        .setTitle(Anime.title)
        .setDescription(Anime.synopsis)
        .addField(`Tipo`, Anime.type, true)
        .addField(`Status`, Anime.status, true)
        .addField(`Estreou`, Anime.premiered, true)
        .addField(`Episódios`, Anime.episodes, true)
        .addField(`Duração`, Anime.duration, true)
        .addField(`Popularidade`, Anime.popularity, true)
        .addField(`Generos`, Anime.genres.join(", "))
        .setThumbnail(Anime.picture)
        .setFooter(`Pontuação - ${Anime.score}`)
        .setTimestamp();

        } catch (error) {
          return message.channel.send(`Nenhum anime encontrado!`);
        };

        return message.channel.send(Embed);

        //End

    }
};