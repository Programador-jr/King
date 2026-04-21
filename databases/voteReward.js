const mongoose = require("mongoose");

const voteRewardSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: false
  },
  votedAt: {
    type: Date,
    required: true
  },
  isWeekend: {
    type: Boolean,
    default: false
  },
  rewardGiven: {
    type: Number,
    default: 500
  },
  botId: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

voteRewardSchema.index({ userId: 1, votedAt: -1 });

module.exports = mongoose.model("VoteReward", voteRewardSchema, "vote_rewards");