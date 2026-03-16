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
  }
}, {
  timestamps: true,
  strict: false
});

module.exports = mongoose.model("GuildSettings", guildSettingsSchema, "guild_settings");
