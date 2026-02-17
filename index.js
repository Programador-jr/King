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
    ]
});
const { SpotifyPlugin } = require("@distube/spotify");
const { SoundCloudPlugin } = require("@distube/soundcloud");
const spotifyEnabled = String(process.env.SPOTIFY_API_ENABLED);
const spotifyClientId = process.env.SPOTIFY_CLIENT_ID;
const spotifyClientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const soundcloudClientId = process.env.SOUNDCLOUD_CLIENT_ID;
const soundcloudSecret = process.env.SOUNDCLOUD_CLIENT_SECRET || process.env.SOUNDCLOUD_OAUTH_TOKEN;
const soundcloudUseEnvAuth = /^(1|true|yes)$/i.test(String(process.env.SOUNDCLOUD_USE_ENV_AUTH));

let spotifyoptions = {}
if (spotifyEnabled && spotifyClientId && spotifyClientSecret) {
  spotifyoptions.api = {
    clientId: spotifyClientId,
    clientSecret: spotifyClientSecret,
  }
}

let soundcloudOptions = {};
if (soundcloudUseEnvAuth && soundcloudClientId) {
  soundcloudOptions.clientId = soundcloudClientId;
  if (soundcloudSecret) soundcloudOptions.oauthToken = soundcloudSecret;
}

client.distube = new DisTube(client, {
  emitNewSongOnly: false,
  savePreviousSongs: true,
  emitAddSongWhenCreatingQueue: false,
  //emitAddListWhenCreatingQueue: false,
  nsfw: true, //Set it to false if u want to disable nsfw songs
  ffmpeg: {
    path: ffmpeg,
  },
  customFilters: filters,
  plugins: [
    new SpotifyPlugin(spotifyoptions),
    Object.keys(soundcloudOptions).length > 0 ? new SoundCloudPlugin(soundcloudOptions) : new SoundCloudPlugin()
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
