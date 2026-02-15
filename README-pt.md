# King Bot

[English](README.md) | [Português](README-pt.md)

Bot de Discord com foco em música, utilidades, jogos e painel web (dashboard).

## Stack

- Node.js `>= 20.11.1`
- Discord.js `v14`
- DisTube `v5` (Spotify/SoundCloud/yt-dlp custom)
- Express + EJS (dashboard)
- Enmap (configurações persistentes)

## Funcionalidades

- Player de música com fila, loop, shuffle, seek e controle por botões
- Letras com fallback de APIs (inclui Vagalume)
- Comandos organizados por categorias:
  - `Configurações`
  - `Diversão`
  - `Fila`
  - `Filtro`
  - `Info`
  - `Jogos`
  - `Música`
  - `Utilidade`
- Dashboard com login OAuth2 Discord e controle de fila

## Instalação

```bash
npm install
```

## Configuração (`.env`)

Crie/edite o arquivo `.env` na raiz do projeto.

```env
# Bot
TOKEN="SEU_TOKEN_DO_BOT"

# Spotify (opcional, recomendado para links Spotify)
SPOTIFY_API_ENABLED="true"
SPOTIFY_CLIENT_ID="SEU_SPOTIFY_CLIENT_ID"
SPOTIFY_CLIENT_SECRET="SEU_SPOTIFY_CLIENT_SECRET"

# Dashboard OAuth (obrigatório para login no painel)
DASHBOARD_CLIENT_ID="SEU_DISCORD_CLIENT_ID"
DASHBOARD_CLIENT_SECRET="SEU_DISCORD_CLIENT_SECRET"
DASHBOARD_DOMAIN="http://localhost:5000"
DASHBOARD_CALLBACK="http://localhost:5000/callback"
DASHBOARD_SESSION_SECRET="UMA_CHAVE_LONGA_E_ALEATORIA"

# Letras (opcional)
VAGALUME_API_KEY=""

# yt-dlp custom (opcional, se quiser caminho manual)
YTDLP_PATH=""
```

## Configs por arquivo

- `botconfig/config.json`
  - Mantém apenas configurações não sensíveis (prefixo, cores, etc).
- `dashboard/settings.json`
  - Mantém configurações estruturais do dashboard (porta/http/https).
  - Credenciais OAuth devem ficar no `.env`.

## Discord Developer Portal (Dashboard)

No aplicativo do Discord, configure em **OAuth2 > Redirects**:

- `http://localhost:5000/callback` (ambiente local)
- ou o callback do seu domínio de produção

Esse valor deve ser igual ao `DASHBOARD_CALLBACK`.

## Executar

```bash
npm start
```

Para desenvolvimento:

```bash
npm run dev
```

## Dashboard

Com o bot iniciado, o dashboard sobe junto.

- URL local padrão: `http://localhost:5000`

## Segurança

- Rotacione tokens/chaves se expostos
- Mantenha `clientSecret` e `TOKEN` apenas em variáveis de ambiente
