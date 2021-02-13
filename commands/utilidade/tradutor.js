//Codigo copiado e modificado de WinG4merBR codigo original aqui: (https://github.com/BotFoxy/Foxy.git)

const {MessageEmbed} = require('discord.js');
const translate = require('@k3rn31p4nic/google-translate-api');

module.exports = {
    
    name: "tradutor",
    aliases: ['translate' ,'traduzir'],
		category:"utilidade",



	run: async (client, message, args) => {
    const roleColor =
      message.guild.me.displayHexColor === "#00FFFF"
        ? "##00BFFF"
        : message.guild.me.displayHexColor;

        let language = args[0];
        let text = args.slice(1).join(" ")
    
            if(!language) return message.reply("Especifique um idioma")
    
            if (language.length !== 2) return message.reply('Use apenas abreviações. Exemplo: `k!language en Olá Mundo!`')
           
            if(!text) return message.reply('Insira um texto')
    
        const result = await translate(text, { to: language})
    
        let embed = new MessageEmbed()
        .setColor(roleColor)
        .setTitle(':globe_with_meridians: | Tradutor')
        .setDescription(`\ \ \`\`\`\n${result.text}\n\`\`\``)
    
    
        message.channel.send(`${message.author}`, embed)
        
  }
}