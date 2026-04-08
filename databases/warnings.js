const mongoose = require("mongoose");

const warningSchema = new mongoose.Schema({
  guildId: {
    type: String,
    index: true,
    required: true
  },
  userId: {
    type: String,
    index: true,
    required: true
  },
  warnings: [
    {
      id: {
        type: String,
        required: true
      },
      reason: {
        type: String,
        default: "Sem motivo informado"
      },
      moderatorId: {
        type: String,
        required: true
      },
      moderatorTag: {
        type: String,
        required: true
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }
  ]
}, {
  timestamps: true
});

warningSchema.index({ guildId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model("Warnings", warningSchema, "guild_warnings");
