const mongoose = require("mongoose");

const botBanSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  bannedBy: {
    type: String,
    required: true
  },
  reason: {
    type: String,
    default: "Sem motivo informado."
  },
  expiresAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("BotBan", botBanSchema, "bot_bans");
