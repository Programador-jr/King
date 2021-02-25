const discord = require("discord.js");
/***
* @param {Discord.client} bot the discord bot client.
* @param {Discord.messsage} message the initial message sent by the user.
* @param {array} args an array of arguments
 */
module.exports = {
	name:"amongus",
	aliases:["am", "au"],
	category:"games",
	run:async (bot, message, args) => {
    var neb = args.join(' ');
    const ayy = bot.emojis.cache.get("756082462677008394");
    const ayy1 = bot.emojis.cache.get("756083219337576481");
    const ayy2 = bot.emojis.cache.get("756082294930014229");
    const ayy3 = bot.emojis.cache.get("756082791019446365");
    const ayy4 = bot.emojis.cache.get("756082699969757264");
    const ayy5 = bot.emojis.cache.get("756143535555870841");

    // eslint-disable-next-line no-useless-escape
    if (!neb) return message.channel.send("Insira algo para pesquisar, por exemplo **mapa / informação**");
    if (neb.toLowerCase() == "maps" || neb.toLowerCase() == "map" || neb.toLowerCase() == "mapa") {
        var embs = new discord.MessageEmbed()
            .setColor('#FF0000')
            .setTitle(`${ayy} AMONG US MAPS`)
            .addField(`${ayy1} Polus: `, "[Clique aqui](https://cdn.discordapp.com/attachments/754031126149988453/754033354852270190/POLUS_MAP_GUIDE.png)", true)
            .addField(`${ayy2} Mira HQ: `, "[Clique aqui](https://i.redd.it/8i1kd1mp9ij51.png)", true)
            .addField(`${ayy3} The Skeld: `, "[Clique aqui](https://cdn.discordapp.com/attachments/756025344993263658/758574260724695080/skeldmapguidev2.png)", true)
            .setFooter(`Estes são os mapas completos e detalhados de Between Us! Clique em qualquer um dos links para ver mapas detalhados e HD completos`);
        message.channel.send(embs);
    }
    else if (neb.toLowerCase() == "info" || neb.toLowerCase() == "among us info" || neb.toLowerCase() == "information" || neb == "among us information" || neb.toLowerCase() == "among us informação" || neb.toLowerCase() == "informação") {
        var embs1 = new discord.MessageEmbed()
            .setColor('RANDOM')
            .setTitle(`${ayy3} INFORMAÇÕES AMONG US`)
            .addField(`${ayy4} Guia Completo / Dicas: `, "[Clique aqui](https://www.reddit.com/r/AmongUs/comments/gfulqt/effort_post_complete_guide_to_playing_as_impostor/)", true)
            .addField(`${ayy5} Impostor: `, "[Clique aqui](https://www.bluestacks.com/blog/game-guides/among-us/amongus-smooth-criminal-guide-en.html)", true)
            .addField(`${ayy1} Companheiro de tripulação: `, "[Clique aqui](https://www.bluestacks.com/blog/game-guides/among-us/amongus-crewmate-guide-en.html)", true)
            .setFooter("Estas são as instruções completas e detalhadas para Entre Nós com algumas dicas no guia que você pode não conhecer");
        message.channel.send(embs1);
    }

}
}