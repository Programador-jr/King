# 👑 King Bot

[English](README.md) | [Português](README-pt.md)

Um bot Discord poderoso e repleto de recursos com moderação avançada, streaming de música, sistemas automatizados e um dashboard web abrangente.

![Discord.js](https://img.shields.io/badge/discord.js-v14-blue?style=flat-square&logo=discord)
![Node.js](https://img.shields.io/badge/Node.js-v24.13.0-green?style=flat-square&logo=node.js)
![Licença](https://img.shields.io/badge/licença-MIT-yellow?style=flat-square)
![Versão](https://img.shields.io/badge/versão-6.0.0-orange?style=flat-square)

## 📋 Índice

- [Funcionalidades](#-funcionalidades)
- [Stack Tecnológico](#-stack-tecnológico)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Como Usar](#-como-usar)
- [Comandos](#-comandos)
- [Dashboard](#-dashboard)
- [Segurança](#-segurança)
- [Contribuindo](#-contribuindo)
- [Suporte](#-suporte)

## ✨ Funcionalidades

### 🛡️ **Sistema Avançado de Moderação**
- **Suite completa de moderação** com comandos de banimento, expulsão, silêncio, aviso
- **Sistema de Auto-Moderação** com regras customizáveis
  - Proteção anti-spam com penalidades progressivas
  - Filtros anti-links, anti-convites, anti-palavras proibidas
  - Proteção contra contas novas
  - Sistema de penalidades flexível (aviso, silêncio, expulsão, banimento)
- **Sistema de avisos** com armazenamento persistente e rastreamento de histórico
- **Dashboard de moderação** com estatísticas em tempo real e configuração
- **Gerenciamento de canais** com bloqueio/desbloqueio e modo lento
- **Exclusão em massa** de mensagens com comando purge

### 🎵 **Sistema de Música Profissional**
- **Reprodução de música** de alta qualidade via Lavalink
- **Suporte a múltiplas fontes**:
  - YouTube
  - Spotify
  - SoundCloud
  - Integração customizada com yt-dlp
- **Gerenciamento avançado de fila**
  - Reproduzir, pular, parar, pausar, continuar
  - Embaralhamento e repetição de fila (música/fila/nenhuma)
  - Funcionalidade de salto no tempo (seek)
  - Visualização e gerenciamento de fila
- **Controles de música via botões** para melhor UX
- **Exibição de letras** com múltiplos fallbacks de API (incluindo Vagalume)
- **Estatísticas de música** com cache para performance
- **Múltiplos nós Lavalink** com failover automático

### 🎫 **Sistema de Tickets**
- **Gerenciamento completo do ciclo de vida** de tickets
- **Painel de dashboard** para criação e configuração
- **Estatísticas de tickets** e rastreamento de histórico
- **Suporte a organização** por categorias
- **Templates automatizados** para mensagens e logs
- **Integração com webhooks** para notificações

### 🤖 **Automação & Utilitários**
- **Comandos de informações de usuário** (perfil, avatar, info do servidor)
- **Ferramentas de gerenciamento** de servidor
- **Comandos divertidos** e jogos
- **Comandos de configuração** específicos do servidor
- **Sistema de ajuda** com categorias de comando
- **Filtragem de mensagens** com categorias

### 📊 **Dashboard Web**
- **Autenticação Discord OAuth2** para login seguro
- **Interface de gerenciamento** de servidor
- **Estatísticas em tempo real** e status
- **Configuração de settings** do bot
- **Controle de fila de música** pela web
- **Gerenciamento de comandos** e funcionalidades
- **Design responsivo** com Bootstrap 5
- **Componentes de UI modernos** e sistema de alertas

### 🔒 **Recursos de Segurança**
- **Controle de acesso baseado em papéis** (RBAC)
- **Validação de webhooks** e integração segura
- **Sanitização e validação** de entrada
- **Queries de segurança estendidas** para Node.js
- **Gerenciamento de segredos** via variáveis de ambiente
- **Logging de auditoria** com rastreamento detalhado de ações

## 🛠 Stack Tecnológico

| Componente | Tecnologia | Versão |
|-----------|-----------|---------|
| **Runtime** | Node.js | >= 20.11.1 |
| **Biblioteca Discord** | discord.js | v14 |
| **Sistema de Música** | Lavalink Client | v2.9.7 |
| **Framework Web** | Express | v5.2.1 |
| **Motor de Templates** | EJS | v5.0.1 |
| **Banco de Dados** | MongoDB + Mongoose | v9.2.1 |
| **Armazenamento de Sessão** | express-session | v1.19.0 |
| **Autenticação** | Passport (Discord) | v0.7.0 |
| **Segurança** | Helmet | v8.0.0 |
| **Processamento de Áudio** | libsodium-wrappers | v0.8.2 |
| **Fontes de Mídia** | play-dl, youtubei.js, yt-dlp | Mais recente |

## 📦 Instalação

### Pré-requisitos
- Node.js >= 20.11.1
- npm ou yarn
- MongoDB (local ou Atlas)
- Discord Bot Token
- (Opcional) Credenciais de API Spotify
- (Opcional) Servidor Lavalink para música

### Clonar & Instalar

```bash
# Clonar o repositório
git clone https://github.com/Programador-jr/King.git
cd King

# Instalar dependências
npm install

# Copiar template de ambiente
cp .env.example .env

# Editar .env com suas credenciais
nano .env
```

## ⚙️ Configuração

### Variáveis de Ambiente (`.env`)

```env
# ============================================
# DISCORD BOT
# ============================================
TOKEN=SEU_TOKEN_DO_BOT_AQUI
PREFIX=k

# ============================================
# BANCO DE DADOS
# ============================================
MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/king
DNS_RESULT_ORDER=ipv4first

# ============================================
# INTEGRAÇÃO SPOTIFY (Opcional)
# ============================================
SPOTIFY_API_ENABLED=true
SPOTIFY_CLIENT_ID=SEU_SPOTIFY_CLIENT_ID
SPOTIFY_CLIENT_SECRET=SEU_SPOTIFY_CLIENT_SECRET

# ============================================
# DASHBOARD & OAUTH
# ============================================
DASHBOARD_CLIENT_ID=SEU_DISCORD_CLIENT_ID
DASHBOARD_CLIENT_SECRET=SEU_DISCORD_CLIENT_SECRET
DASHBOARD_DOMAIN=http://localhost:5000
DASHBOARD_CALLBACK=http://localhost:5000/callback
DASHBOARD_SESSION_SECRET=SUA_CHAVE_SECRETA_MUITO_LONGA_E_ALEATORIA_AQUI

# ============================================
# FONTES DE MÚSICA (Opcional)
# ============================================
VAGALUME_API_KEY=SUA_CHAVE_VAGALUME_AQUI
YTDLP_PATH=/caminho/para/yt-dlp

# ============================================
# AMBIENTE
# ============================================
NODE_ENV=production
PORT=5000
```

### Arquivos de Configuração

#### `botconfig/config.json`
Armazena configurações não sensíveis do bot:
```json
{
  "token": "SEU_TOKEN_DO_BOT",
  "prefix": "k",
  "defaultColor": "#2b2d31",
  "errorColor": "#ed4245",
  "successColor": "#57f287"
}
```

#### `botconfig/settings.json`
Configurações estruturais do dashboard:
```json
{
  "antiCrash": true,
  "port": 5000,
  "https": false,
  "domain": "localhost"
}
```

### Configuração do Discord Developer Portal

1. Acesse o [Discord Developer Portal](https://discord.com/developers/applications)
2. Crie uma Nova Aplicação
3. Vá para **OAuth2 > Redirects**
4. Adicione sua URL de callback:
   - Local: `http://localhost:5000/callback`
   - Produção: `https://seudominio.com/callback`
5. Copie **Client ID** e **Client Secret** para `.env`


## 🚀 Como Usar

### Iniciando o Bot

```bash
# Produção
npm start

# Desenvolvimento (com auto-reload)
npm run dev
```

O bot irá:
1. Conectar ao Discord
2. Carregar todos os comandos e eventos
3. Conectar ao Lavalink para música
4. Iniciar o dashboard web em `http://localhost:5000`

### Usando o Dashboard

1. Abra `http://localhost:5000` no seu navegador
2. Clique em "Login com Discord"
3. Autorize a aplicação
4. Acesse as configurações do seu servidor
5. Configure moderação, música e funcionalidades do bot

## 🎮 Comandos

### Comandos de Música (`/music` ou `kmusic`)
- `play` - Reproduzir música do YouTube, Spotify ou SoundCloud
- `skip` - Pular música atual
- `stop` - Parar música e limpar fila
- `pause` - Pausar reprodução
- `resume` - Continuar música pausada
- `queue` - Ver fila atual
- `loop` - Alternar modos de repetição (desligado, música, fila)
- `shuffle` - Embaralhar fila
- `seek` - Pular para tempo específico da música
- `lyrics` - Obter letra da música atual ou especificada

### Comandos de Moderação (`/moderation` ou `kmod`)
- `ban` - Banir usuário do servidor
- `kick` - Remover usuário do servidor
- `mute` - Silenciar usuário (timeout)
- `unmute` - Remover silêncio do usuário
- `warn` - Dar aviso ao usuário
- `unwarn` - Remover aviso específico
- `warnings` - Ver avisos do usuário
- `clearwarnings` - Remover todos os avisos do usuário
- `lock` - Bloquear canal para público
- `unlock` - Desbloquear canal
- `slowmode` - Definir limite de taxa de mensagem do canal
- `purge` - Deletar mensagens em massa

### Comandos de Fila (`/queue` ou `kqueue`)
- `q` / `queue` - Exibir fila atual
- `remove` - Remover música da fila
- `clear` - Limpar fila inteira
- `move` - Mover posição da música na fila

### Comandos de Filtro (`/filter` ou `kfilter`)
- `bassboost` - Ativar reforço de graves
- `nightcore` - Efeito Nightcore
- `vaporwave` - Efeito Vaporwave
- `clear` - Remover todos os filtros

### Comandos de Ticket (`/ticket` ou `kticket`)
- `create` - Criar ticket de suporte
- `close` - Fechar ticket ativo
- `add` - Adicionar usuário ao ticket
- `remove` - Remover usuário do ticket
- `settings` - Configurar sistema de tickets

### Comandos Utilitários (`/utility` ou `kutility`)
- `help` - Mostrar informações de ajuda
- `botinfo` - Estatísticas e informações do bot
- `serverinfo` - Informações do servidor
- `userinfo` - Informações de perfil do usuário
- `avatar` - Obter avatar do usuário

### Comandos de Configuração (`/config` ou `kconfig`)
- `automod` - Configurar auto-moderação
- `prefix` - Alterar prefixo de comando
- `settings` - Gerenciar configurações do servidor

## 📊 Funcionalidades do Dashboard

### Autenticação
- Login seguro com Discord OAuth2
- Gerenciamento de sessão com express-session
- Controle de acesso baseado em papéis

### Páginas

1. **Home** - Visão geral e estatísticas rápidas
2. **Configurações do Servidor** - Configurar comportamento do bot
3. **Moderação** - Configurar regras de AutoMod e avisos
4. **Música** - Controles de fila e gerenciamento de filtros
5. **Tickets** - Criar e gerenciar painéis de tickets
6. **Logs** - Ver histórico de ações e trilha de auditoria

## 🔐 Segurança

### Melhores Práticas

1. **Nunca comitar arquivo `.env`** - Contém credenciais sensíveis
2. **Rotacionar tokens regularmente** - Se exposto, regenerar imediatamente
3. **Usar segredos fortes** - Para `DASHBOARD_SESSION_SECRET`
4. **Autenticação MongoDB** - Usar senhas fortes e whitelist de IP
5. **HTTPS em produção** - Sempre usar SSL/TLS
6. **Helmet ativado** - Middleware de headers de segurança
7. **Validação de entrada** - Todas as entradas de usuário sanitizadas
8. **Sistema RBAC** - Gerenciamento granular de permissões

### Segurança de Ambiente
- Todos os segredos em `.env` (nunca no código)
- Credenciais diferentes por ambiente
- Validação de URL de webhook
- Sistema de bypass baseado em papéis para AutoMod

## 🐛 Resolução de Problemas

### Bot não inicia
```bash
# Verificar versão do Node
node --version  # Deve ser >= 20.11.1

# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install

# Verificar variáveis de ambiente
cat .env
```

### Erros de conexão com banco de dados
```bash
# Verificar URI do MongoDB
# Verificar: whitelist de IP no MongoDB Atlas
# Verificar: conectividade de rede
# Tentar: DNS_RESULT_ORDER=ipv4first no .env
```

### Música não toca
```bash
# Verificar se servidor Lavalink está rodando
# Verificar: bot tem permissões de voz
# Verificar: usuário está em canal de voz
# Logs: Verificar console por erros de Lavalink
```

### Dashboard não carrega
```bash
# Verificar: servidor dashboard rodando na PORTA 5000
# Verificar: credenciais OAuth corretas
# Verificar: URL de callback corresponde às configurações do Discord
# Logs: Verificar console por erros de Express
```

## 📖 Documentação

- [Documentação Discord.js](https://discord.js.org)
- [Documentação Lavalink](https://lavalink.dev)
- [Guia Express.js](https://expressjs.com)
- [Documentação MongoDB](https://docs.mongodb.com)

## 🤝 Contribuindo

Contribuições são bem-vindas! Siga estes passos:

1. Faça Fork do repositório
2. Crie um branch para sua feature (`git checkout -b feature/minha-feature`)
3. Faça commit de suas mudanças (`git commit -m 'Adicionar minha feature'`)
4. Faça Push para o branch (`git push origin feature/minha-feature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto é licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 💬 Suporte

- **Issues** - Abra uma [issue](https://github.com/Programador-jr/King/issues) no GitHub
- **Discussões** - Participe de nossas [GitHub Discussions](https://github.com/Programador-jr/King/discussions)
- **Discord** - Verifique nosso [canal de suporte](https://discord.gg/NypBbRgBJ3)

## 🌟 Mostre seu Apoio

Dê uma ⭐ neste projeto se o ajudou! Significa muito.
