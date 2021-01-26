const { MessageEmbed } = require("discord.js");
const db = require("quick.db")
module.exports = {
  name: "help",
	aliases:["ajuda"],
  description:
    "Obtenha a lista de todos os comandos e até mesmo conheça cada detalhe do comandoObtenha a lista de todos os comandos e até mesmo conheça cada detalhe do comando",
  usage: "help <cmd>",
  category: "utilidade",
  run: async (client, message, args) => {
    if (args[0]) {
      const command = await client.commands.get(args[0]);

      if (!command) {
        return message.channel.send("Comando desconhecido:" + args[0]);
      }

      let embed = new MessageEmbed()
        .setAuthor(command.name, client.user.displayAvatarURL())
        .addField("Descrição", command.description || "Não fornecido")
        .addField("Use", "`" + command.usage + "`" || "Não fornecido")
				.addField("aliases","`" + command.aliases + "`" || "não fornecido")
				.addField("")
        .setThumbnail(client.user.displayAvatarURL())
        .setColor("#00BFFF")
        .setFooter(client.user.username, client.user.displayAvatarURL());

      return message.channel.send(embed);
    } else {
      const commands = await client.commands;

      let emx = new MessageEmbed()
        .setDescription("Comandos de King")
        .setColor("#00BFFF")
        .setFooter(client.user.username, client.user.displayAvatarURL())
        .setThumbnail(client.user.displayAvatarURL());

      let com = {};
      for (let comm of commands.array()) {
        let category = comm.category || "Descohecido";
        let name = comm.name;

        if (!com[category]) {
          com[category] = [];
        }
        com[category].push(name);
      }

      for(const [key, value] of Object.entries(com)) {
        let category = key;

        let desc = "`" + value.join("`, `") + "`";

        emx.addField(`${category.toUpperCase()}[${value.length}]`, desc);
      }

      let database = db.get(`cmd_${message.guild.id}`)

      if(database && database.length) {
        let array =[]
        database.forEach(m => {
          array.push("`" + m.name + "`")
        })

        emx.addField("Comandos Personalizados", array.join(", "))
      }

      return message.channel.send(emx);
    }
  }
};