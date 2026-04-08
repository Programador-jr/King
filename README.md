# 👑 King Bot

[English](README.md) | [Português](README-pt.md)

A powerful, feature-rich Discord bot with advanced moderation, music streaming, automated systems, and a comprehensive web dashboard.

![Discord.js](https://img.shields.io/badge/discord.js-v14-blue?style=flat-square&logo=discord)
![Node.js](https://img.shields.io/badge/Node.js-v24.13.0-green?style=flat-square&logo=node.js)
![License](https://img.shields.io/badge/license-MIT-yellow?style=flat-square)
![Version](https://img.shields.io/badge/version-6.0.0-orange?style=flat-square)

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [Commands](#-commands)
- [Dashboard](#-dashboard)
- [Security](#-security)
- [Contributing](#-contributing)
- [Support](#-support)

## ✨ Features

### 🛡️ **Advanced Moderation System**
- **Complete moderation suite** with ban, kick, mute, warn commands
- **Auto-Moderation system** with customizable rules
  - Anti-spam protection with progressive penalties
  - Anti-links, anti-invites, anti-banned words filters
  - Anti-new accounts protection
  - Flexible penalty system (warn, mute, kick, ban)
- **Warning system** with persistent storage and history tracking
- **Moderation dashboard** with real-time statistics and configuration
- **Channel management** with lock/unlock and slowmode controls
- **Bulk message deletion** with purge command

### 🎵 **Professional Music System**
- **High-quality music playback** via Lavalink
- **Multiple sources support**:
  - YouTube
  - Spotify
  - SoundCloud
  - Custom yt-dlp integration
- **Advanced queue management**
  - Play, skip, stop, pause, resume
  - Queue shuffle and loop (song/queue/none)
  - Song seek functionality
  - Queue visualization and management
- **Music controls via buttons** for better UX
- **Lyrics display** with multiple API fallbacks (including Vagalume)
- **Song statistics** with caching for performance
- **Multiple Lavalink nodes** with automatic failover

### 🎫 **Ticket System**
- **Complete ticket lifecycle** management
- **Dashboard panel** for creation and configuration
- **Ticket statistics** and history tracking
- **Category organization** support
- **Automated templates** for messages and logging
- **Webhook integration** for notifications

### 🤖 **Automation & Utilities**
- **User information** commands (profile, avatar, guild info)
- **Server management** tools
- **Fun commands** and games
- **Configuration commands** for server-specific settings
- **Help system** with command categories
- **Message filtering** with categories

### 📊 **Web Dashboard**
- **Discord OAuth2 authentication** for secure login
- **Server management** interface
- **Real-time statistics** and status
- **Bot settings** configuration
- **Music queue control** from the web
- **Command and feature management**
- **Responsive design** with Bootstrap 5
- **Modern UI components** and alerts system

### 🔒 **Security Features**
- **Role-based access control** (RBAC)
- **Webhook validation** and secure integration
- **Input sanitization** and validation
- **Extended security queries** for Node.js
- **Secret management** via environment variables
- **Audit logging** with detailed action tracking

## 🛠 Tech Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| **Runtime** | Node.js | >= 20.11.1 |
| **Discord Library** | discord.js | v14 |
| **Music System** | Lavalink Client | v2.9.7 |
| **Web Framework** | Express | v5.2.1 |
| **Template Engine** | EJS | v5.0.1 |
| **Database** | MongoDB + Mongoose | v9.2.1 |
| **Session Store** | express-session | v1.19.0 |
| **Authentication** | Passport (Discord) | v0.7.0 |
| **Security** | Helmet | v8.0.0 |
| **Audio Processing** | libsodium-wrappers | v0.8.2 |
| **Media Sources** | play-dl, youtubei.js, yt-dlp | Latest |

## 📦 Installation

### Prerequisites
- Node.js >= 20.11.1
- npm or yarn
- MongoDB (local or Atlas)
- Discord Bot Token
- (Optional) Spotify API credentials
- (Optional) Lavalink server for music

### Clone & Install

```bash
# Clone the repository
git clone https://github.com/Programador-jr/King.git
cd King

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
nano .env
```

## ⚙️ Configuration

### Environment Variables (`.env`)

```env
# ============================================
# DISCORD BOT
# ============================================
TOKEN=YOUR_BOT_TOKEN_HERE
PREFIX=k

# ============================================
# DATABASE
# ============================================
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/king
DNS_RESULT_ORDER=ipv4first

# ============================================
# SPOTIFY INTEGRATION (Optional)
# ============================================
SPOTIFY_API_ENABLED=true
SPOTIFY_CLIENT_ID=YOUR_SPOTIFY_CLIENT_ID
SPOTIFY_CLIENT_SECRET=YOUR_SPOTIFY_CLIENT_SECRET

# ============================================
# DASHBOARD & OAUTH
# ============================================
DASHBOARD_CLIENT_ID=YOUR_DISCORD_CLIENT_ID
DASHBOARD_CLIENT_SECRET=YOUR_DISCORD_CLIENT_SECRET
DASHBOARD_DOMAIN=http://localhost:5000
DASHBOARD_CALLBACK=http://localhost:5000/callback
DASHBOARD_SESSION_SECRET=YOUR_VERY_LONG_RANDOM_SECRET_KEY_HERE

# ============================================
# MUSIC SOURCES (Optional)
# ============================================
VAGALUME_API_KEY=YOUR_VAGALUME_KEY_HERE
YTDLP_PATH=/path/to/yt-dlp

# ============================================
# ENVIRONMENT
# ============================================
NODE_ENV=production
PORT=5000
```

### Configuration Files

#### `botconfig/config.json`
Stores non-sensitive bot settings:
```json
{
  "token": "YOUR_BOT_TOKEN",
  "prefix": "k",
  "defaultColor": "#2b2d31",
  "errorColor": "#ed4245",
  "successColor": "#57f287"
}
```

#### `botconfig/settings.json`
Dashboard structural settings:
```json
{
  "antiCrash": true,
  "port": 5000,
  "https": false,
  "domain": "localhost"
}
```

### Discord Developer Portal Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a New Application
3. Go to **OAuth2 > Redirects**
4. Add your callback URL:
   - Local: `http://localhost:5000/callback`
   - Production: `https://yourdomain.com/callback`
5. Copy **Client ID** and **Client Secret** to `.env`

## 🚀 Usage

### Starting the Bot

```bash
# Production
npm start

# Development (with auto-reload)
npm run dev
```

The bot will:
1. Connect to Discord
2. Load all commands and events
3. Connect to Lavalink for music
4. Start the web dashboard on `http://localhost:5000`

### Using the Dashboard

1. Open `http://localhost:5000` in your browser
2. Click "Login with Discord"
3. Authorize the application
4. Access your server's settings
5. Configure moderation, music, and bot features

## 🎮 Commands

### Music Commands (`/music` or `kmusic`)
- `play` - Play a song from YouTube, Spotify, or SoundCloud
- `skip` - Skip current song
- `stop` - Stop music and clear queue
- `pause` - Pause current playback
- `resume` - Resume paused song
- `queue` - View current queue
- `loop` - Toggle loop modes (off, song, queue)
- `shuffle` - Shuffle queue
- `seek` - Jump to specific time in song
- `lyrics` - Get lyrics for current or specified song

### Moderation Commands (`/moderation` or `kmod`)
- `ban` - Ban a user from server
- `kick` - Remove user from server
- `mute` - Mute a user (timeout)
- `unmute` - Remove mute from user
- `warn` - Issue warning to user
- `unwarn` - Remove specific warning
- `warnings` - View user's warnings
- `clearwarnings` - Remove all user warnings
- `lock` - Lock channel for public
- `unlock` - Unlock channel
- `slowmode` - Set channel message rate limit
- `purge` - Delete bulk messages

### Queue Commands (`/queue` or `kqueue`)
- `q` / `queue` - Display current queue
- `remove` - Remove song from queue
- `clear` - Clear entire queue
- `move` - Move song position in queue

### Filter Commands (`/filter` or `kfilter`)
- `bassboost` - Enable bass boost
- `nightcore` - Nightcore effect
- `vaporwave` - Vaporwave effect
- `clear` - Remove all filters

### Ticket Commands (`/ticket` or `kticket`)
- `create` - Create support ticket
- `close` - Close active ticket
- `add` - Add user to ticket
- `remove` - Remove user from ticket
- `settings` - Configure ticket system

### Utility Commands (`/utility` or `kutility`)
- `help` - Show help information
- `botinfo` - Bot statistics and info
- `serverinfo` - Server information
- `userinfo` - User profile information
- `avatar` - Get user's avatar

### Configuration Commands (`/config` or `kconfig`)
- `automod` - Configure auto-moderation
- `prefix` - Change command prefix
- `settings` - Manage server settings

## 📊 Dashboard Features

### Authentication
- Secure Discord OAuth2 login
- Session management with express-session
- Role-based access control

### Pages

1. **Home** - Overview and quick stats
2. **Server Settings** - Configure bot behavior
3. **Moderation** - Set up AutoMod rules and warnings
4. **Music** - Queue controls and filter management
5. **Tickets** - Create and manage ticket panels
6. **Logs** - View action history and audit trail

## 🔐 Security

### Best Practices

1. **Never commit `.env` file** - It contains sensitive credentials
2. **Rotate tokens regularly** - If exposed, regenerate immediately
3. **Use strong secrets** - For `DASHBOARD_SESSION_SECRET`
4. **MongoDB authentication** - Use strong passwords and IP whitelist
5. **HTTPS in production** - Always use SSL/TLS
6. **Helmet enabled** - Security headers middleware active
7. **Input validation** - All user inputs are sanitized
8. **RBAC system** - Granular permission management

### Environment Security
- All secrets in `.env` (never in code)
- Different credentials per environment
- Webhook URL validation
- Role-based bypass system for AutoMod

## 🐛 Troubleshooting

### Bot not starting
```bash
# Check Node version
node --version  # Should be >= 20.11.1

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check environment variables
cat .env
```

### Database connection errors
```bash
# Verify MongoDB URI
# Check: IP whitelist in MongoDB Atlas
# Check: Network connectivity
# Try: DNS_RESULT_ORDER=ipv4first in .env
```

### Music not playing
```bash
# Verify Lavalink server is running
# Check: Bot has voice permissions
# Check: User is in voice channel
# Logs: Check console for Lavalink errors
```

### Dashboard not loading
```bash
# Check: Dashboard server is running on PORT 5000
# Check: OAuth credentials are correct
# Check: Callback URL matches Discord settings
# Logs: Check console for Express errors
```

## 📖 Documentation

- [Discord.js Documentation](https://discord.js.org)
- [Lavalink Documentation](https://lavalink.dev)
- [Express.js Guide](https://expressjs.com)
- [MongoDB Documentation](https://docs.mongodb.com)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 💬 Support

- **Issues** - Open an [issue](https://github.com/Programador-jr/King/issues) on GitHub
- **Discussions** - Join our [GitHub Discussions](https://github.com/Programador-jr/King/discussions)
- **Discord** - Check our [support channel](https://discord.gg/NypBbRgBJ3)

## 🌟 Show Your Support

Give this project a ⭐ if it helped you! It means a lot.