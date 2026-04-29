const mongoose = require("mongoose");

const casinoHistorySchema = new mongoose.Schema({
  guildId: {
    type: String,
    default: null
  },
  channelId: {
    type: String,
    default: null
  },
  userId: {
    type: String,
    required: true
  },
  game: {
    type: String,
    required: true
  },
  bet: {
    type: Number,
    default: 0
  },
  payout: {
    type: Number,
    default: 0
  },
  netChange: {
    type: Number,
    default: 0
  },
  outcome: {
    type: String,
    enum: ["win", "loss", "push", "blocked", "cancelled"],
    default: "loss"
  },
  reason: {
    type: String,
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

casinoHistorySchema.index({ guildId: 1, userId: 1, createdAt: -1 });

module.exports = mongoose.model("CasinoHistory", casinoHistorySchema, "casino_history");
