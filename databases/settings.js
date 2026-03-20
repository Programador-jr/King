const mongoose = require("mongoose");

const guildSettingsSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  prefix: {
    type: String,
    default: "!"
  },
  defaultvolume: {
    type: Number,
    default: 50
  },
  defaultautoplay: {
    type: Boolean,
    default: false
  },
  defaultfilters: [{
    type: String
  }],
  djroles: [{
    type: String
  }],
  botchannel: [{
    type: String
  }],
  musicChannels: [{
    type: String
  }],
  mixDefault: {
    type: String,
    enum: ["spotify", "youtube"],
    default: "youtube"
  },
  confessionChannel: {
    type: String,
    default: null
  },
  ticketCategory: {
    type: String,
    default: null
  },
  ticketRoles: [{
    type: String
  }],
  ticketWebhook: {
    type: String,
    default: null
  },
  ticketPanelChannelId: {
    type: String,
    default: null
  },
  ticketPanelMessageId: {
    type: String,
    default: null
  },
  ticketPanels: {
    type: Array,
    default: []
  },
  ticketCount: {
    type: Number,
    default: 0
  },
  openTickets: [{
    type: Number
  }],
  closedTickets: [{
    type: Number
  }],
  tickets: {
    type: Map,
    of: Object,
    default: {}
  },
  ticketHistory: {
    type: Array,
    default: []
  },
  ticketLogOpenEnabled: {
    type: Boolean,
    default: false
  },
  ticketLogCloseEnabled: {
    type: Boolean,
    default: false
  },
  ticketLogOpenType: {
    type: String,
    enum: ["webhook", "channel"],
    default: "channel"
  },
  ticketLogCloseType: {
    type: String,
    enum: ["webhook", "channel"],
    default: "channel"
  },
  ticketLogOpenChannel: {
    type: String,
    default: null
  },
  ticketLogCloseChannel: {
    type: String,
    default: null
  },
  ticketLogOpenWebhook: {
    type: String,
    default: null
  },
  ticketLogCloseWebhook: {
    type: String,
    default: null
  },
  ticketLogOpenMessage: {
    type: String,
    default: null
  },
  ticketLogCloseMessage: {
    type: String,
    default: null
  },
  ticketWelcomeEmbed: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  ticketCloseEmbed: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },

  // ========================
  // AUTOMOD SETTINGS
  // ========================
  automodEnabled: {
    type: Boolean,
    default: false
  },
  automodLogChannelId: {
    type: String,
    default: null
  },
  automodLogWebhook: {
    type: String,
    default: null
  },
  automodLogType: {
    type: String,
    enum: ["channel", "webhook"],
    default: "channel"
  },
  automodLogMessage: {
    type: String,
    default: '{user} | {type} | {reason}'
  },
  automodBypassRoles: [{
    type: String
  }],
  automodMuteRole: {
    type: String,
    default: null
  },
  automodPenalty1: {
    type: String,
    enum: ["none", "warn", "mute", "kick", "ban"],
    default: "none"
  },
  automodPenalty2: {
    type: String,
    enum: ["none", "warn", "mute", "kick", "ban"],
    default: "mute"
  },
  automodPenalty3: {
    type: String,
    enum: ["none", "warn", "mute", "kick", "ban"],
    default: "kick"
  },

  // Anti-Spam
  automodAntiSpamEnabled: {
    type: Boolean,
    default: false
  },
  automodAntiSpamMaxMessages: {
    type: Number,
    default: 5
  },
  automodAntiSpamMaxSeconds: {
    type: Number,
    default: 3
  },

  // Anti-Links
  automodAntiLinksEnabled: {
    type: Boolean,
    default: false
  },

  // Anti-Invite
  automodAntiInviteEnabled: {
    type: Boolean,
    default: false
  },

  // Anti-Words
  automodAntiWordsEnabled: {
    type: Boolean,
    default: false
  },
  automodAntiWordsList: [{
    type: String
  }],
  automodAntiWordsWarnMessage: {
    type: String,
    default: "Você usou palavras proibidas neste servidor."
  },

  // Anti-NewAccounts
  automodAntiNewAccountsEnabled: {
    type: Boolean,
    default: false
  },
  automodAntiNewAccountsMinDays: {
    type: Number,
    default: 1
  },

  // Infractions storage (userId -> { count, lastWarning })
  automodInfractions: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // Log message template
  automodLogMessage: {
    type: String,
    default: '{user} | {type} | {reason}'
  },

  // Global penalties
  automodMuteRole: {
    type: String,
    default: null
  },
  automodPenalty1: {
    type: String,
    enum: ["none", "warn", "mute", "kick", "ban"],
    default: "none"
  },
  automodPenalty2: {
    type: String,
    enum: ["none", "warn", "mute", "kick", "ban"],
    default: "mute"
  },
  automodPenalty3: {
    type: String,
    enum: ["none", "warn", "mute", "kick", "ban"],
    default: "kick"
  }
}, {
  timestamps: true,
  strict: false
});

module.exports = mongoose.model("GuildSettings", guildSettingsSchema, "guild_settings");
