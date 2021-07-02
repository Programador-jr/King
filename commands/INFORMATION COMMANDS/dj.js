const functions = require("../../functions")
const config = require("../../config.json")
module.exports = {
    name: "dj",
    aliases: ["dj"],
    category: "INFORMATION COMMANDS",
    description: "Qual é o DJ",
    useage: "dj",
    run: async (client, message, args) => {
        if (!functions.check_if_dj(message))
            return functions.embedbuilder(client, 6000, message, config.colors.no, "DJ-ROLE", `❌ Não há  cargo de DJ`)  

        return functions.embedbuilder(client, "null", message, config.colors.yes, "DJ-ROLE", `Estes são os DJs`, `${functions.check_if_dj(message)}`)
    }
}