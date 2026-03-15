const Discord = require("discord.js");
require("./handlers/discordCompat");
require("dotenv").config();
const dns = require("node:dns");
const config = require(`./botconfig/config.json`);
const settings = require(`./botconfig/settings.json`);
const filters = require(`./botconfig/filters.json`);
const colors = require("colors");
const { connectMongoDB, MongoDBEnmap } = require("./databases/mongodb");
const libsodium = require("libsodium-wrappers");
const { GatewayIntentBits, Partials } = Discord;
const client = new Discord.Client({
	restTimeOffset: 0,
    shards: "auto",
    allowedMentions: {
      parse: [ ],
      repliedUser: false,
    },
    partials: [Partials.Message, Partials.Channel, Partials.Reaction],
    intents: [ 
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageTyping,
    ],
    presence: {
      status: "online",
      activities: [{
        name: `${config.prefix}help`,
        type: Discord.ActivityType.Playing
      }]
    },
});

const LavalinkManagerWrapper = require("./handlers/lavalinkClient");
client.lavalink = new LavalinkManagerWrapper(client);

client.distube = {
    getQueue: (guildId) => {
        return client.lavalink.getQueue(guildId);
    },
    play: async (voiceChannel, url, options = {}) => {
        return await client.lavalink.play(voiceChannel, url, options);
    },
    skip: async (guildId) => {
        return await client.lavalink.skip(guildId);
    },
    stop: async (guildId) => {
        return await client.lavalink.stop(guildId);
    },
    pause: async (guildId) => {
        return await client.lavalink.pause(guildId, true);
    },
    resume: async (guildId) => {
        return await client.lavalink.resume(guildId);
    },
    filters: {},
    customFilters: filters,
};

const { request } = require("http");

try {
  const dnsOrder = String(process.env.DNS_RESULT_ORDER || "ipv4first").trim();
  dns.setDefaultResultOrder(dnsOrder);
} catch (err) {
  console.warn("[DNS] Failed to set default result order:", err?.message || err);
}

const spotifyEnabled = String(process.env.SPOTIFY_API_ENABLED);
const spotifyClientId = process.env.SPOTIFY_CLIENT_ID;
const spotifyClientSecret = process.env.SPOTIFY_CLIENT_SECRET;

//Define some Global Collections
client.commands = new Discord.Collection();
client.cooldowns = new Discord.Collection();
client.slashCommands = new Discord.Collection();
client.aliases = new Discord.Collection();
client.categories = require("fs").readdirSync(`./commands`);
client.allEmojis = require("./botconfig/emojis.json");

client.setMaxListeners(100); require('events').defaultMaxListeners = 100;

client.settings = new MongoDBEnmap();

const TicketHandler = require("./handlers/tickets");
client.ticketHandler = new TicketHandler(client);

async function startBot() {
  try {
    await connectMongoDB();
    const cachedGuildSettings = await client.settings.warmCache();
    console.log(`[MongoDBEnmap] ${cachedGuildSettings} servidor(es) com settings em cache`);
    
    client.infos = new MongoDBEnmap();
    
    //Require the Handlers                  Add the antiCrash file too, if its enabled
    [settings.antiCrash !== false ? "antiCrash" : null, "events", "commands", "slashCommands", "lavalinkEvents"]
        .filter(Boolean)
        .forEach(h => {
            require(`./handlers/${h}`)(client);
        })|| config.token
    
    //Start the Bot
    client.login(process.env.token || process.env.TOKEN || config.token);
    
    // Connect to Lavalink after bot is ready
    client.once("clientReady", async () => {
      try {
        await client.lavalink.connect();
        console.log("[Lavalink] Conectado ao servidor Lavalink");
      } catch (error) {
        console.error("[Lavalink] Erro ao conectar:", error);
      }
    });
  } catch (error) {
    console.error("❌ Erro ao iniciar o bot:", error);
    process.exit(1);
  }
}

startBot();
client.on("clientReady", () => {
  require("./dashboard/index.js")(client);
})
