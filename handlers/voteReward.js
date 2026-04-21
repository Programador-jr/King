const Discord = require("discord.js");
const VoteReward = require("../databases/voteReward");
const UserCoins = require("../databases/kingcoin");
const ee = require("../botconfig/embed.json");
const emojis = require("../botconfig/emojis.json");

const VOTE_COOLDOWN_MS = 12 * 60 * 60 * 1000;
const BASE_REWARD = parseInt(process.env.TOPGG_VOTE_REWARD) || 500;
const LOG_CHANNEL_ID = process.env.TOPGG_VOTE_LOG_CHANNEL_ID;

async function handleVote(vote) {
  console.log("[VoteReward] Payload completo recebido:", JSON.stringify(vote, null, 2));

  const { user, bot, isWeekend } = vote;

  if (!user) {
    console.log("[VoteReward] ERRO: vote.user está undefd. Vote payload:", vote);
    return { success: false, reason: "invalid_payload", error: "user_undefmed" };
  }

  const userId = String(user);
  const botId = String(bot || "");

  console.log(`[VoteReward] Processando voto - userId: ${userId}, botId: ${botId}, isWeekend: ${isWeekend}`);

  const lastVote = await VoteReward.findOne({ userId }).sort({ votedAt: -1 });

  if (lastVote) {
    const timeSinceLastVote = Date.now() - new Date(lastVote.votedAt).getTime();
    if (timeSinceLastVote < VOTE_COOLDOWN_MS) {
      const remainingHours = Math.ceil((VOTE_COOLDOWN_MS - timeSinceLastVote) / (1000 * 60 * 60));
      console.log(`[VoteReward] Usuário ${userId} votou muito cedo. Faltam ${remainingHours}h`);
      return { success: false, reason: "cooldown", remainingHours };
    }
  }

  const rewardAmount = isWeekend ? BASE_REWARD * 2 : BASE_REWARD;
  const weekendBonus = isWeekend ? BASE_REWARD : 0;

  await VoteReward.create({
    userId,
    votedAt: new Date(),
    isWeekend: isWeekend || false,
    rewardGiven: rewardAmount,
    botId
  });

  const userData = await UserCoins.findOneOrCreate(userId);
  userData.coins += rewardAmount;
  userData.totalEarned += rewardAmount;
  await userData.save();

  console.log(`[VoteReward] Usuário ${userId} recebeu ${rewardAmount} King Coins! (isWeekend: ${isWeekend})`);

  return { 
    success: true, 
    reward: rewardAmount, 
    weekendBonus,
    isWeekend,
    userId,
    botId 
  };
}

async function sendVoteLog(client, voteResult) {
  try {
    const channel = await client.channels.fetch(LOG_CHANNEL_ID);
    if (!channel) {
      console.log(`[VoteLog] Canal ${LOG_CHANNEL_ID} não encontrado!`);
      return;
    }

    const discordUser = await client.users.fetch(voteResult.userId).catch(() => null);
    const username = discordUser ? discordUser.tag : `Desconhecido (${voteResult.userId})`;

    const embed = new Discord.MessageEmbed()
      .setColor(ee.color)
      .setTitle("🗳️ Novo Voto!")
      .addField("Usuário", `${username}`, true)
      .addField("Recompensa", `**${voteResult.reward}** ${emojis.King_Coin}`, true)
      .addField("Bônus Weekend", voteResult.isWeekend ? `✅ +${voteResult.weekendBonus} KC` : "❌ Não", true)
      .setTimestamp();

    await channel.send({ embeds: [embed] });
    console.log(`[VoteLog] Log enviado para o canal ${LOG_CHANNEL_ID}`);
  } catch (error) {
    console.error(`[VoteLog] Erro ao enviar log:`, error.message);
  }
}

async function getUserVoteCount(userId) {
  const count = await VoteReward.countDocuments({ userId });
  return count;
}

async function getLastVote(userId) {
  const vote = await VoteReward.findOne({ userId }).sort({ votedAt: -1 });
  return vote;
}

module.exports = {
  handleVote,
  sendVoteLog,
  getUserVoteCount,
  getLastVote,
  BASE_REWARD,
  VOTE_COOLDOWN_MS
};