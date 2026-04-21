const mongoose = require("mongoose");

const userCoinsSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
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

userCoinsSchema.index({ coins: -1 });

userCoinsSchema.statics.findOneOrCreate = async function(userId) {
  let user = await this.findOne({ userId });
  if (!user) {
    user = await this.create({ userId, coins: 0 });
  }
  return user;
};

module.exports = mongoose.model("UserCoins", userCoinsSchema, "user_coins");