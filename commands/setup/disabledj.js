const functions = require("../../functions")
const config = require("../../config.json")
module.exports = {
  name: "removedj",
  aliases: ["deletedj"],
  category: "setup",
  description: "Vamos EXCLUIR um PAPEL DJ",
  useage: "removedj @ROLE",
  run: async (client, message, args) => {
    if (!message.member.hasPermission("ADMINISTRATOR")) return functions.embedbuilder(client, "null", message, config.colors.no, "DISABLE-DJ-ROLES-SETUP ",` ❌ Você não tem permissão para este comando!`)
    let role = message.mentions.roles.first();
    if (!role) return functions.embedbuilder(client, "null", message, config.colors.no, `ERROR`, `Adicione um canal via ping, por exemplo: #channel!`)
    try {
      message.guild.roles.cache.get(role.id)
    } catch {
      return functions.embedbuilder(client, "null", message, config.colors.no, `ERROR`, `Parece que o canal não existe neste servidor!`)
    }

    if (!client.settings.get(message.guild.id, `djroles`).includes(role.id)) return functions.embedbuilder(client, "null", message, config.colors.no, `ERROR`, `Esta função já é DJ-ROLE!`)
    message.react("✅");
    client.settings.remove(message.guild.id, role.id, `djroles`);

    let leftb = "";
    if (client.settings.get(message.guild.id, `djroles`).join("") === "") leftb = "nenhum papel de Dj, também conhecido como Todos os usuários são Djs"
    else
      for (let i = 0; i < client.settings.get(message.guild.id, `djroles`).length; i++) {
        leftb += "<@&" + client.settings.get(message.guild.id, `djroles`)[i] + "> | "
      }
    return functions.embedbuilder(client, "null", message, config.colors.yes, "DJ-ROLES-SETUP", `✅ Excluiu com sucesso ${role} deste Server-DJ-Roles
    deixou DJ-ROLES:
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
