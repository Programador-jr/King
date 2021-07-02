const discord = require("discord.js");
const fetch = require("node-fetch");

module.exports = {
	name:"tgif",
	category:"imagem",

	run:async (client, message, args) => {
  var query = args.join(' ');
  fetch(`https://api.tenor.com/v1/random?q=${query}&key=` + process.env.TENOR)  //obter no site do Tenor
    .then(res => res.json())
    .then(json => message.channel.send(json.results[0].url))
    .catch(e => {
      message.channel.send('Falha ao encontrar um GIF que corresponda à sua consulta');
      // console.error(e);
      return;
    });
}
};