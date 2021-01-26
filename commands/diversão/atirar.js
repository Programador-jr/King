const Discord = require("discord.js");

	module.exports = {
    name: "atirar",
		usage: "atirar <@user>",
		aliases: ["shoot", "matar", "kill", "bang"],
		description: "mostra um gif de tiro",
    category: "diversão",
    run: async (client, message, args) => {

			var list = [

					'https://i.imgur.com/qsgsxIM.gif',
					'https://i.imgur.com/1gN99rj.gif',
					'https://i.imgur.com/nKHZmiY.gif',
					'https://i.imgur.com/xGg931n.gif',
					'https://steamuserimages-a.akamaihd.net/ugc/861736836879917900/52F0CF4E0026EAAC456D316E82BB6EA33E255C3F/',
					'https://pa1.narvii.com/6190/dbeb9bd2e8c18b6410d49f63c457712f01ea0e20_hq.gif',
					'https://31.media.tumblr.com/f606b51075e8988dc93a12d6da4b6dd3/tumblr_nre44r9adS1qdvrdyo1_540.gif',
					'https://4.bp.blogspot.com/-AKya8G5ZuL0/XBbu51XdqdI/AAAAAAABZkc/7INRLssoxKIf7c_QGXNK45r4XzZ2-AUvACKgBGAs/s1600/Omake%2BGif%2BAnime%2B-%2BUlysses%2B-%2BJeanne%2Bd%2527Arc%2Bto%2BRenkin%2Bno%2BKishi%2B-%2BEpisode%2B10%2B-%2BLa%2BHire%2BShoots.gif',
					'https://steamuserimages-a.akamaihd.net/ugc/936055324466626637/CA796A76A32E658BD292E1127BAEF45E1C6E1BA1/',
					'https://cdn.lowgif.com/small/d8e477a108586443-said-it-before-girls-with-big-guns-are-hot-anime-manga-know.gif',
					'https://thumbs.gfycat.com/ObeseWideeyedArabianoryx-small.gif',
					'https://media1.tenor.com/images/83b11c0092eb8fc2d442686f31eaaa0e/tenor.gif?itemid=17106717',
					'https://cdn.lowgif.com/medium/7722a9a9703a9248-.gif'
];

var rand = list[Math.floor(Math.random() * list.length)];
let user = message.mentions.users.first() || client.users.cache.get(args[0]);
if (!user) {
return message.reply('lembre-se de mencionar um usuário válido para executar essa ação!');
}

  const embed = new Discord.MessageEmbed()
        .setTitle('')
        .setColor('#8B0000')
        .setDescription(`${message.author} atirou em ${user}`)
        .setImage(rand)
        .setTimestamp()
        .setFooter('king')
  await message.channel.send(embed);
        
    }
};