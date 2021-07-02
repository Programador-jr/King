const functions = require("../../functions")
const config = require("../../config.json")
module.exports = {
  name: "prefix",
  aliases: ["prefixo"],
  category: "utilidade",
  description: "Vamos mudar o prefixo do BOT",
  useage: "prefix <new Prefix>",
  run: async (client, message, args) => {
    //command
    let prefix = client.settings.get(message.guild.id, `prefix`);
    if (prefix === null) prefix = config.prefix;
    message.react("✅");
    if (!args[0]) return functions.embedbuilder(client, "null", message, "#00BFFF", `Prefixo atual: \`${prefix}\``, `Forneça um novo prefixo`)
    if (!message.member.hasPermission("ADMINISTRATOR")) return functions.embedbuilder(client, "null", message, config.colors.no, "prefix", `❌ Você não tem permissão para este comando!`)

    if (args[1]) return functions.embedbuilder(client, "null", message, config.colors.no, "prefix", `❌ O prefixo não pode ter dois espaços`)
    if (args[0].length > 5) return functions.embedbuilder(client, "null", message, config.colors.no, "ERROR", `❌ O prefixo não pode ser mais longo do que "5"`)

    client.settings.set(message.guild.id, args[0], `prefix`);

    return functions.embedbuilder(client, "null", message, config.colors.yes, "prefixo", `✅ Definido com sucesso o novo prefixo para **\`${args[0]}\`**`)
  }
};
