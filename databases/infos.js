const mongoose = require("mongoose");

const guildStatsSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  songsPlayed: {
    type: Number,
    default: 0
  },
  commandsUsed: {
    type: Number,
    default: 0
  },
  totalMusicTime: {
    type: Number,
    default: 0
  },
  usersJoined: {
    type: Number,
    default: 0
  },
  topCommands: {
    type: Map,
    of: Number,
    default: {}
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("GuildStats", guildStatsSchema, "guild_stats");
