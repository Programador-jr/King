const Discord = require("discord.js");
require("./handlers/discordCompat");
require("dotenv").config();
const config = require(`./botconfig/config.json`);
const settings = require(`./botconfig/settings.json`);
const filters = require(`./botconfig/filters.json`);
const colors = require("colors");
const Enmap = require("enmap").default;
const libsodium = require("libsodium-wrappers");
const ffmpeg = require("ffmpeg-static");
const voice = require("@discordjs/voice");
const DisTube = require("distube").default;
const { GatewayIntentBits, Partials } = Discord;
const { CustomYtDlpPlugin } = require("./handlers/customYtDlp");
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
      activities: [{
        name: `${config.prefix}help`,
        type: Discord.ActivityType.Watching,
      }],
      status: "online",
    },
});

const { SpotifyPlugin } = require("@distube/spotify");
const { SoundCloudPlugin } = require("@distube/soundcloud");
const { request } = require("http");
const spotifyEnabled = String(process.env.SPOTIFY_API_ENABLED);
const spotifyClientId = process.env.SPOTIFY_CLIENT_ID;
const spotifyClientSecret = process.env.SPOTIFY_CLIENT_SECRET;

let spotifyoptions = {}
if (spotifyEnabled && spotifyClientId && spotifyClientSecret) {
  spotifyoptions.api = {
    clientId: spotifyClientId,
    clientSecret: spotifyClientSecret,
  }
}
client.distube = new DisTube(client, {
  emitNewSongOnly: false,
  savePreviousSongs: true,
  emitAddSongWhenCreatingQueue: false,
  ffmpeg: {
    path: ffmpeg,
  },
  customFilters: filters,
  plugins: [
    new SpotifyPlugin(spotifyoptions),
    new SoundCloudPlugin(),
    new CustomYtDlpPlugin()
  ]
})

//Define some Global Collections
client.commands = new Discord.Collection();
client.cooldowns = new Discord.Collection();
client.slashCommands = new Discord.Collection();
client.aliases = new Discord.Collection();
client.categories = require("fs").readdirSync(`./commands`);
client.allEmojis = require("./botconfig/emojis.json");

client.setMaxListeners(100); require('events').defaultMaxListeners = 100;

client.settings = new Enmap({ name: "settings",dataDir: "./databases/settings"});
client.infos = new Enmap({ name: "infos", dataDir: "./databases/infos"});


//Require the Handlers                  Add the antiCrash file too, if its enabled
["events", "commands", "slashCommands", settings.antiCrash ? "antiCrash" : null, "distubeEvent"]
    .filter(Boolean)
    .forEach(h => {
        require(`./handlers/${h}`)(client);
    })|| config.token
//Start the Bot
client.login(process.env.token || process.env.TOKEN || config.token)
client.on("clientReady", () => {
  require("./dashboard/index.js")(client);
})
