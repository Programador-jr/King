module.exports = { 
  name: "ratewaifu",
  aliases: ['waifu', 'avaliarwaifu'],
	category:"Diversão",
	cooldown: "5",
  run:async (client, message, args) => {

  let user = message.mentions.users.first() || client.users.cache.get(args[0]);

  if (!user) {
    return message.reply('lembre-se de mencionar um usuário válido para avaliar!');
    }

  if (user == 794291443454836766) return message.reply('Eu dou nota **∞** para <@794291443454836766> sim eu sou muito lindo 😘')
      
  if(user == 718669518452293713) return message.reply(`Sobre ${user}... Eu dou nota **1000** para essa waifu. Se vc procurar definição de perfeição no dicionário aparece ${user}! <:cut:808443704028823574>`)

  if(user == 772855488756580404) return message.reply(`Sobre ${user}... Eu dou nota **1000** para essa waifu. Se vc procurar definição de perfeição no dicionário aparece ${user}! <:cut:808443704028823574>`)

  if(user == 532413362940936213) return message.reply(`Sobre ${user}... Eu dou nota **1000** para essa waifu. Se vc procurar definição de perfeição no dicionário aparece ${user}! <:cut1:808444488086847538>`)

	  if(user == 446123064363712523) return message.reply(`Sobre ${user}... Eu dou nota **1000** para essa waifu. Se vc procurar definição de perfeição no dicionário aparece ${user}! <:cut1:808444488086847538>`)

  if(user == 757434569011232879) return message.reply(`Sobre ${user}... Eu dou nota **1000** para essa waifu. Se vc procurar definição de perfeição no dicionário aparece ${user}! <:cut1:808444488086847538>`)	

	  if(user == 765113381094817812) return message.reply(`Sobre ${user}... Eu dou nota **1000** para essa waifu. Se vc procurar definição de perfeição no dicionário aparece ${user}! <:cut1:808444488086847538>`)
  
var list = [
  '**1** para essa waifu. Eu não gostei <:hm:808446536533934100> ',
  '**5** para essa waifu. <:hmmm:779010951420051457> ',
  '**7** para essa waifu. Achei ela bonitinha <:cut1:808444488086847538> ',
    '**4** para essa waifu. Bonitinha <:hm:808446536533934100>',
    '**3** para essa waifu. Bonitinha, mas acho que pode melhorar *na minha opinião* <:hm:808446536533934100>',
    '**5** para essa waifu.',
    '**8** para essa waifu.',
    '**10** para essa waifu. Essa waifu é perfeita! Eu não trocaria ela por nada se fosse você! <:cut:808443704028823574>'
];
    
var rand = list[Math.floor(Math.random() * list.length)];

  await message.reply(`Sobre ${user}... Eu dou nota ${rand}`);
}
}