const { MessageEmbed } = require("discord.js");
const { readdirSync } = require("fs");
const prefix = require("../../config.json").prefix;

module.exports = {
  name: "help",
  aliases : ["h", "ajuda", "comando", "comandos"],
	category:"utilidade",
  description: "Mostra todos os comandos de bot disponíveis.",
  run: async (client, message, args) => {


    const roleColor =
      message.guild.me.displayHexColor === "#00FFFF"
        ? "##00BFFF"
        : message.guild.me.displayHexColor;

    if (!args[0]) {
      let categories = [];

      readdirSync("./commands/").forEach((dir) => {
        const commands = readdirSync(`./commands/${dir}/`).filter((file) =>
          file.endsWith(".js")
        );

        const cmds = commands.map((command) => {
          let file = require(`../../commands/${dir}/${command}`);

          if (!file.name) return "Nenhum comando com esse nome foi encontrado.";

          let name = file.name.replace(".js", "");

          return `\`${name}\``;
        });

        let data = new Object();

        data = {
          name: dir.toUpperCase(),
          value: cmds.length === 0 ? "Em progresso." : cmds.join(" "),
        };

        categories.push(data);
      });

      const embed = new MessageEmbed()
        .setTitle("📬 Preciso de ajuda? Aqui estão todos os meus comandos:")
        .addFields(categories)
        .setDescription(
          `Use \`${prefix}help\` seguido por um nome de comando para obter mais informações adicionais sobre um comando. Por exemplo: \`${prefix}help ban\`.`
        )
        .setFooter(
          `Requerido por ${message.author.tag}`,
          message.author.displayAvatarURL({ dynamic: true })
        )
        .setTimestamp()
        .setColor(roleColor);
      return message.channel.send(embed);
    } else {
      const command =
        client.commands.get(args[0].toLowerCase()) ||
        client.commands.find(
          (c) => c.aliases && c.aliases.includes(args[0].toLowerCase())
        );

      if (!command) {
        const embed = new MessageEmbed()
          .setTitle(`Comando inválido! Use \`${prefix}help\` para todos os meus comandos!`)
          .setColor("#FF0000");
        return message.channel.send(embed);
      }

      const embed = new MessageEmbed()
        .setTitle("Detalhes do Comando:")
        .addField(
          "COMANDO:",
          command.name ? `\`${command.name}\`` : "Sem nome para este comando."
        )
        .addField(
          "ALIASES:",
          command.aliases
            ? `\`${command.aliases.join("` `")}\``
            : "Sem aliases para este comando."
        )
        .addField(
          "USO:",
          command.usage
            ? `\`${prefix}${command.name} ${command.usage}\``
            : `\`${prefix}${command.name}\``
        )
        .addField(
          "DESCRIÇÃO:",
          command.description
            ? command.description
            : "Sem descrição para este comando."
        )
        .setFooter(
          `Requerido por ${message.author.tag}`,
          message.author.displayAvatarURL({ dynamic: true })
        )
        .setTimestamp()
        .setColor(roleColor);
      return message.channel.send(embed);
    }
  },
};