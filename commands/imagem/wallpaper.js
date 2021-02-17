const { Random } = require("something-random-on-discord")
const random = new Random();

module.exports = {
  name: "wallpaper",
  category: "imagem",
  description: "Obtenha algumas imagens neko",
  run: async (client, message, args) => {
    
    let data = await random.getNeko()
    message.channel.send(data)
    
  }
}