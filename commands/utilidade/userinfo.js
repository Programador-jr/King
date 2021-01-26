const { MessageEmbed } = require("discord.js")
const moment = require("moment")

module.exports = {
  name: "userinfo",
  aliases: ["user"],
  usage: "userinfo <@user>",
	category: "utilidade",
  description: "Obtenha estatísticas avançadas de determinada pessoa ou de você mesmo",
  run: async (client, message, args) => {


    let user;

    if (!args[0]) {
      user = message.member;
    } else {


      if (isNaN(args[0])) return message.channel.send(":x: ID do usuário inválido.")


      user = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(err => { return message.channel.send(":x: Incapaz de encontrar esse usuario") })
    }

    if (!user) {
      return message.channel.send(":x: Incapaz de encontrar esse usuario!")
    }


    //OPÇÕES DE STATUS

    let stat = {
      online: "https://emoji.gg/assets/emoji/9166_online.png",
      idle: "https://emoji.gg/assets/emoji/3929_idle.png",
      dnd: "https://emoji.gg/assets/emoji/2531_dnd.png",
      offline: "https://emoji.gg/assets/emoji/7445_status_offline.png"
    }

    //AGORA EMBLEMAS
    let badges = await user.user.flags
    badges = await badges.toArray();

    let newbadges = [];
    badges.forEach(m => {
      newbadges.push(m.replace("_", " "))
    })

    let embed = new MessageEmbed()
      .setThumbnail(user.user.displayAvatarURL({ dynamic: true }))

    //ATIVIDADE
    let array = []
    if (user.user.presence.activities.length) {

      let data = user.user.presence.activities;

      for (let i = 0; i < data.length; i++) {
        let name = data[i].name || "None"
        let xname = data[i].details || "None"
        let zname = data[i].state || "None"
        let type = data[i].type

        array.push(`**${type}** : \`${name} : ${xname} : ${zname}\``)

        if (data[i].name === "Spotify") {
          embed.setThumbnail(`https://i.scdn.co/image/${data[i].assets.largeImage.replace("spotify:", "")}`)
        }

        embed.setDescription(array.join("\n"))

      }
    }

      //COR EMBADA COM BASE NO membro
      embed.setColor(user.displayHexColor === "#000000" ? "#ffffff" : user.displayHexColor)

      //OUTRAS COISAS 
      embed.setAuthor(user.user.tag, user.user.displayAvatarURL({ dynamic: true }))

      //VERIFIQUE SE O USUÁRIO TEM NICKNAME
      if (user.nickname !== null) embed.addField("Nickname", user.nickname)
      embed.addField("Conta Criada em:", moment(user.user.createdAt).format("DD/MM/YY - HH:mm"))
        .addField("Entrou em:", moment(user.user.joinedAt).format("DD/MM/YY - HH:mm"))
        .addField("Informação Comum", `ID: \`${user.user.id}\`\nDiscriminador: ${user.user.discriminator}\nBot: ${user.user.bot}\nUsuário deletado: ${user.deleted}`)
        .addField("Emblemas", newbadges.join(", ").toLowerCase() || "None")
        .setFooter(user.user.presence.status, stat[user.user.presence.status])



      return message.channel.send(embed).catch(err => {
        return message.channel.send("Error : " + err)
      })



    }



  }