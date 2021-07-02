const functions = require("../../functions")
const config = require("../../config.json")
module.exports = {
  name: "adddj",
  aliases: ["adddjrole"],
  category: "setup commands",
  description: "Let's you define a DJ ROLE (as an array, aka you can have multiple)",
  useage: "adddj @role",
  run: async (client, message, args) => {
    if (!message.member.hasPermission("ADMINISTRATOR")) return functions.embedbuilder(client, "null", message, config.colors.no, "DJ-ROLE", `❌ Você não tem permissão para este comando!`)

    let role = message.mentions.roles.first();

    try {
      message.guild.roles.cache.get(role.id)
    } catch {
      return functions.embedbuilder(client, "null", message, config.colors.no, `ERROR`, `Parece que a Função não existe neste Servidor!`)
    }

    if (!role) return functions.embedbuilder(client, "null", message, config.colors.no, `ERROR`, `Adicione uma função via ping, @cargo!`)
    if (client.settings.get(message.guild.id, `djroles`).includes(role.id)) return functions.embedbuilder(client, "null", message, config.colors.no, `ERROR`, `Este papel é um problema na lista!`)

    message.react("✅");

    client.settings.push(message.guild.id, role.id, `djroles`);
    let leftb = "";
    if (client.settings.get(message.guild.id, `djroles`).join("") === "") leftb = "nenhum papel de Dj, também conhecido como Todos os usuários são Djs"
    else
      for (let i = 0; i < client.settings.get(message.guild.id, `djroles`).length; i++) {
        leftb += "<@&" + client.settings.get(message.guild.id, `djroles`)[i] + "> | "
      }

    return functions.embedbuilder(client, "null", message, config.colors.yes, "DJ-ROLE", `✅ Defina com sucesso o DJ ROLE para ${role}
    Todas as funções de DJ:
    > ${leftb}`)
  }
};
