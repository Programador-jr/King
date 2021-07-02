const functions = require("../../functions")
const config = require("../../config.json")
module.exports = {
    name: "search",
    category: "MUSIC COMMANDS",
		aliases:["procurar"],
    cooldown: 5,
    useage: "search <URL/NAME>",
    description: "Searches for 10 results, in youtube",
    run: async (client, message, args) => {

        //if not a dj, return error  -  Disabled because not needed
        //if(functions.check_if_dj(message))
        //return functions.embedbuilder(client, 6000, message, config.colors.no, "DJ-ROLE", `❌ You don\'t have permission for this Command! You need to have: ${functions.check_if_dj(message)}`)
    
        //if member not connected return error
        if (!message.member.voice.channel) return functions.embedbuilder(client, 5000, message, config.colors.no, "`" + message.author.tag + "`" + "Você deve entrar em um canal de voz")
        
        //if they are not in the same channel, return error but only check if bot is connected
        if (message.guild.me.voice.channel && message.member.voice.channel.id != message.guild.me.voice.channel.id) return functions.embedbuilder(client, 5000, message, config.colors.no, "`" + message.author.tag + "`" + "Você deve entrar no meu canal de voz: " + ` \`${message.guild.me.voice.channel.name ? message.guild.me.voice.channel.name : ""}\``)
                
        //if no arguments, return error
        if (!args[0]) return functions.embedbuilder(client, 5000, message, config.colors.no, "`" + message.author.tag + "`" + "Por favor, adicione algo que você queira pesquisar")
        
        //if not allowed to CONNECT to the CHANNEL
        if (!message.guild.me.permissionsIn(message.member.voice.channel).has("CONNECT"))  return functions.embedbuilder(client, 5000, message, config.colors.no, "`" + message.author.tag + "`" + " Não tenho permissão para \`entrar \` seu canal")

        //If bot not connected, join the channel
        if(!message.guild.me.voice.channel)
        message.member.voice.channel.join().catch(e=>{
            //send error if not possible
            return functions.embedbuilder(client, 5000, message, config.colors.no, "`" + message.author.tag + "`" + " Não tenho permissão para \`entrar \` seu canal")
        })
        
        //if not allowed to CONNECT to the CHANNEL
        if (!message.guild.me.permissionsIn(message.member.voice.channel).has("SPEAK")) return functions.embedbuilder(client, 5000, message, config.colors.no, "`" + message.author.tag + "`" + " Não tenho permissão para \`falar \` seu canal")


        //send information message
        functions.embedbuilder(client, 3000, message, config.colors.yes, "🔎 Procurando!", args.join(" "))

        //search tracks and send first 10 results etc
        let result = await client.distube.search(args.join(" "));

        //create variable
        let searchresult = "";

        //create string information
        for (let i = 0; i < 10; i++) {
            try {
                searchresult += await `**${i+1}**. [${result[i].name}](${result[i].url}) - \`${result[i].formattedDuration}\`\n`;
            } catch {
                searchresult += await " ";
            }
        }

        //send search result embed
        await functions.embedbuilder(client, "null", message, config.colors.yes, "🔎 Procurar Resultados:", searchresult)

        //wait for userinput
        let userinput;
        await message.channel.awaitMessages(m => m.author.id == message.author.id, {
            max: 1,
            time: 60000,
            errors: ["time"],
        }).then(collected => {
            //save userinput on var
            userinput = collected.first().content;
            //if input out of range, error
            if (Number(userinput) <= 0 && Number(userinput) > 10) {
                functions.embedbuilder(client, "null", message, config.colors.no, "Não é um número certo! "," Então eu uso o número 1!")
                userinput = 1;
            }
        }).catch(() => {
            console.error;
            userinput = 404
        });

        //if smt went wrong return error
        if (userinput === 404)  return functions.embedbuilder(client, "null", message, config.colors.no, "Algo deu errado! / O tempo acabou")
        
        //send info message
        functions.embedbuilder(client, 10000, message, config.colors.yes, "🔎 Procurando!", `[${result[userinput - 1].name}](${result[userinput - 1].url})`, result[userinput - 1].thumbnail)
        
        //play track
        client.distube.play(message, result[userinput - 1].url)
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
