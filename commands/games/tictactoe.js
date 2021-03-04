const Discord = require('discord.js');
const {MessageEmbed} = require("discord.js");
const config = require("../../config.json");

module.exports = {
    name: "tictactoe",
    category:"",
    aliases:["jogodavelha", "velha"],
    description:"Jogue uma partida de jogo da velha",
    run: async (client, message, args) => {
  const mention = message.mentions.members.first();
  const validation = [0, 0, 0, 0, 0, 0, 0, 0, 0];

  if (!mention)
    return message.channel.send(
      "Você deve mencionar um usuário para jogar o Jogo da Velha!"
    );
  if (mention.presence.status === "offline")
    return message.reply(
      "O usuário mencionado deve estar online para jogar Jogo da Velha contra você!"
    );
  if (mention.user.bot)
    return message.channel.send(
      "Você não pode mencionar um bot para jogar o Jogo da Velha!"
    );
  if (message.author.id === mention.id)
    return message.channel.send(
      "Você não pode brincar consigo mesmo. Você precisa mencionar um usuário contra quem deseja jogar."
    );

  let wantToPlayMessage;
  let wantToPlay;
  try {
    const wannaplay = "%mention, você quer jogar Jogo da Velha contra %author? Se sim, digite '**sim**' no chat!"
      .replace("%mention", mention)
      .replace("%author", message.author);
    wantToPlayMessage = await message.channel.send(wannaplay);
    wantToPlay = await message.channel.awaitMessages(
      message2 => message2.author.id === mention.id,
      {
        max: 1,
        time: 12000,
        errors: ["time"]
      }
    );
  } catch (error) {
    return wantToPlayMessage.delete();
  }

  if (wantToPlay.first().content.toLowerCase() !== "sim") {
    const gamecanceled = "Jogo cancelado porque %mention não respondeu ou não quer jogar!".replace(
      "%mention",
      mention.user.username
    );
    return message.reply(gamecanceled);
  }

  await wantToPlayMessage.delete();
  await wantToPlay.first().delete();

  await message.channel.send(`Novo Jogo da Velha criado!`);
  let gameEmbed = new MessageEmbed()
    .setTitle("Jogo da Velha game")
    .setDescription(
      "``` 1 | 2 | 3 \n---|---|--  \n 4 | 5 | 6 \n---|---|--  \n 7 | 8 | 9```"
    )
    .setFooter(`${message.author.username} vs ${mention.user.username}`)
    .setColor(config.color);
  const game = await message.channel.send({
    embed: gameEmbed
  });

  try {
    const yourTurnMessage = await message.channel.send(
      `${message.author}, É sua vez ‼`
    );
    const response1 = await message.channel.awaitMessages(
      message2 =>
        message.author.id === message2.author.id &&
        message2.content > 0 &&
        message2.content < 10 &&
        validation[message2.content - 1] === 0,
      {
        max: 1,
        time: 30000,
        errors: ["time"]
      }
    );

    await yourTurnMessage.delete();
    await response1.first().delete();

    const editedDescription = gameEmbed.description.replace(
      response1.first().content,
      response1.first().author.id === message.author.id ? "X" : "O"
    );
    gameEmbed = new MessageEmbed()
      .setTitle("Jogo da Velha game")
      .setDescription(editedDescription)
      .setFooter(`${message.author.username} vs ${mention.user.username}`)
      .setColor(config.color);

    await game.edit({
      embed: gameEmbed
    });
    validation[response1.first().content - 1] = 1;
  } catch (error) {
    const noanswer = "%author não respondeu por 30 segundos e %user ganhou a rodada."
      .replace("%user", mention)
      .replace("%author", message.author);
    const noAnswerEmbed = new MessageEmbed()
      .setTitle(
        "Tempo esgotado!"
      )
      .setDescription(noanswer)
      .setFooter(`${message.author.username} vs ${mention.user.username}`)
      .setColor(config.color);
    return message.channel.send({
      embed: noAnswerEmbed
    });
  }

  try {
    const yourTurnMessage = await message.channel.send(`${mention}, É a sua vez ‼`);
    const response1 = await message.channel.awaitMessages(
      message2 =>
        message2.author.id === mention.id &&
        message2.content > 0 &&
        message2.content < 10 &&
        validation[message2.content - 1] === 0,
      {
        max: 1,
        time: 30000,
        errors: ["time"]
      }
    );

    await yourTurnMessage.delete();
    await response1.first().delete();

    const editedDescription = gameEmbed.description.replace(
      response1.first().content,
      response1.first().author.id === message.author.id ? "X" : "O"
    );
    gameEmbed = new MessageEmbed()
      .setTitle("Jogo da Velha game")
      .setDescription(editedDescription)
      .setFooter(`${message.author.username} vs ${mention.user.username}`)
      .setColor(config.color);

    await game.edit({
      embed: gameEmbed
    });
    validation[response1.first().content - 1] = 2;
  } catch (error) {
    const noanswer = "%author não respondeu por 30 segundos e %user ganhou a rodada."
      .replace("%user", message.author)
      .replace("%author", mention);
    const noAnswerEmbed = new MessageEmbed()
      .setTitle(
        "Tempo esgotado!"
      )
      .setDescription(noanswer)
      .setFooter(`${message.author.username} vs ${mention.user.username}`)
      .setColor(config.color);
    return message.channel.send({
      embed: noAnswerEmbed
    });
  }

  try {
    const yourTurnMessage = await message.channel.send(
      `${message.author}, É a sua vez ‼`
    );
    const response1 = await message.channel.awaitMessages(
      message2 =>
        message.author.id === message2.author.id &&
        message2.content > 0 &&
        message2.content < 10 &&
        validation[message2.content - 1] === 0,
      {
        max: 1,
        time: 30000,
        errors: ["time"]
      }
    );

    await yourTurnMessage.delete();
    await response1.first().delete();

    const editedDescription = gameEmbed.description.replace(
      response1.first().content,
      response1.first().author.id === message.author.id ? "X" : "O"
    );
    gameEmbed = new MessageEmbed()
      .setTitle("Jogo da Velha game")
      .setDescription(editedDescription)
      .setFooter(`${message.author.username} vs ${mention.user.username}`)
      .setColor(config.color);

    await game.edit({
      embed: gameEmbed
    });
    validation[response1.first().content - 1] = 1;
  } catch (error) {
    const noanswer = "%author não respondeu por 30 segundos e %user ganhou a rodada."
      .replace("%user", mention)
      .replace("%author", message.author);
    const noAnswerEmbed = new MessageEmbed()
      .setTitle(
        "Tempo esgotado!"
      )
      .setDescription(noanswer)
      .setFooter(`${message.author.username} vs ${mention.user.username}`)
      .setColor(config.color);
    return message.channel.send({
      embed: noAnswerEmbed
    });
  }

  try {
    const yourTurnMessage = await message.channel.send(`${mention}, É a sua vez ‼`);
    const response1 = await message.channel.awaitMessages(
      message2 =>
        message2.author.id === mention.id &&
        message2.content > 0 &&
        message2.content < 10 &&
        validation[message2.content - 1] === 0,
      {
        max: 1,
        time: 30000,
        errors: ["time"]
      }
    );

    await yourTurnMessage.delete();
    await response1.first().delete();

    const editedDescription = gameEmbed.description.replace(
      response1.first().content,
      response1.first().author.id === message.author.id ? "X" : "O"
    );
    gameEmbed = new MessageEmbed()
      .setTitle("Jogo da Velha game")
      .setDescription(editedDescription)
      .setFooter(`${message.author.username} vs ${mention.user.username}`)
      .setColor(config.color);

    await game.edit({
      embed: gameEmbed
    });
    validation[response1.first().content - 1] = 2;
  } catch (error) {
    const noanswer = "%author não respondeu por 30 segundos e %user ganhou a rodada."
      .replace("%user", message.author)
      .replace("%author", mention);
    const noAnswerEmbed = new MessageEmbed()
      .setTitle(
        "Tempo esgotado!"
      )
      .setDescription(noanswer)
      .setFooter(`${message.author.username} vs ${mention.user.username}`)
      .setColor(config.color);
    return message.channel.send({
      embed: noAnswerEmbed
    });
  }

  try {
    const yourTurnMessage = await message.channel.send(
      `${message.author}, É a sua vez ‼`
    );
    const response1 = await message.channel.awaitMessages(
      message2 =>
        message.author.id === message2.author.id &&
        message2.content > 0 &&
        message2.content < 10 &&
        validation[message2.content - 1] === 0,
      {
        max: 1,
        time: 30000,
        errors: ["time"]
      }
    );

    await yourTurnMessage.delete();
    await response1.first().delete();

    const editedDescription = gameEmbed.description.replace(
      response1.first().content,
      response1.first().author.id === message.author.id ? "X" : "O"
    );
    gameEmbed = new MessageEmbed()
      .setTitle("Jogo da Velha game")
      .setDescription(editedDescription)
      .setFooter(`${message.author.username} vs ${mention.user.username}`)
      .setColor(config.color);

    await game.edit({
      embed: gameEmbed
    });
    validation[response1.first().content - 1] = 1;
  } catch (error) {
    const noanswer = "%author não respondeu por 30 segundos e %user ganhou a rodada."
      .replace("%user", mention)
      .replace("%author", message.author);
    const noAnswerEmbed = new MessageEmbed()
      .setTitle(
        "Tempo esgotado!"
      )
      .setDescription(noanswer)
      .setFooter(`${message.author.username} vs ${mention.user.username}`)
      .setColor(config.color);
    return message.channel.send({
      embed: noAnswerEmbed
    });
  }

  try {
    const yourTurnMessage = await message.channel.send(`${mention}, É a sua vez ‼`);
    const response1 = await message.channel.awaitMessages(
      message2 =>
        message2.author.id === mention.id &&
        message2.content > 0 &&
        message2.content < 10 &&
        validation[message2.content - 1] === 0,
      {
        max: 1,
        time: 30000,
        errors: ["time"]
      }
    );

    await yourTurnMessage.delete();
    await response1.first().delete();

    const editedDescription = gameEmbed.description.replace(
      response1.first().content,
      response1.first().author.id === message.author.id ? "X" : "O"
    );
    gameEmbed = new MessageEmbed()
      .setTitle("Jogo da Velha game")
      .setDescription(editedDescription)
      .setFooter(`${message.author.username} vs ${mention.user.username}`)
      .setColor(config.color);

    await game.edit({
      embed: gameEmbed
    });
    validation[response1.first().content - 1] = 2;
  } catch (error) {
    const noanswer = "%author não respondeu por 30 segundos e %user ganhou a rodada."
      .replace("%user", message.author)
      .replace("%author", mention);
    const noAnswerEmbed = new MessageEmbed()
      .setTitle(
        "Tempo esgotado!"
      )
      .setDescription(noanswer)
      .setFooter(`${message.author.username} vs ${mention.user.username}`)
      .setColor(config.color);
    return message.channel.send({
      embed: noAnswerEmbed
    });
  }

  const winnerEmbed = new MessageEmbed()
    .setTitle("Game over!")
    .setFooter(`${message.author.username} vs ${mention.user.username}`)
    .setColor(config.color);

  if (validation[0] === 1 && validation[1] === 1 && validation[2] === 1) {
    const win = "%user ganhou essa rodada!".replace("%user", message.author);
    winnerEmbed.setDescription(win);
    return message.channel.send({
      embed: winnerEmbed
    });
  }
  if (validation[2] === 1 && validation[5] === 1 && validation[8] === 1) {
    const win = "%user ganhou essa rodada!".replace("%user", message.author);
    winnerEmbed.setDescription(win);
    return message.channel.send({
      embed: winnerEmbed
    });
  }
  if (validation[6] === 1 && validation[7] === 1 && validation[8] === 1) {
    const win = "%user ganhou essa rodada!".replace("%user", message.author);
    winnerEmbed.setDescription(win);
    return message.channel.send({
      embed: winnerEmbed
    });
  }
  if (validation[0] === 1 && validation[3] === 1 && validation[6] === 1) {
    const win = "%user ganhou essa rodada!".replace("%user", message.author);
    winnerEmbed.setDescription(win);
    return message.channel.send({
      embed: winnerEmbed
    });
  }
  if (validation[0] === 1 && validation[4] === 1 && validation[8] === 1) {
    const win = "%user ganhou essa rodada!".replace("%user", message.author);
    winnerEmbed.setDescription(win);
    return message.channel.send({
      embed: winnerEmbed
    });
  }
  if (validation[2] === 1 && validation[4] === 1 && validation[6] === 1) {
    const win = "%user ganhou essa rodada!".replace("%user", message.author);
    winnerEmbed.setDescription(win);
    return message.channel.send({
      embed: winnerEmbed
    });
  }
  if (validation[1] === 1 && validation[4] === 1 && validation[7] === 1) {
    const win = "%user ganhou essa rodada!".replace("%user", message.author);
    winnerEmbed.setDescription(win);
    return message.channel.send({
      embed: winnerEmbed
    });
  }
  if (validation[3] === 1 && validation[4] === 1 && validation[6] === 1) {
    const win = "%user ganhou essa rodada!".replace("%user", message.author);
    winnerEmbed.setDescription(win);
    return message.channel.send({
      embed: winnerEmbed
    });
  }
  if (validation[0] === 2 && validation[1] === 2 && validation[2] === 2) {
    const win = "%user ganhou essa rodada!".replace("%user", mention);
    winnerEmbed.setDescription(win);
    return message.channel.send({
      embed: winnerEmbed
    });
  }
  if (validation[2] === 2 && validation[5] === 2 && validation[8] === 2) {
    const win = "%user ganhou essa rodada!".replace("%user", mention);
    winnerEmbed.setDescription(win);
    return message.channel.send({
      embed: winnerEmbed
    });
  }
  if (validation[6] === 2 && validation[7] === 2 && validation[8] === 2) {
    const win = "%user ganhou essa rodada!".replace("%user", mention);
    winnerEmbed.setDescription(win);
    return message.channel.send({
      embed: winnerEmbed
    });
  }
  if (validation[0] === 2 && validation[3] === 2 && validation[6] === 2) {
    const win = "%user ganhou essa rodada!".replace("%user", mention);
    winnerEmbed.setDescription(win);
    return message.channel.send({
      embed: winnerEmbed
    });
  }
  if (validation[0] === 2 && validation[4] === 2 && validation[8] === 2) {
    const win = "%user ganhou essa rodada!".replace("%user", mention);
    winnerEmbed.setDescription(win);
    return message.channel.send({
      embed: winnerEmbed
    });
  }
  if (validation[2] === 2 && validation[4] === 2 && validation[6] === 2) {
    const win = "%user ganhou essa rodada!".replace("%user", mention);
    winnerEmbed.setDescription(win);
    return message.channel.send({
      embed: winnerEmbed
    });
  }
  if (validation[1] === 2 && validation[4] === 2 && validation[7] === 2) {
    const win = "%user ganhou essa rodada!".replace("%user", mention);
    winnerEmbed.setDescription(win);
    return message.channel.send({
      embed: winnerEmbed
    });
  }
  if (validation[3] === 2 && validation[4] === 2 && validation[6] === 2) {
    const win = "%user ganhou essa rodada!".replace("%user", mention);
    winnerEmbed.setDescription(win);
    return message.channel.send({
      embed: winnerEmbed
    });
  }

  try {
    const yourTurnMessage = await message.channel.send(
      `${message.author}, É a sua vez ‼`
    );
    const response1 = await message.channel.awaitMessages(
      message2 =>
        message.author.id === message2.author.id &&
        message2.content > 0 &&
        message2.content < 10 &&
        validation[message2.content - 1] === 0,
      {
        max: 1,
        time: 30000,
        errors: ["time"]
      }
    );

    await yourTurnMessage.delete();
    await response1.first().delete();

    const editedDescription = gameEmbed.description.replace(
      response1.first().content,
      response1.first().author.id === message.author.id ? "X" : "O"
    );
    gameEmbed = new MessageEmbed()
      .setTitle("Jogo da Velha game")
      .setDescription(editedDescription)
      .setFooter(`${message.author.username} vs ${mention.user.username}`)
      .setColor(config.color);

    await game.edit({
      embed: gameEmbed
    });
    validation[response1.first().content - 1] = 1;
  } catch (error) {
    const noanswer = "%author não respondeu por 30 segundos e %user ganhou a rodada."
      .replace("%user", mention)
      .replace("%author", message.author);
    const noAnswerEmbed = new MessageEmbed()
      .setTitle(
        "Tempo esgotado!"
      )
      .setDescription(noanswer)
      .setFooter(`${message.author.username} vs ${mention.user.username}`)
      .setColor(config.color);
    return message.channel.send({
      embed: noAnswerEmbed
    });
  }

  if (validation[0] === 1 && validation[1] === 1 && validation[2] === 1) {
    const win = "%user ganhou essa rodada!".replace("%user", message.author);
    winnerEmbed.setDescription(win);
    return message.channel.send({
      embed: winnerEmbed
    });
  }
  if (validation[2] === 1 && validation[5] === 1 && validation[8] === 1) {
    const win = "%user ganhou essa rodada!".replace("%user", message.author);
    winnerEmbed.setDescription(win);
    return message.channel.send({
      embed: winnerEmbed
    });
  }
  if (validation[6] === 1 && validation[7] === 1 && validation[8] === 1) {
    const win = "%user ganhou essa rodada!".replace("%user", message.author);
    winnerEmbed.setDescription(win);
    return message.channel.send({
      embed: winnerEmbed
    });
  }
  if (validation[0] === 1 && validation[3] === 1 && validation[6] === 1) {
    const win = "%user ganhou essa rodada!".replace("%user", message.author);
    winnerEmbed.setDescription(win);
    return message.channel.send({
      embed: winnerEmbed
    });
  }
  if (validation[0] === 1 && validation[4] === 1 && validation[8] === 1) {
    const win = "%user ganhou essa rodada!".replace("%user", message.author);
    winnerEmbed.setDescription(win);
    return message.channel.send({
      embed: winnerEmbed
    });
  }
  if (validation[2] === 1 && validation[4] === 1 && validation[6] === 1) {
    const win = "%user ganhou essa rodada!".replace("%user", message.author);
    winnerEmbed.setDescription(win);
    return message.channel.send({
      embed: winnerEmbed
    });
  }
  if (validation[1] === 1 && validation[4] === 1 && validation[7] === 1) {
    const win = "%user ganhou essa rodada!".replace("%user", message.author);
    winnerEmbed.setDescription(win);
    return message.channel.send({
      embed: winnerEmbed
    });
  }
  if (validation[3] === 1 && validation[4] === 1 && validation[6] === 1) {
    const win = "%user ganhou essa rodada!".replace("%user", message.author);
    winnerEmbed.setDescription(win);
    return message.channel.send({
      embed: winnerEmbed
    });
  }
  if (validation[0] === 2 && validation[1] === 2 && validation[2] === 2) {
    const win = "%user ganhou essa rodada!".replace("%user", mention);
    winnerEmbed.setDescription(win);
    return message.channel.send({
      embed: winnerEmbed
    });
  }
  if (validation[2] === 2 && validation[5] === 2 && validation[8] === 2) {
    const win = "%user ganhou essa rodada!".replace("%user", mention);
    winnerEmbed.setDescription(win);
    return message.channel.send({
      embed: winnerEmbed
    });
  }
  if (validation[6] === 2 && validation[7] === 2 && validation[8] === 2) {
    const win = "%user ganhou essa rodada!".replace("%user", mention);
    winnerEmbed.setDescription(win);
    return message.channel.send({
      embed: winnerEmbed
    });
  }
  if (validation[0] === 2 && validation[3] === 2 && validation[6] === 2) {
    const win = "%user ganhou essa rodada!".replace("%user", mention);
    winnerEmbed.setDescription(win);
    return message.channel.send({
      embed: winnerEmbed
    });
  }
  if (validation[0] === 2 && validation[4] === 2 && validation[8] === 2) {
    const win = "%user ganhou essa rodada!".replace("%user", mention);
    winnerEmbed.setDescription(win);
    return message.channel.send({
      embed: winnerEmbed
    });
  }
  if (validation[2] === 2 && validation[4] === 2 && validation[6] === 2) {
    const win = "%user ganhou essa rodada!".replace("%user", mention);
    winnerEmbed.setDescription(win);
    return message.channel.send({
      embed: winnerEmbed
    });
  }
  if (validation[1] === 2 && validation[4] === 2 && validation[7] === 2) {
    const win = "%user ganhou essa rodada!".replace("%user", mention);
    winnerEmbed.setDescription(win);
    return message.channel.send({
      embed: winnerEmbed
    });
  }
  if (validation[3] === 2 && validation[4] === 2 && validation[6] === 2) {
    const win = "%user ganhou essa rodada!".replace("%user", mention);
    winnerEmbed.setDescription(win);
    return message.channel.send({
      embed: winnerEmbed
    });
  }

  try {
    const yourTurnMessage = await message.channel.send(`${mention}, É a sua vez ‼`);
    const response1 = await message.channel.awaitMessages(
      message2 =>
        message2.author.id === mention.id &&
        message2.content > 0 &&
        message2.content < 10 &&
        validation[message2.content - 1] === 0,
      {
        max: 1,
        time: 30000,
        errors: ["time"]
      }
    );

    await yourTurnMessage.delete();
    await response1.first().delete();

    const editedDescription = gameEmbed.description.replace(
      response1.first().content,
      response1.first().author.id === message.author.id ? "X" : "O"
    );
    gameEmbed = new MessageEmbed()
      .setTitle("Jogo da Velha game")
      .setDescription(editedDescription)
      .setFooter(`${message.author.username} vs ${mention.user.username}`)
      .setColor(config.color);

    await game.edit({
      embed: gameEmbed
    });
    validation[response1.first().content - 1] = 2;
  } catch (error) {
    const noanswer = "%author não respondeu por 30 segundos e %user ganhou a rodada."
      .replace("%user", message.author)
      .replace("%author", mention);
    const noAnswerEmbed = new MessageEmbed()
      .setTitle(
        "Tempo esgotado!"
      )
      .setDescription(noanswer)
      .setFooter(`${message.author.username} vs ${mention.user.username}`)
      .setColor(config.color);
    return message.channel.send({
      embed: noAnswerEmbed
    });
  }

  if (validation[0] === 1 && validation[1] === 1 && validation[2] === 1) {
    const win = "%user ganhou essa rodada!".replace("%user", message.author);
    winnerEmbed.setDescription(win);
    return message.channel.send({
      embed: winnerEmbed
    });
  }
  if (validation[2] === 1 && validation[5] === 1 && validation[8] === 1) {
    const win = "%user ganhou essa rodada!".replace("%user", message.author);
    winnerEmbed.setDescription(win);
    return message.channel.send({
      embed: winnerEmbed
    });
  }
  if (validation[6] === 1 && validation[7] === 1 && validation[8] === 1) {
    const win = "%user ganhou essa rodada!".replace("%user", message.author);
    winnerEmbed.setDescription(win);
    return message.channel.send({
      embed: winnerEmbed
    });
  }
  if (validation[0] === 1 && validation[3] === 1 && validation[6] === 1) {
    const win = "%user ganhou essa rodada!".replace("%user", message.author);
    winnerEmbed.setDescription(win);
    return message.channel.send({
      embed: winnerEmbed
    });
  }
  if (validation[0] === 1 && validation[4] === 1 && validation[8] === 1) {
    const win = "%user ganhou essa rodada!".replace("%user", message.author);
    winnerEmbed.setDescription(win);
    return message.channel.send({
      embed: winnerEmbed
    });
  }
  if (validation[2] === 1 && validation[4] === 1 && validation[6] === 1) {
    const win = "%user ganhou essa rodada!".replace("%user", message.author);
    winnerEmbed.setDescription(win);
    return message.channel.send({
      embed: winnerEmbed
    });
  }
  if (validation[1] === 1 && validation[4] === 1 && validation[7] === 1) {
    const win = "%user ganhou essa rodada!".replace("%user", message.author);
    winnerEmbed.setDescription(win);
    return message.channel.send({
      embed: winnerEmbed
    });
  }
  if (validation[3] === 1 && validation[4] === 1 && validation[6] === 1) {
    const win = "%user ganhou essa rodada!".replace("%user", message.author);
    winnerEmbed.setDescription(win);
    return message.channel.send({
      embed: winnerEmbed
    });
  }
  if (validation[0] === 2 && validation[1] === 2 && validation[2] === 2) {
    const win = "%user ganhou essa rodada!".replace("%user", mention);
    winnerEmbed.setDescription(win);
    return message.channel.send({
      embed: winnerEmbed
    });
  }
  if (validation[2] === 2 && validation[5] === 2 && validation[8] === 2) {
    const win = "%user ganhou essa rodada!".replace("%user", mention);
    winnerEmbed.setDescription(win);
    return message.channel.send({
      embed: winnerEmbed
    });
  }
  if (validation[6] === 2 && validation[7] === 2 && validation[8] === 2) {
    const win = "%user ganhou essa rodada!".replace("%user", mention);
    winnerEmbed.setDescription(win);
    return message.channel.send({
      embed: winnerEmbed
    });
  }
  if (validation[0] === 2 && validation[3] === 2 && validation[6] === 2) {
    const win = "%user ganhou essa rodada!".replace("%user", mention);
    winnerEmbed.setDescription(win);
    return message.channel.send({
      embed: winnerEmbed
    });
  }
  if (validation[0] === 2 && validation[4] === 2 && validation[8] === 2) {
    const win = "%user ganhou essa rodada!".replace("%user", mention);
    winnerEmbed.setDescription(win);
    return message.channel.send({
      embed: winnerEmbed
    });
  }
  if (validation[2] === 2 && validation[4] === 2 && validation[6] === 2) {
    const win = "%user ganhou essa rodada!".replace("%user", mention);
    winnerEmbed.setDescription(win);
    return message.channel.send({
      embed: winnerEmbed
    });
  }
  if (validation[1] === 2 && validation[4] === 2 && validation[7] === 2) {
    const win = "%user ganhou essa rodada!".replace("%user", mention);
    winnerEmbed.setDescription(win);
    return message.channel.send({
      embed: winnerEmbed
    });
  }
  if (validation[3] === 2 && validation[4] === 2 && validation[6] === 2) {
    const win = "%user ganhou essa rodada!".replace("%user", mention);
    winnerEmbed.setDescription(win);
    return message.channel.send({
      embed: winnerEmbed
    });
  }

  try {
    const yourTurnMessage = await message.channel.send(
      `${message.author}, É a sua vez ‼`
    );
    const response1 = await message.channel.awaitMessages(
      message2 =>
        message.author.id === message2.author.id &&
        message2.content > 0 &&
        message2.content < 10 &&
        validation[message2.content - 1] === 0,
      {
        max: 1,
        time: 30000,
        errors: ["time"]
      }
    );

    await yourTurnMessage.delete();
    await response1.first().delete();

    const editedDescription = gameEmbed.description.replace(
      response1.first().content,
      response1.first().author.id === message.author.id ? "X" : "O"
    );
    gameEmbed = new MessageEmbed()
      .setTitle("Jogo da Velha game")
      .setDescription(editedDescription)
      .setFooter(`${message.author.username} vs ${mention.user.username}`)
      .setColor(config.color);

    await game.edit({
      embed: gameEmbed
    });
    validation[response1.first().content - 1] = 1;
  } catch (error) {
    const noanswer = "%author não respondeu por 30 segundos e %user ganhou a rodada."
      .replace("%user", mention)
      .replace("%author", message.author);
    const noAnswerEmbed = new MessageEmbed()
      .setTitle(
        "Tempo esgotado!"
      )
      .setDescription(noanswer)
      .setFooter(`${message.author.username} vs ${mention.user.username}`)
      .setColor(config.color);
    return message.channel.send({
      embed: noAnswerEmbed
    });
  }

  if (validation[0] === 1 && validation[1] === 1 && validation[2] === 1) {
    const win = "%user ganhou essa rodada!".replace("%user", message.author);
    winnerEmbed.setDescription(win);
    return message.channel.send({
      embed: winnerEmbed
    });
  }
  if (validation[2] === 1 && validation[5] === 1 && validation[8] === 1) {
    const win = "%user ganhou essa rodada!".replace("%user", message.author);
    winnerEmbed.setDescription(win);
    return message.channel.send({
      embed: winnerEmbed
    });
  }
  if (validation[6] === 1 && validation[7] === 1 && validation[8] === 1) {
    const win = "%user ganhou essa rodada!".replace("%user", message.author);
    winnerEmbed.setDescription(win);
    return message.channel.send({
      embed: winnerEmbed
    });
  }
  if (validation[0] === 1 && validation[3] === 1 && validation[6] === 1) {
    const win = "%user ganhou essa rodada!".replace("%user", message.author);
    winnerEmbed.setDescription(win);
    return message.channel.send({
      embed: winnerEmbed
    });
  }
  if (validation[0] === 1 && validation[4] === 1 && validation[8] === 1) {
    const win = "%user ganhou essa rodada!".replace("%user", message.author);
    winnerEmbed.setDescription(win);
    return message.channel.send({
      embed: winnerEmbed
    });
  }
  if (validation[2] === 1 && validation[4] === 1 && validation[6] === 1) {
    const win = "%user ganhou essa rodada!".replace("%user", message.author);
    winnerEmbed.setDescription(win);
    return message.channel.send({
      embed: winnerEmbed
    });
  }
  if (validation[1] === 1 && validation[4] === 1 && validation[7] === 1) {
    const win = "%user ganhou essa rodada!".replace("%user", message.author);
    winnerEmbed.setDescription(win);
    return message.channel.send({
      embed: winnerEmbed
    });
  }
  if (validation[3] === 1 && validation[4] === 1 && validation[6] === 1) {
    const win = "%user ganhou essa rodada!".replace("%user", message.author);
    winnerEmbed.setDescription(win);
    return message.channel.send({
      embed: winnerEmbed
    });
  }
  if (validation[0] === 2 && validation[1] === 2 && validation[2] === 2) {
    const win = "%user ganhou essa rodada!".replace("%user", mention);
    winnerEmbed.setDescription(win);
    return message.channel.send({
      embed: winnerEmbed
    });
  }
  if (validation[2] === 2 && validation[5] === 2 && validation[8] === 2) {
    const win = "%user ganhou essa rodada!".replace("%user", mention);
    winnerEmbed.setDescription(win);
    return message.channel.send({
      embed: winnerEmbed
    });
  }
  if (validation[6] === 2 && validation[7] === 2 && validation[8] === 2) {
    const win = "%user ganhou essa rodada!".replace("%user", mention);
    winnerEmbed.setDescription(win);
    return message.channel.send({
      embed: winnerEmbed
    });
  }
  if (validation[0] === 2 && validation[3] === 2 && validation[6] === 2) {
    const win = "%user ganhou essa rodada!".replace("%user", mention);
    winnerEmbed.setDescription(win);
    return message.channel.send({
      embed: winnerEmbed
    });
  }
  if (validation[0] === 2 && validation[4] === 2 && validation[8] === 2) {
    const win = "%user ganhou essa rodada!".replace("%user", mention);
    winnerEmbed.setDescription(win);
    return message.channel.send({
      embed: winnerEmbed
    });
  }
  if (validation[2] === 2 && validation[4] === 2 && validation[6] === 2) {
    const win = "%user ganhou essa rodada!".replace("%user", mention);
    winnerEmbed.setDescription(win);
    return message.channel.send({
      embed: winnerEmbed
    });
  }
  if (validation[1] === 2 && validation[4] === 2 && validation[7] === 2) {
    const win = "%user ganhou essa rodada!".replace("%user", mention);
    winnerEmbed.setDescription(win);
    return message.channel.send({
      embed: winnerEmbed
    });
  }
  if (validation[3] === 2 && validation[4] === 2 && validation[6] === 2) {
    const win = "%user ganhou essa rodada!".replace("%user", mention);
    winnerEmbed.setDescription(win);
    return message.channel.send({
      embed: winnerEmbed
    });
  }
  const drawEmbed = new MessageEmbed()
    .setTitle("Game over!")
    .setDescription(
      "Ninguém ganhou, é empate! A próxima rodada pode ser melhor."
    )
    .setFooter(`${message.author.username} vs ${mention.user.username}`)
    .setColor(config.color);

  return message.channel.send({
    embed: drawEmbed
    });
    }
};
