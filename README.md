# King Bot

[English](README.md) | [Português](README-pt.md)

Discord bot focused on music, utilities, games, and a web dashboard.

## Stack

- Node.js `>= 20.11.1`
- Discord.js `v14`
- DisTube `v5` (Spotify/SoundCloud/custom yt-dlp)
- Express + EJS (dashboard)
- Enmap (persistent settings)

## Features

- Music player with queue, loop, shuffle, seek, and button controls
- Lyrics with API fallback (including Vagalume)
- Commands grouped by category:
  - `Configuracoes`
  - `Diversao`
  - `Fila`
  - `Filtro`
  - `Info`
  - `Jogos`
  - `Musica`
  - `Utilidade`
- Dashboard with Discord OAuth2 login and queue controls

## Installation

```bash
npm install
```

## Environment Variables (`.env`)

Create or edit `.env` in the project root:

```env
# Bot
TOKEN="YOUR_BOT_TOKEN"

# Spotify (optional, recommended for Spotify links)
SPOTIFY_API_ENABLED="true"
SPOTIFY_CLIENT_ID="YOUR_SPOTIFY_CLIENT_ID"
SPOTIFY_CLIENT_SECRET="YOUR_SPOTIFY_CLIENT_SECRET"

# Dashboard OAuth (required for panel login)
DASHBOARD_CLIENT_ID="YOUR_DISCORD_CLIENT_ID"
DASHBOARD_CLIENT_SECRET="YOUR_DISCORD_CLIENT_SECRET"
DASHBOARD_DOMAIN="http://localhost:5000"
DASHBOARD_CALLBACK="http://localhost:5000/callback"
DASHBOARD_SESSION_SECRET="A_LONG_RANDOM_SECRET"

# Lyrics (optional)
VAGALUME_API_KEY=""

# Custom yt-dlp path (optional)
YTDLP_PATH=""
```

## Config Files

- `botconfig/config.json`
  - Keep only non-sensitive settings (prefix, colors, etc.).
- `dashboard/settings.json`
  - Keep dashboard structural settings (http/https/port).
  - OAuth credentials should stay in `.env`.

## Discord Developer Portal (Dashboard)

In your Discord application, set this in **OAuth2 > Redirects**:

- `http://localhost:5000/callback` (local)
- or your production callback URL

This must match `DASHBOARD_CALLBACK`.

## Run

```bash
npm start
```

For development:

```bash
npm run dev
```

## Dashboard

When the bot starts, the dashboard starts too.

- Default local URL: `http://localhost:5000`

## Security

- Rotate tokens/secrets if exposed
- Keep `TOKEN` and secrets only in environment variables
