const functions = require("../../functions")
const config = require("../../config.json")
module.exports = {
  name: "addbotchat",
  aliases: ["addbotchannel"],
  category: "setup commands",
  description: "Vamos habilitar um bate-papo apenas para bot, onde a comunidade tem permissão para usar comandos",
  useage: "addbotchat <#chat>",
  run: async (client, message, args) => {
    //command
    if (!message.member.hasPermission("ADMINISTRATOR")) return functions.embedbuilder(client, "null", message, config.colors.no, "BOT-CHAT-SETUP", `❌ Yocê não tem permissão para este comando!`)

    let channel = message.mentions.channels.first();
    if (!channel) return functions.embedbuilder(client, "null", message, config.colors.no, `ERROR`, `Adicione um canal via ping, por exemplo: #channel!`)
    try {
      message.guild.roles.cache.get(channel.id)
    } catch {
      return functions.embedbuilder(client, "null", message, config.colors.no, `ERROR`, `Parece que o canal não existe neste servidor!`)
    }
    if (client.settings.get(message.guild.id, `botchannel`).includes(channel.id)) return functions.embedbuilder(client, "null", message, config.colors.no, `ERROR`, `Este canal já está na lista!`)

    message.react("✅");

    client.settings.push(message.guild.id, channel.id, `botchannel`);
    let leftb = "";
    if (client.settings.get(message.guild.id, `botchannel`).join("") === "") leftb = "nenhum canal, também conhecido como todos os canais são canais bot"
    else
      for (let i = 0; i < client.settings.get(message.guild.id, `botchannel`).length; i++) {
        leftb += "<#" + client.settings.get(message.guild.id, `botchannel`)[i] + "> | "
      }
    let botchatfromenmap = message.guild.channels.cache.get(client.settings.get(message.guild.id, `botchannel`)[client.settings.get(message.guild.id, `botchannel`).length])

    return functions.embedbuilder(client, "null", message, config.colors.yes, "BOT-CHAT-SETUP ", `✅ O Bot-Chat foi adicionado com sucesso a ${botchatfromenmap}
  Todos os bate-papos de bot:
  > ${leftb}`)

  }
};

