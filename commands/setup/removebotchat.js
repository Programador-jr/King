const functions = require("../../functions")
const config = require("../../config.json")
module.exports = {
  name: "removebotchat",
  aliases: ["removechat"],
  category: "setup",
  description: "Vamos deletar o canal para os comandos do bot",
  useage: "removebotchat #Chat",
  run: async (client, message, args) => {
    if (!message.member.hasPermission("ADMINISTRATOR")) return functions.embedbuilder(client, "null", message, config.colors.no, "DISABLE-BOT-CHAT-SETUP", `❌ Você não tem permissão para este comando!`)
    let channel = message.mentions.channels.first();
    if (!channel) return functions.embedbuilder(client, "null", message, config.colors.no, `ERROR`, `Adicione um canal via ping, por exemplo: #channel!`)
    try {
      message.guild.roles.cache.get(channel.id)
    } catch {
      return functions.embedbuilder(client, "null", message, config.colors.no, `ERROR`, `Parece que o Canal não existe neste servidor!`)
    }

    if (!client.settings.get(message.guild.id, `botchannel`).includes(channel.id)) return functions.embedbuilder(client, "null", message, config.colors.no, `ERROR`, `Este canal não está na configuração do canal do bot!`)
    message.react("✅");
    client.settings.remove(message.guild.id, channel.id, `botchannel`);

    let leftb = "";
    if (client.settings.get(message.guild.id, `botchannel`).join("") === "") leftb = "nenhum canal, também conhecido como todos os canais são canais bot"
    else
      for (let i = 0; i < client.settings.get(message.guild.id, `botchannel`).length; i++) {
        leftb += "<#" + client.settings.get(message.guild.id, `botchannel`)[i] + "> | "
      }
    return functions.embedbuilder(client, "null", message, config.colors.yes, "BOT-CHAT-SETUP", `✅ Excluído com sucesso ${channel} deste Server-Bot-Chats
    deixou bate-papos de bot:
    > ${leftb}
    `)
  }
};
/**
 * @INFO
 * Bot Coded by Tomato#6966 | https://github.com/Tomato6966/discord-js-lavalink-Music-Bot-erela-js
 * @INFO
 * Work for Milrato Development | https://milrato.eu
 * @INFO
 * Please mention Him / Milrato Development, when using this Code!
 * @INFO
 */
