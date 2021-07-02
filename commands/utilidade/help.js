const prefix = require("../../config.json").prefix;
const Discord = require("discord.js");
const config = require("../../config.json");

module.exports = {
	
	name:"help",

	run: async (client, message, args) => {
    const roleColor =
      message.guild.me.displayHexColor === "#00FFFF"
        ? "##00BFFF"
        : message.guild.me.displayHexColor;        
        
    message.delete()

    var embedInicial = new Discord.MessageEmbed()
    .setDescription(`**📬ㅤOlá ${message.author}, precisa de ajuda? Aqui estão todos os meus comandos:**`)
    .addField(`<:RolePlay:810231968297517106>ㅤ**AÇÃO**`,`ㅤ`)
    .addField(`<a:fun:810254327372316713>ㅤ**DIVERSÃO**`,`ㅤ`)
    .addField(`<:game:810254416635494400>ㅤ**GAMES**`,`ㅤ`)
    .addField(`<:photos:810249979905572864>ㅤ**IMAGEM**`,`ㅤ`)
    .addField(`<a:moderation:810250044888317952>ㅤ**MODERAÇÃO**`,`ㅤ`)
    .addField(`<:musica:810233712334995496>ㅤ**MUSICA**`,`ㅤ`)
    .addField(`<:nsfw2:810232533462810666>ㅤ**NSFW**`,`ㅤ`)
    .addField(`<:utility:810250009894584351>ㅤ**UTILIDADE**`,`ㅤ`)
    .setThumbnail(client.user.avatarURL)
    .setColor(roleColor)
    .setFooter(`Requerido por ${message.author.tag}`,message.author.displayAvatarURL({ dynamic: true }))
  
    let embed1 = new Discord.MessageEmbed()
    .setDescription(`<:RolePlay:810231968297517106>ㅤ**ACÃO**:\n
• **${config.prefix}abraçar**
• **${config.prefix}aplaudir**
• **${config.prefix}atirar**
• **${config.prefix}beijar**
• **${config.prefix}bye**
• **${config.prefix}cafune**
• **${config.prefix}chorar**
• **${config.prefix}dance**
• **${config.prefix}morder**
• **${config.prefix}morrer**
• **${config.prefix}sad**
• **${config.prefix}soco**
• **${config.prefix}sorrir**
• **${config.prefix}tapa**
• **${config.prefix}timido**`)
    .setThumbnail(client.user.avatarURL)
    .setColor(roleColor)
    
    let embed2 = new Discord.MessageEmbed()
.setDescription(`<a:fun:810254327372316713>ㅤ**DIVERSÃO**:\n
• **${config.prefix}8ball** - Faça uma pergunta para o bot e ele irá responder você da Melhor forma possível.
• **${config.prefix}ascii** - Retorna um texto em formato ascii
• **${config.prefix}binario** - Converta uma palavra para codigo binário
• **${config.prefix}decode** - decodifique um codigo binario 
• **${config.prefix}chat** - Converse comigo ^-^
• **${config.prefix}coinflip** - Gire uma moeda e veja se irá cair cara ou coroa!
• **${config.prefix}ejetar** - ejete alguém da nave - Among Us
• **${config.prefix}emojify** - Retorna um texto em forma de emoji
• **${config.prefix}morse** - codifique ou decodifique um codigo morse
• **${config.prefix}ratewaifu** - vote em sua waifu favorita
• **${config.prefix}say** - você fala e eu repito
• **${config.prefix}ship** - ship um casal ou veja qual a probabilidade de você dar certo com seu crush
• **${config.prefix}vaporwave** - Converta um texto em ｖａｐｏｒｗａｖｅ
`)

    .setThumbnail(client.user.avatarURL)
    .setColor(roleColor)
    
    let embed3 = new Discord.MessageEmbed()
    .setDescription(`<:game:810254416635494400>ㅤ**GAMES**:\n
• **${config.prefix}aki** - Jogue uma partida com o gênio    
• **${config.prefix}fight** - lute com alguém do servidor e veja quem sai vitorioso		
• **${config.prefix}forca** - Jogue uma partida de jogo da forca
• **${config.prefix}ppt** - "Pedra papel tesoura/ Jogue jokenpô com o bot
• **${config.prefix}velha** - Jogue uma partida de jogo da velha com um membro do servidor`)
    .setThumbnail(client.user.avatarURL)
    .setColor(roleColor)
        
    let embed4 = new Discord.MessageEmbed()
.setDescription(`<:photos:810249979905572864>ㅤ**IMAGEM**:\n
• **${config.prefix}bob** - Coloque uma frase dentro do meme Bob Esponja
• **${config.prefix}changemymind** - Coloque sua frase dentro de uma imagem Change my mind
• **${config.prefix}clyde** Faça o bot oficial do discord repetir sua frase
• **${config.prefix}firstword** - Faça o bebe falar suas primeiras palavras
• **${config.prefix}tgif** - Procure um gif no Tenor
• **${config.prefix}laranjo** - Uma foto do laranjo é gerado com asua frase
• **${config.prefix}meme** - Gera imagens com memes aleátorios
• **${config.prefix}memevideo** - Videos de memes aleátorios
• **${config.prefix}monkey** - Gera uma imagem do macaquinho "suspeito" com sua frase personalizada
• **${config.prefix}pablo** - Gera uma imagem do Pablo Escobar solitario com sua frase personalizada
• **${config.prefix}stonks** - Gera uma imagem stonks com sua frase personalizada
• **${config.prefix}supreme** - Converta sua frase em forma da logo SUPREME
• **${config.prefix}trump** - O que você quer que o ex presidente twitte hoje?
• **${config.prefix}wallpaper** - obtenha uma imagem neko
• **${config.prefix}wasted** - Retornna uma imagem wasted!`)
    .setThumbnail(client.user.avatarURL)
    .setColor(roleColor)    
   
    let embed5 = new Discord.MessageEmbed()
    .setDescription(`<a:moderation:810250044888317952>ㅤ**MODERAÇÃO**:\n
• **${config.prefix}addcargo** - Adicione um cargo para um membro do servidor
• **${config.prefix}removecargo** - Retira um cargo do usuario mencionado
• **${config.prefix}adcmd** - adicionar comandos personalizados de guilda
• **${config.prefix}delcmd** - Exclua o comando personalizado
• **${config.prefix}ban** - Banir um usuario que tenha quebrado as regras 
• **${config.prefix}unban** - Desbanir aquele usuário que você baniu
• **${config.prefix}chutar** - Expulse qualquer membro do servidor
• **${config.prefix}limpar** - Apague até 99 mensagens de um canal
• **${config.prefix}lock** - Bloqueie um canal
• **${config.prefix}unlock** - Desbloquie o canal bloqueado
• **${config.prefix}mute** - Silencie um membro do servidor ideal para aqueles que gostam de quebrar as regras
• **${config.prefix}unmute** - Desmutar um membro do servidor
• **${config.prefix}tempmute** - Defina o tempo que um membro vai permanecer mutado
• **${config.prefix}prefix** - Mude meu prefixo neste servidor
• **${config.prefix}slowmode** - Permite definir o modo lento no canal
• **${config.prefix}warn** - Advertir quem não obedece às regras
• **${config.prefix}warnings** - Veja os avisos seus ou da pessoa mencionada
• **${config.prefix}resetwarns** - Redefinir avisos da pessoa mencionada`)
    .setThumbnail(client.user.avatarURL)
    .setColor(roleColor)
        
    let embed6 = new Discord.MessageEmbed()
    .setDescription(`<:musica:810233712334995496>ㅤ**MUSICA**:\n
• **${config.prefix}aleatorio** - Colocar a fila no aleatorio
• **${config.prefix}fila** - Mostra a fila de músicas e o que está tocando agora.
• **${config.prefix}filtro** - Definir áudio - efeitos
• **${config.prefix}leave** - Saia do canal atual
• **${config.prefix}letra** - Obtenha a letra da música que está tocando
• **${config.prefix}loop** - Alternar loop de música
• **${config.prefix}mover** - Mova as músicas na fila.
• **${config.prefix}nowplaying** - Mostrar música atual
• **${config.prefix}pause** - Pause a música que está tocando
• **${config.prefix}play** - Toca música do YouTube / Stream
• **${config.prefix}procurar** - Pesquise e selecione vídeos para reproduzir
• **${config.prefix}radio** - Ouça uma estação de radio
• **${config.prefix}remover** - Remover música da fila
• **${config.prefix}resumo** - Retomar a música atual
• **${config.prefix}skip** - Pular a música que está tocando
• **${config.prefix}skipto** - Pule para o número da fila selecionado
• **${config.prefix}stop** - Para a música
• **${config.prefix}volume** - "Alterar o volume atual no servidor`)
    .setThumbnail(client.user.avatarURL)
    .setColor(roleColor)
    
    let embed7 = new Discord.MessageEmbed()
    .setDescription(`<:nsfw2:810232533462810666>ㅤ**NSFW**:\n
• **${config.prefix}4k**
• **${config.prefix}anal**
• **${config.prefix}ass**
• **${config.prefix}gif**
• **${config.prefix}hentai**
• **${config.prefix}hentaigif**
• **${config.prefix}holo**
• **${config.prefix}lewd**
• **${config.prefix}neko**
• **${config.prefix}pussy**
• **${config.prefix}rule34**
• **${config.prefix}thigh**`)
    .setThumbnail(client.user.avatarURL)
    .setColor(roleColor)
    
    let embed8 = new Discord.MessageEmbed()
    .setDescription(`<:utility:810250009894584351>ㅤ**UTILIDADE**:\n
• **${config.prefix}anime** - Informações sobre Animes!
• **baixar**- Agora você pode fazer o download de um video do youtube e o bot retorna ele em formato mp3 use| baixar + link_do_video
• **${config.prefix}anunciar** - Faça um anuncio em seu servidor
• **${config.prefix}avatar** - Exibe o seu avatar ou de um outro usuário
• **${config.prefix}calculadora** - Resolva um calculo matematico
• **${config.prefix}clima** - Veja o clima de qualquer lugar do mundo
• **${config.prefix}convite** - Para me adicionar / convidar o bot para o seu servidor
• **${config.prefix}covid** - Receba atualizações de todo o mundo dos casos de covid 19
• **${config.prefix}emoji** - Receba uma lista de tos os emojis do seu servidor
• **${config.prefix}idemoji** - Pegue um o ID de uma figurinha do seu servidor
• **${config.prefix}help** - Mostra todos os comandos do bot disponíveis.
• **${config.prefix}imdb** - Obtenha informações sobre séries e filmes
• **${config.prefix}info** - Veja as informações detalhadas do bot
• **${config.prefix}moeda** - Veja o valor do real nas principais moedas
• **${config.prefix}ping** - Obter ping do bot
• **${config.prefix}qrcode** - Faça um QR Code de um link
• **${config.prefix}serveravatar** - Retorna o logo do servidor sendo possivel fazer o download do mesmo
• **${config.prefix}serverinfo** - Receba as informações do seu servidor
• **${config.prefix}sugerir** - Enviar uma sugestão para o seu canal de sugestões
• **${config.prefix}tradutor** - Traduza uma frase ou um texto para o seu idioma
• **${config.prefix}userinfo** - Obtenha estatísticas avançadas de determinada pessoa ou de você mesmo`)

    .setThumbnail(client.user.avatarURL)
    .setColor(roleColor)
    
    message.channel.send(embedInicial).then(async msg => {
  
    await msg.react("810254382549565530")
    await msg.react("810231968297517106")
    await msg.react("810254327372316713")
    await msg.react("810254416635494400")
    await msg.react("810249979905572864")
    await msg.react("810250044888317952")
    await msg.react("810233712334995496")
    await msg.react("810232533462810666")    
    await msg.react("810250009894584351")    
   

    const inicio = msg.createReactionCollector((r, u) => r.emoji.id === "810254382549565530" && u.id === message.author.id, { time: 60000});
    const aca = msg.createReactionCollector((r, u) => r.emoji.id === "810231968297517106" && u.id === message.author.id, { time: 120000 });
    const diver = msg.createReactionCollector((r, u) => r.emoji.id === "810254327372316713" && u.id === message.author.id, { time: 120000 });
    const game = msg.createReactionCollector((r, u) => r.emoji.id === "810254416635494400" && u.id === message.author.id, { time: 120000 });
    const image = msg.createReactionCollector((r, u) => r.emoji.id === "810249979905572864" &&u.id === message.author.id, { time: 120000 });
    const mod = msg.createReactionCollector((r, u) => r.emoji.id === "810250044888317952" &&u.id === message.author.id, {time: 120000});
    const music = msg.createReactionCollector((r, u)  => r.emoji.id === "810233712334995496" &&u.id === message.author.id, {time:120000});    
    const nsfw = msg.createReactionCollector((r, u) => r.emoji.id === "810232533462810666" &&u.id === message.author.id, {time:120000});
    const util = msg.createReactionCollector((r, u) => r.emoji.id === "810250009894584351" &&u.id === message.author.id, {time:120000});    
    inicio.on('collect', async r => {
      msg.edit(embedInicial)
      
    })
  
    aca.on('collect', async r => {
      msg.edit(embed1)
      
    })
  
    diver.on('collect', async r => {
      msg.edit(embed2)
      
    })
  
    game.on('collect', async r => {
      msg.edit(embed3)
      
    })

    image.on('collect', async r => {
      msg.edit(embed4)
      
    })
    
    mod.on('collect', async r => {
        msg.edit(embed5)
        
    })    

    music.on('collect', async r => {
        msg.edit(embed6)
        
    })

    nsfw.on('collect', async r => {
        msg.edit(embed7)
        
    })
        
    util.on('collect', async r => {
        msg.edit(embed8)
        
    })    
    })
}
}