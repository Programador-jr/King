const config = require("../../config.json")
const { prefix } = require('../../config.json');
const emojis = ["👍", "👎", "❔", "🤔", "🙄", "❌"];
const isPlaying = new Set();
const { Client, MessageEmbed } = require("discord.js");
const { Aki } = require("aki-api");

module.exports = {
  name: 'aki',
  category: 'games',

  run: async (client, message, args) => {
    if (message.author.bot || !message.guild) return;
    
    if (!message.content.startsWith(prefix + "aki")) return;
    
    if (isPlaying.has(message.author.id)) {
      return message.channel.send(":x: | Um jogo já está em andamento..");
    }
    
    isPlaying.add(message.author.id);
    
    const aki = new Aki("pt"); // Lista completa de idiomas em: https://github.com/jgoralcz/aki-api
    
    await aki.start();
    
    const msg = await message.channel.send(new MessageEmbed()
      .setTitle(`${message.author.username}, Questão ${aki.currentStep + 1}`)
      .setColor("#00bfff")
      .setDescription(`**${aki.question}**\n${aki.answers.map((an, i) => `${an} | ${emojis[i]}`).join("\n")}`));
    
    for (const emoji of emojis) await msg.react(emoji);
    
    const collector = msg.createReactionCollector((reaction, user) => emojis.includes(reaction.emoji.name) && user.id == message.author.id, {
      time: 60000 * 6
    });
    
    collector
      .on("end", () => isPlaying.delete(message.author.id))
      .on("collect", async ({
        emoji,
        users
      }) => {
        users.remove(message.author).catch(() => null);
    
        if (emoji.name == "❌") return collector.stop();
    
        await aki.step(emojis.indexOf(emoji.name));
    
        if (aki.progress >= 70 || aki.currentStep >= 78) {
    
          await aki.win();
    
          collector.stop();
    
          message.channel.send(new MessageEmbed()
            .setTitle("Este é o seu personagem?")
            .setDescription(`**${aki.answers[0].name}**\n${aki.answers[0].description}\nRanking**#${aki.answers[0].ranking}**\n\n[sim (**s**) / não (**n**)]`)
            .setImage(aki.answers[0].absolute_picture_path)
            .setColor("#00bfff"));
    
          const filter = m => /(sim|não|s|n)/i.test(m.content) && m.author.id == message.author.id;
    
          message.channel.awaitMessages(filter, {
              max: 1,
              time: 30000,
              errors: ["time"]
            })
            .then(collected => {
              const isWinner = /sim|s/i.test(collected.first().content);
              message.channel.send(new MessageEmbed()
                .setTitle(isWinner ? "Excelente! Acertei mais uma vez" : "Uh. você é o vencedor!")
                .setColor("#00bfff")
                .setDescription("Eu amo brincar com você"));
            }).catch(() => null);
    
        } else {
          msg.edit(new MessageEmbed()
            .setTitle(`${message.author.username}, Questão ${aki.currentStep + 1}`)
            .setColor("#00bfff")
            .setDescription(`**${aki.question}**\n${aki.answers.map((an, i) => `${an} | ${emojis[i]}`).join("\n")}`));
        }
      });
    }
  }