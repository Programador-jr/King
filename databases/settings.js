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
  confessionChannel: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("GuildSettings", guildSettingsSchema, "guild_settings");
