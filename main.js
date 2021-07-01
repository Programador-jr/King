//Modules
const ScrapeYt = require("scrape-yt");
const spotify = require("spotify-url-info")
const Discord = require("discord.js");
const YTDL = require("discord-ytdl-core");
const { createWriteStream } = require("fs");

//Config file
const config = require('./config.json');

//New discord.js client
const Client = new Discord.Client();

//Event ready
Client.on("ready", () => {
    //If the bot is ready it returns a message in the console
    console.log("I'm ready !");
});

Client.on("message", async message => {

    //Do not detect bots
    if (message.author.bot) return;

    //If '<prefix>linkdownload' is typed
    if (message.content.startsWith(config.prefix + "baixar")) {

        //Require args
        let args = message.content.split(' ').slice(1);

        //If no args is provided
        if (!args[0]) return message.channel.send(`⛔ | ${message.author}, Please enter the YouTube URL of a song !`);

        //New infos & stream
        let infos;
        let stream;

        try {
            //The bot is trying to find the music provided
            stream = YTDL(args.join(" "), { encoderArgs: ['-af','dynaudnorm=f=200'], fmt: 'mp3', opusEncoded: false });
            infos = await ScrapeYt.search(args.join(" "));
        } catch (e) {
            //If the music is not found
            return message.channel.send(`⛔ | ${message.author}, I didn't find anything for : ${args.join(" ")} !`);
        }

        try {
            //Confirmation message
            message.channel.send(`:notes: | ${message.author},  I'll try to send ${infos[0].title} when the download is finished...`);

            //Saving the file in the folder 'download'
            stream.pipe(createWriteStream(__dirname + `/download/${infos[0].title}.mp3`)).on('finish', () => {

                //Sending the mp3 file
                try {
                    message.channel.send(`🎵 | ${message.author}, music : ${infos[0].title} in mp3.`, new Discord.MessageAttachment(__dirname + `/download/${infos[0].title}.mp3`, `${infos[0].title}.mp3`))
                } catch (e) {
                    return message.channel.send(`⛔ | ${message.author}, I didn't manage to send the music... maybe it's too heavy for Discord ? Or maybe I don't have the required permissions to upload this type of file on this server...`);
                }

            })
        } catch (e) {
            //If the music is not found
            return message.channel.send(`⛔ | ${message.author}, I didn't find anything for : ${args.join(" ")} ! Maybe it is impossible to retrieve this music...`);
        }
    }

});

//Client login
Client.login(config.token);