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
    .setTitle(`📬ㅤOlá preciso de ajuda? Aqui estão todos os meus comandos:`)
    .addField(`🎭ㅤ**AÇÃO**ㅤ🎭`, `Comandos para mandar gifs aleátorios no chat`)
    .addField(`🎉ㅤ**DIVERSÃO**ㅤ🎉`, `Comandos de diversão`)
    .addField(`🎮ㅤ**GAMES**ㅤ🎮`,`Comandos para jogos`)
    .addField(`🖼️ㅤ**IMAGEM**ㅤ🖼️`,`Comandos para pothoshop e memes`)
    .addField(`🛠️ㅤ**MODERAÇÃO**ㅤ🛠️`,`Comandos para moderadores`)
    .addField(`🎵ㅤ**MUSICA**ㅤ🎵`,`Comandos para ouvir musicas`)
    .addField(`🔞ㅤ**NSFW**ㅤ🔞`,`Comandos de uso adulto`)
    .addField(`🔧ㅤ**UTILIDADE**ㅤ🔧`,`Alguns comandos úteis para você usar`)
    .setThumbnail(client.user.avatarURL)
    .setColor(roleColor)
    .setFooter(`Requerido por ${message.author.tag}`,message.author.displayAvatarURL({ dynamic: true }))
  
    let embed1 = new Discord.MessageEmbed()
    .setDescription(`🎭ㅤ**ACÃO**:\n
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
.setDescription(`🎉ㅤ**DIVERSÃO**:\n
• **${config.default_prefix}ascii** - Retorna um texto em formato ascii
• **${config.default_prefix}chatbot** - Converse comigo ^-^
• **${config.default_prefix}coinflip** - Gire uma moeda e veja se irá cair cara ou coroa!
• **${config.default_prefix}ejetar** - ejete alguém da nave - Among Us
• **${config.default_prefix}emojify** - Retorna um texto em forma de emoji
• **${config.default_prefix}king** - Faça uma pergunta para o bot e ele irá responder você da Melhor forma possível.`)
    .setThumbnail(client.user.avatarURL)
    .setColor(roleColor)
    
    let embed3 = new Discord.MessageEmbed()
    .setDescription(`🎮ㅤ**GAMES**:\n
• **${config.default_prefix}hangman** - Jogue uma partida de jogo da forca
• **${config.default_prefix}ppt** - "Pedra papel tesoura/ Jogue jokenpô com o bot
• **${config.default_prefix}tictac** - Jogue uma partida de jogo da velha com um membro do servidor`)
    .setThumbnail(client.user.avatarURL)
    .setColor(roleColor)
        
    let embed4 = new Discord.MessageEmbed()
.setDescription(`🖼️ㅤ**IMAGEM**:\n
• **${config.default_prefix}changemymind** - Coloque sua frase dentro de uma imagem Change my mind
• **${config.default_prefix}meme** - Gera imagens com memes aleátorios
• **${config.default_prefix}memevideo** - Videos de memes aleátorios
• **${config.default_prefix}wasted** - Retornna uma imagem wasted!`)
    .setThumbnail(client.user.avatarURL)
    .setColor(roleColor)    
   
    let embed5 = new Discord.MessageEmbed()
    .setDescription(`🛠️ㅤ**MODERAÇÃO**:\n
• **${config.default_prefix}addcargo** - Adicione um cargo para um membro do servidor
• **${config.default_prefix}removecargo** - Retira um cargo do usuario mencionado
• **${config.default_prefix}adcmd** - adicionar comandos personalizados de guilda
• **${config.default_prefix}delcmd** - Exclua o comando personalizado
• **${config.default_prefix}ban** - Banir qualquer pessoa do servidor
• **${config.default_prefix}chutar** - Expulse qualquer membro do servidor
• **${config.default_prefix}limpar** - Apague até 99 mensagens de um canal
• **${config.default_prefix}mute** - Silencie um membro do servidor ideal para aqueles que gostam de quebrar as regras
• **${config.default_prefix}unmute** - Desmutar um membro do servidor
• **${config.default_prefix}default_prefix** - Mude meu default_prefixo neste servidor
• **${config.default_prefix}tempmute** - Defina o tempo que um membro vai permanecer mutado
• **${config.default_prefix}slowmode** - Permite definir o modo lento no canal
• **${config.default_prefix}warn** - Advertir quem não obedece às regras
• **${config.default_prefix}warnings** - Veja os avisos seus ou da pessoa mencionada
• **${config.default_prefix}resetwarns** - Redefinir avisos da pessoa mencionada`)
    .setThumbnail(client.user.avatarURL)
    .setColor(roleColor)
        
    let embed6 = new Discord.MessageEmbed()
    .setDescription(`🎵ㅤ**MUSICA**:\n
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
    .setDescription(`🔞ㅤ**NSFW**:\n
• **${config.default_prefix}4k**
• **${config.default_prefix}ass**
• **${config.default_prefix}gif**
• **${config.default_prefix}hentai**
• **${config.default_prefix}neko**
• **${config.default_prefix}pussy**`)
    .setThumbnail(client.user.avatarURL)
    .setColor(roleColor)
    
    let embed8 = new Discord.MessageEmbed()
    .setDescription(`🔧ㅤ**UTILIDADE**:\n
• **${config.default_prefix}anime** - Informações sobre Animes!
• **${config.default_prefix}avatar** - Exibe o seu avatar ou de um outro usuário
• **${config.default_prefix}clima** - Veja o clima de qualquer lugar do mundo
• **${config.default_prefix}convite** - Para me adicionar / convidar o bot para o seu servidor
• **${config.default_prefix}covid** - Receba atualizações de todo o mundo dos casos de covid 19
• **${config.default_prefix}idemoji** - Pegue um o ID de uma figurinha do seu servidor
• **${config.default_prefix}help** - Mostra todos os comandos do bot disponíveis.
• **${config.default_prefix}imdb** - Obtenha informações sobre séries e filmes
• **${config.default_prefix}info** - Veja as informações detalhadas do bot
• **${config.default_prefix}level** - Veja o nível do autor ou usuario mencionado
• **${config.default_prefix}ping** - Obter ping do bot
• **${config.default_prefix}sugerir** - Envie uma sugestão, ideal para usar em canais de sugestões
• **${config.default_prefix}userinfo** - Obtenha estatísticas avançadas de determinada pessoa ou de você mesmo`)
    .setThumbnail(client.user.avatarURL)
    .setColor(roleColor)
    
    message.channel.send(embedInicial).then(async msg => {
  
    await msg.react("🏠")
    await msg.react("🎭")
    await msg.react("🎉")
    await msg.react("🎮")
    await msg.react("🖼️")
    await msg.react("🛠️")
    await msg.react("🎵")
    await msg.react("🔞")    
    await msg.react("🔧")    
   

    const inicio = msg.createReactionCollector((r, u) => r.emoji.name === "🏠" && u.id === message.author.id, { time: 60000});
    const aca = msg.createReactionCollector((r, u) => r.emoji.name === "🎭" && u.id === message.author.id, { time: 120000 });
    const diver = msg.createReactionCollector((r, u) => r.emoji.name === "🎉" && u.id === message.author.id, { time: 120000 });
    const game = msg.createReactionCollector((r, u) => r.emoji.name === "🎮" && u.id === message.author.id, { time: 120000 });
    const image = msg.createReactionCollector((r, u) => r.emoji.name === "🖼️" &&u.id === message.author.id, { time: 120000 });
    const mod = msg.createReactionCollector((r, u) => r.emoji.name === "🛠️" &&u.id === message.author.id, {time: 120000});
    const music = msg.createReactionCollector((r, u)  => r.emoji.name === "🎵" &&u.id === message.author.id, {time:120000});    
    const nsfw = msg.createReactionCollector((r, u) => r.emoji.name === "🔞" &&u.id === message.author.id, {time:120000});
    const util = msg.createReactionCollector((r, u) => r.emoji.name === "🔧" &&u.id === message.author.id, {time:120000});    
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