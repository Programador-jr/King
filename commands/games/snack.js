const SnakeGame = require('snakecord');
const Discord = require("discord.js");

const snakeGame = new SnakeGame({
    title: 'Jogo da Cobra',
    color: "GREEN",
    timestamp: true,
    gameOverTitle: "Game Over "
});


module.exports = {
	name: 'snake',
	description: 'none',
  category: "Fun",
  aliases: ["cobra"],
  usage: "snake",
run: async(bot, message, args) => { 
    snakeGame.newGame(message);
  },
};{}