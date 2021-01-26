const Discord = require("discord.js");

	module.exports = {
    name: "coinflip",
		usage: "coinflip <cara/coroa>",
		aliases: ["coin", "flip", "jogarmoeda", "moeda", "jogar"],
		description: "Gire uma moeda e veja se irá cair cara ou coroa!",
    category: "diversão",
    run: async (client, message, args) => {
			var array1 = ["cara", "coroa"];

  var rand = Math.floor(Math.random() * array1.length);

  if (!args[0] || (args[0].toLowerCase() !== "cara" && args[0].toLowerCase() !== "coroa")) {
    message.reply("insira **cara** ou **coroa** na frente do comando.");
  } 
else if (args[0].toLowerCase() == array1[rand]) {
    message.channel.send("Deu **" + array1[rand] + "**, você ganhou dessa vez!");
  } 
else if (args[0].toLowerCase() != array1[rand]) {
    message.channel.send("Deu **" + array1[rand] + "**, você perdeu dessa vez!"
    );
  }
		
		}
};