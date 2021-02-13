const Discord = require("discord.js");

	module.exports = {
    name: "meme",
		usage: "meme",
		description: "Gera imagens com memes aleátorios",
    category: "diversão",
    run: async (client, message, args) => {

			var list = [
		"https://encrypted-tbn0.gstatic.com/images?q=tbn%3AANd9GcTo7bKomp-1j5cRHPcoXejzhnS_GDsZVu1jkg&usqp=CAU",
    "https://encrypted-tbn0.gstatic.com/images?q=tbn%3AANd9GcR1LJMKjaa5RYPlJheNuZGnO5Hx4C1ZQlOoQg&usqp=CAU",
    "https://encrypted-tbn0.gstatic.com/images?q=tbn%3AANd9GcSikJtprG1gNxHz422-NxF5V6afNKJHkILRXg&usqp=CAU",
		"https://media.discordapp.net/attachments/784840761069142016/804378878453874688/52ce6767e7f6051eeba42db04e35bf0f.jpg?width=406&height=406",
		"https://media.discordapp.net/attachments/784840761069142016/804378878192779264/c6187228501015f23eee85341aca0df2.jpg?width=408&height=406",
		"https://media.discordapp.net/attachments/784840761069142016/804378877748969502/IMG-20201222-WA0005-2-1.jpg?width=487&height=406",
		"https://media.discordapp.net/attachments/784840761069142016/804378488411783178/2327474e7267cddd67e2f1197f1296e6.jpg?width=416&height=406",
		"https://media.discordapp.net/attachments/784840761069142016/804378308900421702/56ebfe779cd5956d2a37618d63c08198.jpg?width=187&height=405",
	 "https://images7.memedroid.com/images/UPLOADED230/6012d1a881730.jpeg",
	 "https://images7.memedroid.com/images/UPLOADED940/6012b4a7c8506.jpeg",
	 "https://images3.memedroid.com/images/UPLOADED948/6012acb1bfdad.jpeg",
	 "https://images3.memedroid.com/images/UPLOADED1/60124c30eae5b.jpeg",
	 "https://images3.memedroid.com/images/UPLOADED409/60135505e49c3.jpeg",
	 "https://images7.memedroid.com/images/UPLOADED562/60131d2721aa5.jpeg",
	 "https://i.pinimg.com/564x/7f/f4/d4/7ff4d419b70274582940ee4816416f9b.jpg",
	 "https://i.pinimg.com/236x/f8/b8/75/f8b8751ca5c8a684c14a8fb74a40ce0c.jpg",
	 "https://i.pinimg.com/236x/9c/aa/40/9caa4010c40bd090130b8c97e6fe6b8e.jpg",
	 "https://i.pinimg.com/236x/a9/05/a1/a905a15356c1d6767ea5cb89f549db91.jpg",
	 "https://i.pinimg.com/236x/22/6d/c9/226dc9779ffa1df9d80933835576cc8a.jpg",
	 "https://i.pinimg.com/236x/d0/95/9f/d0959f91f7f7622c5beaf1f385a354e8.jpg",
	 "https://i.pinimg.com/236x/84/11/61/841161636c71f618810f131042414865.jpg",
	 "https://i.pinimg.com/236x/6e/01/ca/6e01ca4856ec609ac918166a32deee8c.jpg",
	 "https://i.pinimg.com/236x/44/41/80/44418069b811a670c87dd8e3381d0a62.jpg",
	 "https://i.pinimg.com/236x/51/59/e4/5159e4a60bff3acb758346cd21ccac1b.jpg",
	 "https://i.pinimg.com/236x/b2/3a/06/b23a0644a28b859856fa426a453c7695.jpg",
	 "https://i.pinimg.com/236x/0d/45/85/0d4585bfd3cc8a788c6be5ac3e7dafc7.jpg",
	 "https://i.pinimg.com/236x/40/ca/f9/40caf95deae83a3cf9f010a422fd838a.jpg",
	 "https://i.pinimg.com/236x/60/47/3b/60473b41615f03874d018f36a70c9b00.jpg",
	 "https://i.pinimg.com/236x/dc/27/5e/dc275ef8f49bfa40bc70e7ce4c97dacd.jpg",
	 "https://i.pinimg.com/236x/16/08/22/16082203f81f181b5e9894743fb6b3f1.jpg",
	 "https://i.pinimg.com/236x/e7/af/0b/e7af0be5009f2513a31e0e1ff8c9977d.jpg",
	 "https://i.pinimg.com/236x/bc/e3/49/bce349f74491fe2b45feb538adaf85b4.jpg",
	 "https://i.pinimg.com/236x/81/0c/cd/810ccd0f2d1709e041d52be113a05fc8.jpg",
	 "https://i.pinimg.com/236x/49/18/80/491880d4c255f69c34795e053780413a.jpg",
	 "https://i.pinimg.com/236x/e9/8a/15/e98a157e9e71b1dcd225aeaa1ea8bbb3.jpg",
	 "https://i.pinimg.com/236x/ad/85/be/ad85be487bd89ccfa8ad6c97eacf1d21.jpg",
	 "https://cdn.maioresemelhores.com/imagens/mm-meme-8-quarentena-busao.jpg",
	 "https://images3.memedroid.com/images/UPLOADED999/60204289e0383.jpeg",
	 "https://images7.memedroid.com/images/UPLOADED327/60202dcfe5ee5.jpeg",
	 "https://images7.memedroid.com/images/UPLOADED210/602002e974217.jpeg",
	 "https://images7.memedroid.com/images/UPLOADED501/6020021bf1179.jpeg",
	 "https://images7.memedroid.com/images/UPLOADED673/6020034f2da0c.jpeg",
	 "https://images3.memedroid.com/images/UPLOADED19/60200256930ab.jpeg",
	 "https://images3.memedroid.com/images/UPLOADED698/601ff2a29e58e.jpeg",
	 "https://images3.memedroid.com/images/UPLOADED975/601ff62362299.jpeg",
	 "https://images3.memedroid.com/images/UPLOADED351/601ff4d170dab.jpeg",
	 "https://images7.memedroid.com/images/UPLOADED346/601ff0ca4231f.jpeg",
	 "https://images3.memedroid.com/images/UPLOADED171/601fb5cf71676.jpeg",
	 "https://images3.memedroid.com/images/UPLOADED868/601f3ce303a63.jpeg",
	 "https://images3.memedroid.com/images/UPLOADED253/601f898dea5c1.jpeg",
	 "https://images7.memedroid.com/images/UPLOADED337/601f87b97a821.jpeg",
	 "https://images7.memedroid.com/images/UPLOADED678/601f801f2f587.jpeg",
	 "https://images3.memedroid.com/images/UPLOADED306/601f7accdf5aa.jpeg",
	 "https://images3.memedroid.com/images/UPLOADED734/601f72626dea1.jpeg",
	 "https://images7.memedroid.com/images/UPLOADED396/601f6793079f4.jpeg",
	 "https://images3.memedroid.com/images/UPLOADED427/601f55c19a05b.jpeg",
	 "https://images7.memedroid.com/images/UPLOADED596/601f220d14f00.jpeg",
	 "https://images3.memedroid.com/images/UPLOADED403/601f2023eab51.jpeg",
	 "https://images7.memedroid.com/images/UPLOADED573/601ef895691cb.jpeg",
	 "https://images7.memedroid.com/images/UPLOADED736/601f101d0279c.jpeg",
	 "https://images3.memedroid.com/images/UPLOADED332/601f1082b18ab.jpeg",
	 "https://images7.memedroid.com/images/UPLOADED361/601f0f23e7046.jpeg",
	 "https://images7.memedroid.com/images/UPLOADED698/601f0c88becf2.jpeg",
	 "https://images3.memedroid.com/images/UPLOADED999/601f0a385fa62.jpeg",
	 "https://images7.memedroid.com/images/UPLOADED541/601eff87122a0.jpeg",
	 "https://images7.memedroid.com/images/UPLOADED990/601ed78b0df7f.jpeg",
	 "https://images7.memedroid.com/images/UPLOADED268/601e9e40da38b.jpeg",
	 "https://images3.memedroid.com/images/UPLOADED292/601e9da82276d.jpeg",
	 "https://images3.memedroid.com/images/UPLOADED521/601e9d8fd41dc.jpeg",
	 "https://images7.memedroid.com/images/UPLOADED818/601e9caa75369.jpeg",
	 "https://images7.memedroid.com/images/UPLOADED969/601e547a569f4.jpeg",
   "https://thumbs.gfycat.com/CalculatingGivingAnt-size_restricted.gif",
];

	var rand = list[Math.floor(Math.random() * list.length)];
	
  const embed = new Discord.MessageEmbed()
        .setColor()
        .setImage(rand)
        .setTimestamp()
        .setFooter('king')
  await message.channel.send(embed);
        
    }
};