const default_prefix = require("../../config.json").default_prefix;
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
    .addField(`<:musica:810233712334995496>ㅤ**MUSICA**`,`❗|Em manutenção`)
    .addField(`<:nsfw2:810232533462810666>ㅤ**NSFW**`,`ㅤ`)
    .addField(`<:utility:810250009894584351>ㅤ**UTILIDADE**`,`ㅤ`)
    .setThumbnail(client.user.avatarURL)
    .setColor(roleColor)
    .setFooter(`Requerido por ${message.author.tag}`,message.author.displayAvatarURL({ dynamic: true }))
  
    let embed1 = new Discord.MessageEmbed()
    .setDescription(`<:RolePlay:810231968297517106>ㅤ**ACÃO**:\n
• **${config.default_prefix}abraçar**
• **${config.default_prefix}aplaudir**
• **${config.default_prefix}atirar**
• **${config.default_prefix}beijar**
• **${config.default_prefix}bye**
• **${config.default_prefix}cafune**
• **${config.default_prefix}chorar**
• **${config.default_prefix}dance**
• **${config.default_prefix}morder**
• **${config.default_prefix}morrer**
• **${config.default_prefix}sad**
• **${config.default_prefix}soco**
• **${config.default_prefix}sorrir**
• **${config.default_prefix}tapa**
• **${config.default_prefix}timido**`)
    .setThumbnail(client.user.avatarURL)
    .setColor(roleColor)
    
    let embed2 = new Discord.MessageEmbed()
.setDescription(`<a:fun:810254327372316713>ㅤ**DIVERSÃO**:\n
• **${config.default_prefix}8ball** - Faça uma pergunta para o bot e ele irá responder você da Melhor forma possível.
• **${config.default_prefix}ascii** - Retorna um texto em formato ascii
• **${config.default_prefix}binario** - Converta uma palavra para codigo binário
• **${config.default_prefix}decode** - decodifique um codigo binario 
• **${config.default_prefix}chat** - Converse comigo ^-^
• **${config.default_prefix}coinflip** - Gire uma moeda e veja se irá cair cara ou coroa!
• **${config.default_prefix}ejetar** - ejete alguém da nave - Among Us
• **${config.default_prefix}emojify** - Retorna um texto em forma de emoji
• **${config.default_prefix}morse** - codifique ou decodifique um codigo morse
• **${config.default_prefix}ratewaifu** - vote em sua waifu favorita
• **${config.default_prefix}say** - você fala e eu repito
• **${config.default_prefix}ship** - ship um casal ou veja qual a probabilidade de você dar certo com seu crush
• **${config.default_prefix}vaporwave** - Converta um texto em ｖａｐｏｒｗａｖｅ
`)

    .setThumbnail(client.user.avatarURL)
    .setColor(roleColor)
    
    let embed3 = new Discord.MessageEmbed()
    .setDescription(`<:game:810254416635494400>ㅤ**GAMES**:\n
• **${config.default_prefix}fight** - lute com alguém do servidor e veja quem sai vitorioso		
• **${config.default_prefix}forca** - Jogue uma partida de jogo da forca
• **${config.default_prefix}ppt** - "Pedra papel tesoura/ Jogue jokenpô com o bot
• **${config.default_prefix}velha** - Jogue uma partida de jogo da velha com um membro do servidor`)
    .setThumbnail(client.user.avatarURL)
    .setColor(roleColor)
        
    let embed4 = new Discord.MessageEmbed()
.setDescription(`<:photos:810249979905572864>ㅤ**IMAGEM**:\n
• **${config.default_prefix}bob** - Coloque uma frase dentro do meme Bob Esponja
• **${config.default_prefix}changemymind** - Coloque sua frase dentro de uma imagem Change my mind
• **${config.default_prefix}clyde** Faça o bot oficial do discord repetir sua frase
• **${config.default_prefix}firstword** - Faça o bebe falar suas primeiras palavras
• **${config.default_prefix}gif** - Procure um gif no Tenor
• **${config.default_prefix}laranjo** - Uma foto do laranjo é gerado com asua frase
• **${config.default_prefix}meme** - Gera imagens com memes aleátorios
• **${config.default_prefix}memevideo** - Videos de memes aleátorios
• **${config.default_prefix}monkey** - Gera uma imagem do macaquinho "suspeito" com sua frase personalizada
• **${config.default_prefix}pablo** - Gera uma imagem do Pablo Escobar solitario com sua frase personalizada
• **${config.default_prefix}stonks** - Gera uma imagem stonks com sua frase personalizada
• **${config.default_prefix}supreme** - Converta sua frase em forma da logo SUPREME
• **${config.default_prefix}trump** - O que você quer que o ex presidente twitte hoje?
• **${config.default_prefix}wallpaper** - obtenha uma imagem neko
• **${config.default_prefix}wasted** - Retornna uma imagem wasted!`)
    .setThumbnail(client.user.avatarURL)
    .setColor(roleColor)    
   
    let embed5 = new Discord.MessageEmbed()
    .setDescription(`<a:moderation:810250044888317952>ㅤ**MODERAÇÃO**:\n
• **${config.default_prefix}addcargo** - Adicione um cargo para um membro do servidor
• **${config.default_prefix}removecargo** - Retira um cargo do usuario mencionado
• **${config.default_prefix}adcmd** - adicionar comandos personalizados de guilda
• **${config.default_prefix}delcmd** - Exclua o comando personalizado
• **${config.default_prefix}ban** - Banir um usuario que tenha quebrado as regras 
• **${config.default_prefix}unban** - Desbanir aquele usuário que você baniu
• **${config.default_prefix}chutar** - Expulse qualquer membro do servidor
• **${config.default_prefix}limpar** - Apague até 99 mensagens de um canal
• **${config.default_prefix}lock** - Bloqueie um canal
• **${config.default_prefix}unlock** - Desbloquie o canal bloqueado
• **${config.default_prefix}mute** - Silencie um membro do servidor ideal para aqueles que gostam de quebrar as regras
• **${config.default_prefix}unmute** - Desmutar um membro do servidor
• **${config.default_prefix}tempmute** - Defina o tempo que um membro vai permanecer mutado
• **${config.default_prefix}prefix** - Mude meu default_prefixo neste servidor
• **${config.default_prefix}slowmode** - Permite definir o modo lento no canal
• **${config.default_prefix}warn** - Advertir quem não obedece às regras
• **${config.default_prefix}warnings** - Veja os avisos seus ou da pessoa mencionada
• **${config.default_prefix}resetwarns** - Redefinir avisos da pessoa mencionada`)
    .setThumbnail(client.user.avatarURL)
    .setColor(roleColor)
        
    let embed6 = new Discord.MessageEmbed()
    .setDescription(`<:musica:810233712334995496>ㅤ**MUSICA**:\n
• **${config.default_prefix}aleatorio** - Colocar a fila no aleatorio
• **${config.default_prefix}fila** - Mostra a fila de músicas e o que está tocando agora.
• **${config.default_prefix}filtro** - Definir áudio - efeitos
• **${config.default_prefix}leave** - Saia do canal atual
• **${config.default_prefix}letra** - Obtenha a letra da música que está tocando
• **${config.default_prefix}loop** - Alternar loop de música
• **${config.default_prefix}mover** - Mova as músicas na fila.
• **${config.default_prefix}nowplaying** - Mostrar música atual
• **${config.default_prefix}pause** - Pause a música que está tocando
• **${config.default_prefix}play** - Toca música do YouTube / Stream
• **${config.default_prefix}procurar** - Pesquise e selecione vídeos para reproduzir
• **${config.default_prefix}radio** - Ouça uma estação de radio
• **${config.default_prefix}remover** - Remover música da fila
• **${config.default_prefix}resumo** - Retomar a música atual
• **${config.default_prefix}skip** - Pular a música que está tocando
• **${config.default_prefix}skipto** - Pule para o número da fila selecionado
• **${config.default_prefix}stop** - Para a música
• **${config.default_prefix}volume** - "Alterar o volume atual no servidor`)
    .setThumbnail(client.user.avatarURL)
    .setColor(roleColor)
    
    let embed7 = new Discord.MessageEmbed()
    .setDescription(`<:nsfw2:810232533462810666>ㅤ**NSFW**:\n
• **${config.default_prefix}4k**
• **${config.default_prefix}anal**
• **${config.default_prefix}ass**
• **${config.default_prefix}gif**
• **${config.default_prefix}hentai**
• **${config.default_prefix}hentaigif**
• **${config.default_prefix}holo**
• **${config.default_prefix}lewd**
• **${config.default_prefix}neko**
• **${config.default_prefix}pussy**
• **${config.default_prefix}rule34**
• **${config.default_prefix}thigh**`)
    .setThumbnail(client.user.avatarURL)
    .setColor(roleColor)
    
    let embed8 = new Discord.MessageEmbed()
    .setDescription(`<:utility:810250009894584351>ㅤ**UTILIDADE**:\n
• **${config.default_prefix}anime** - Informações sobre Animes!
• **baixar**- Agora você pode fazer o download de um video do youtube e o bot retorna ele em formato mp3 use| baixar + link_do_video
• **${config.default_prefix}anunciar** - Faça um anuncio em seu servidor
• **${config.default_prefix}avatar** - Exibe o seu avatar ou de um outro usuário
• **${config.default_prefix}calculadora** - Resolva um calculo matematico
• **${config.default_prefix}clima** - Veja o clima de qualquer lugar do mundo
• **${config.default_prefix}convite** - Para me adicionar / convidar o bot para o seu servidor
• **${config.default_prefix}covid** - Receba atualizações de todo o mundo dos casos de covid 19
• **${config.default_prefix}emoji** - Receba uma lista de tos os emojis do seu servidor
• **${config.default_prefix}idemoji** - Pegue um o ID de uma figurinha do seu servidor
• **${config.default_prefix}help** - Mostra todos os comandos do bot disponíveis.
• **${config.default_prefix}imdb** - Obtenha informações sobre séries e filmes
• **${config.default_prefix}info** - Veja as informações detalhadas do bot
• **${config.default_prefix}moeda** - Veja o valor da moeda nos principais países
• **${config.default_prefix}ping** - Obter ping do bot
• **${config.default_prefix}qrcode** - Faça um QR Code de um link
• **${config.default_prefix}serveravatar** - Retorna o logo do servidor sendo possivel fazer o download do mesmo
• **${config.default_prefix}serverinfo** - Receba as informações do seu servidor
• **${config.default_prefix}sugerir** - Enviar uma sugestão para o seu canal de sugestões
• **${config.default_prefix}tradutor** - Traduza uma frase ou um texto para o seu idioma
• **${config.default_prefix}userinfo** - Obtenha estatísticas avançadas de determinada pessoa ou de você mesmo`)
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
    const music = msg.createReactionCollector((r, u)  => r.emoji.name === "810233712334995496" &&u.id === message.author.id, {time:120000});    
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