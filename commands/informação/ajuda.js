const {
    MessageEmbed
} = require("discord.js");
const {
    stripIndents
} = require("common-tags");
const config = require("../../config.json")
module.exports = {
    name: "ajuda",
    aliases: ["aj"],
    cooldown: 4,
    category: "informação",
    description: "Retorna a informação de um comando especifico",
    useage: "help [Command]",
    run: async (client, message, args) => {
        //GET THE PREFIX
        let prefix = client.settings.get(message.guild.id, `prefix`);
        if (prefix === null) prefix = config.prefix; //if not prefix set it to standard prefix in the config.json file
				if (!args.join(" ")){
					return message.channel.send(`Informe qual comando você quer obter ajuda! \nEx: \`${prefix}ajuda play\``)
				}
        if (args[0]) {
            return getCMD(client, message, args[0]);
        } else {
            return getAll(client, message);
        }



        function getCMD(client, message, input) {
            const embed = new MessageEmbed() //creating a new Embed

            const cmd = client.commands.get(input.toLowerCase()) || client.commands.get(client.aliases.get(input.toLowerCase())) //getting the command by name/alias
            if (!cmd) { //if no cmd found return info no infos!
                return message.channel.send(embed.setColor(config.colors.no).setDescription(`Nenhuma informação encontrada para o comando **${input.toLowerCase()}**`));
            }
            if (cmd.name) embed.addField("**Nome do comando**", `\`${cmd.name}\``)
            if (cmd.name) embed.setTitle(`Informações detalhadas sobre: \`${cmd.name}\``)
            if (cmd.description) embed.addField("**Descrição**", `\`${cmd.description}\``);

            if (cmd.aliases) embed.addField("**Aliases**", `\`${cmd.aliases.map(a => `${a}`).join("\`, \`")}\``)
            if (cmd.cooldown) embed.addField("**Cooldown**", `\`${cmd.cooldown} Segundos\``)
            else embed.addField("**Cooldown**", `\`2 Segundos\``)
            if (cmd.useage) {
                embed.addField("**Uso**", `\`${config.prefix}${cmd.useage}\``);
                embed.setFooter("Sintaxe: <> = requeridos, [] = opcional");
            }
            return message.channel.send(embed.setColor(config.colors.yes));
        }
    }
}
