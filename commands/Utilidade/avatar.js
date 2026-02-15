const Discord = require('discord.js');

module.exports = {
  name: 'avatar',
  category: "Utilidade",
  description: "Mostra o avatar do usuario informado.",
  aliases: ['avatar', 'pfp'],
  cooldown: 5,
  guildOnly: false,

  run: async(client, message, args) => {
    if (!message.guild.me.permissions.has('ATTACH_FILES')) return message.reply('Eu preciso da permissão `enviar arquvios` para fazer isso!');

    const user = message.mentions.users.first() || client.users.cache.get(args[0]) || message.author;

    const avatar = user.displayAvatarURL({ dynamic: true, size: 1024 });
    const embed = new Discord.MessageEmbed()
      .setColor('#00bfff')
      .setTitle(`Avatar de ${user.username}`)
      .setDescription(`Clique [aqui](${avatar}) para baixar o avatar`)
      .setImage(avatar);
    await message.reply({embeds: [embed]});
  },
};
