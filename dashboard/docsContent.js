const articles = [
  {
    slug: "primeiros-passos",
    title: "Primeiros passos",
    category: "Começando",
    summary: "Convide o King, confira as permissões e faça a primeira configuração.",
    sections: [
      { title: "1. Adicione o King", paragraphs: ["Use o botão Adicionar no menu ou na página inicial e escolha o servidor. Você precisa ter permissão para gerenciar esse servidor no Discord."] },
      { title: "2. Confira as permissões", paragraphs: ["Para comandos de texto e respostas, o bot precisa visualizar o canal e enviar mensagens. Para música, ele também precisa conectar e falar no canal de voz. Permissões adicionais só são necessárias para os recursos que as utilizam, como moderação e tickets."] },
      { title: "3. Experimente um comando", paragraphs: ["Os comandos de barra podem ser usados digitando / no Discord. O prefixo padrão dos comandos de texto é k, mas ele pode ser diferente se tiver sido configurado no servidor."], commands: ["/play nome da música", "kplay nome da música", "khelp"] },
      { title: "4. Abra o dashboard", paragraphs: ["Entre no dashboard com sua conta Discord, selecione um servidor e ajuste as opções disponíveis. O acesso a cada servidor depende das permissões da sua conta."] },
    ],
  },
  {
    slug: "musica",
    title: "Música e reprodução",
    category: "Música",
    summary: "Toque uma faixa ou playlist e controle a reprodução no servidor.",
    sections: [
      { title: "Comece a tocar", paragraphs: ["Entre primeiro em um canal de voz e depois pesquise uma música ou envie um link compatível. O King entra no seu canal para iniciar a reprodução."], commands: ["/play artista ou música", "kplay https://link-da-faixa"] },
      { title: "Controles principais", paragraphs: ["Use os comandos de reprodução para pular a faixa, encerrar a sessão, repetir a faixa atual ou consultar o que está tocando."], commands: ["/skip", "/stop", "/replay", "/nowplaying"] },
      { title: "Se a música não começar", paragraphs: ["Confirme que você está conectado a um canal de voz e que o King tem permissão para conectar e falar. Se o bot estiver em outro canal, mova-se para o canal dele ou encerre a reprodução antes de tentar novamente."] },
    ],
  },
  {
    slug: "fila",
    title: "Fila de músicas",
    category: "Música",
    summary: "Veja a fila, reorganize faixas e controle o que toca em seguida.",
    sections: [
      { title: "Consultar a fila", paragraphs: ["A faixa em reprodução ocupa a posição atual; as próximas músicas são numeradas a partir de 1. Use a lista para escolher qual faixa mover ou remover."], commands: ["/list", "/shuffle"] },
      { title: "Reorganizar ou remover", paragraphs: ["Mova uma faixa da fila para outra posição ou remova uma faixa pelo número mostrado na lista. A faixa atual não pode ser movida ou removida com esses comandos."], commands: ["/move 3 1", "/remove 2"] },
      { title: "Limpar a fila", paragraphs: ["Limpar a fila remove as músicas que ainda vão tocar. A música atual continua em reprodução. Para encerrar também a música atual, use o comando de parar."], commands: ["/clear", "/stop"] },
    ],
  },
  {
    slug: "filtros",
    title: "Filtros de áudio",
    category: "Música",
    summary: "Aplique, consulte e remova efeitos de áudio durante a reprodução.",
    sections: [
      { title: "Escolher e aplicar filtros", paragraphs: ["Use o seletor interativo para navegar pela lista ou informe o nome do filtro diretamente. A disponibilidade depende dos filtros configurados no bot."], commands: ["/filters", "kfilters", "kaddfilter nightcore", "klistfilters"] },
      { title: "Combinar efeitos", paragraphs: ["Filtros de equalização podem ser combinados. Modos como nightcore, vaporwave e os efeitos rotacionais são exclusivos entre si; ao escolher outro modo exclusivo, ele substitui o anterior."] },
      { title: "Remover filtros", paragraphs: ["Consulte os filtros ativos e remova um efeito específico ou limpe todos. Alterar filtros durante a reprodução pode levar alguns instantes para refletir no áudio."], commands: ["/removefilter nightcore", "/clearfilters"] },
      { title: "Permissões", paragraphs: ["Em uma sessão com fila ativa, os controles de filtro seguem as regras de DJ do servidor. Se o acesso for negado, peça a um administrador para revisar as permissões e os cargos configurados."] },
    ],
  },
  {
    slug: "moderacao",
    title: "Moderação",
    category: "Moderação",
    summary: "Use ferramentas de moderação e entenda os requisitos de acesso.",
    sections: [
      { title: "Comandos disponíveis", paragraphs: ["O King oferece ações de moderação como advertir, silenciar, expulsar, banir, bloquear canais e consultar advertências. A lista de comandos mostra os argumentos de cada ação."], commands: ["/warn", "/warnings", "/mute", "/kick", "/ban", "/purge", "/lock", "/unlock"] },
      { title: "Permissões do Discord", paragraphs: ["A pessoa que executa o comando precisa ter a permissão exigida pelo Discord e pelo próprio comando. Cargos de moderação configurados podem autorizar ações compatíveis, mas não substituem as verificações de hierarquia do Discord."] },
      { title: "Hierarquia de cargos", paragraphs: ["O cargo do bot precisa estar acima do cargo do membro que será moderado. O bot também precisa da permissão específica para a ação, como Banir membros ou Gerenciar mensagens."] },
    ],
  },
  {
    slug: "tickets",
    title: "Sistema de tickets",
    category: "Tickets",
    summary: "Configure o painel de atendimento e gerencie solicitações da comunidade.",
    sections: [
      { title: "Criar o painel", paragraphs: ["Use o comando do painel em um canal que os membros possam acessar. Depois ajuste as opções do sistema e mantenha o bot com permissões para criar canais e configurar as permissões dos tickets."], commands: ["/painelticket", "/ticketsettings"] },
      { title: "Atender um ticket", paragraphs: ["A equipe de suporte pode adicionar ou remover participantes e encerrar o atendimento. As ações disponíveis dependem da configuração do painel e das permissões do servidor."], commands: ["/ticketadd @membro", "/ticketremove @membro", "/close"] },
      { title: "Se um canal não for criado", paragraphs: ["Confira se o bot pode visualizar a categoria, criar canais e gerenciar permissões. Verifique também se o limite de canais do servidor foi atingido."] },
    ],
  },
  {
    slug: "economia",
    title: "Economia e jogos",
    category: "Economia e jogos",
    summary: "Veja seu saldo, resgate recompensas e explore os recursos de diversão.",
    sections: [
      { title: "Saldo e recompensa diária", paragraphs: ["Consulte suas King Coins e resgate a recompensa diária. A recompensa tem intervalo de 24 horas; aguarde o tempo informado pelo comando antes de resgatar novamente."], commands: ["/balance", "/daily", "/ranking"] },
      { title: "Transferir moedas", paragraphs: ["Use o comando de pagamento para enviar moedas a outro membro. Confira o valor e o destinatário antes de confirmar."], commands: ["/pay @membro valor"] },
      { title: "Cassino e outros jogos", paragraphs: ["Os comandos de cassino e jogos podem ter regras, valores mínimos e limites próprios. Consulte a descrição exibida pelo comando e use apenas o saldo que deseja apostar."] },
      { title: "Votos e recompensas", paragraphs: ["Você pode apoiar o King pelo link de votação no Top.gg. O comando de votação mostra o endereço atual e informa a recompensa configurada."], commands: ["/votar", "/votos"] },
    ],
  },
  {
    slug: "dashboard",
    title: "Dashboard e configurações",
    category: "Dashboard",
    summary: "Gerencie configurações por servidor pelo painel web do King.",
    sections: [
      { title: "Entrar e escolher o servidor", paragraphs: ["Faça login com Discord e selecione um servidor em que você tenha acesso de gerenciamento. As opções exibidas podem variar conforme os módulos habilitados e suas permissões."] },
      { title: "Salvar alterações", paragraphs: ["Revise cada formulário antes de salvar. Algumas configurações são específicas de um servidor, então confirme o nome do servidor selecionado antes de alterar cargos, canais ou preferências."] },
      { title: "Comandos e central de ajuda", paragraphs: ["Use a página de comandos do dashboard para consultar a lista completa e volte a esta central para guias por assunto."] },
    ],
  },
  {
    slug: "solucao-de-problemas",
    title: "Solução de problemas",
    category: "Ajuda técnica",
    summary: "Passos rápidos para resolver falhas comuns de música, acesso e comandos.",
    sections: [
      { title: "Comandos não aparecem", paragraphs: ["Aguarde a atualização dos comandos do Discord, confira se o bot foi convidado com o escopo de comandos de aplicação e tente digitar / novamente. Para comandos com prefixo, confirme o prefixo configurado no servidor."] },
      { title: "Bot não entra no canal de voz", paragraphs: ["Confirme que o canal permite que o bot conecte e fale, e que não há bloqueios por cargo ou canal. Tente sair e entrar novamente no canal de voz."] },
      { title: "Faixa carregada, mas sem áudio", paragraphs: ["Verifique se o bot está conectado ao canal correto, se o volume está acima de zero e se a faixa ainda está disponível na fonte. Se o problema persistir, tente outra faixa e limpe efeitos ativos."] },
      { title: "Permissão negada", paragraphs: ["Veja se você está no canal de voz do bot, se tem o cargo de DJ quando necessário e se possui a permissão de servidor exigida pelo comando."] },
      { title: "Ainda precisa de ajuda?", paragraphs: ["Anote o servidor, o comando usado e a mensagem de erro. Consulte os canais oficiais do King para pedir suporte e não publique tokens, senhas ou credenciais."], commands: ["/commands"] },
    ],
  },
];

const categories = [...new Set(articles.map((article) => article.category))];
module.exports = { articles, categories };
