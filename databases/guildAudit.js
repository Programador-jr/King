const mongoose = require("mongoose");

const guildAuditSchema = new mongoose.Schema({
  guildId: {
    type: String,
    required: true
  },
  guildName: {
    type: String,
    required: true
  },
  ownerId: {
    type: String,
    default: null
  },
  ownerTag: {
    type: String,
    default: null
  },
  memberCount: {
    type: Number,
    default: 0
  },
  action: {
    type: String,
    enum: ["join", "leave"],
    required: true
  }
}, {
  timestamps: true
});

guildAuditSchema.index({ createdAt: -1 });
guildAuditSchema.index({ guildId: 1, createdAt: -1 });

module.exports = mongoose.model("GuildAudit", guildAuditSchema, "guild_audit");
