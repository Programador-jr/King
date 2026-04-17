const mongoose = require("mongoose");

const userCoinsSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  guildId: {
    type: String,
    required: true
  },
  coins: {
    type: Number,
    default: 0
  },
  lastDaily: {
    type: Date,
    default: null
  },
  totalEarned: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

userCoinsSchema.index({ userId: 1, guildId: 1 }, { unique: true });
userCoinsSchema.index({ guildId: 1, coins: -1 });

userCoinsSchema.statics.findOneOrCreate = async function(userId, guildId) {
  let user = await this.findOne({ userId, guildId });
  if (!user) {
    user = await this.create({ userId, guildId, coins: 0 });
  }
  return user;
};

module.exports = mongoose.model("UserCoins", userCoinsSchema, "user_coins");
