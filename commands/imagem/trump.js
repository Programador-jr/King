const { MessageEmbed } = require("discord.js");
const Discord = require('discord.js');
const fetch = require('node-fetch');
const config = require('../../config.json')

module.exports = {
	name:"trump",
	run:async (client, message, args, default_prefix) => {
  
    let text = args.join(" ");

        if (!text) {
            return message.channel.send("indique o tweet.");
        }

        let m = await message.channel.send("espere um pouco...");
        try {
            let res = await fetch(encodeURI(`https://nekobot.xyz/api/imagegen?type=trumptweet&text=${text}`));
            let json = await res.json();
            let attachment = new Discord.MessageAttachment(json.message, "clyde.png");

            const trump = new Discord.MessageEmbed()
            .setTitle('<:db_twitter:782665233114202182> | Trump Tweet')
            .setColor('')
            .setImage(json.message)
            .setFooter(`${message.author.tag}`, message.author.displayAvatarURL({ dynamic: true, size: 2048 }))

            message.channel.send(trump);
            m.delete({ timeout: 3000 });
        } catch (e) {
            m.edit(e.message);
        }
    
  }
	}