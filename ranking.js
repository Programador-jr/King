const config = require("./config.json");
const c = require('colors');
const canvacord = require("canvacord");
const Discord = require("discord.js");
const prefix = config.prefix;
const embedcolor = config.embedcolor;
const maximum_leaderboard = config.maximum_leaderboard; //maximum 50 users for the leaderboard!

module.exports = function (client) {
    const description = {
        name: "ranking",
        filename: "ranking.js",
        version: "2.0"
    }
    //log that the module is loaded
    console.log(c.brightGreen(` :: Module: ${description.name} | Loaded version ${description.version} from ("${description.filename}")`))
    //voice state update event to check joining/leaving channels
    client.on("message", async (message) => {

        if (message.author.bot || !message.guild) return;
        //get the key of the user for this guild
        const key = `${message.guild.id}-${message.author.id}`;
        /**
         * databasing
         * @info General databasing, which sets the userinto the database if he types something
         */
        function databasing(rankuser) {
            //if(rankuser && rankuser.bot) return console.log("GOTTA IGNORE BOT")
            client.points.ensure(rankuser ? `${message.guild.id}-${rankuser.id}` : `${message.guild.id}-${message.author.id}`, {
                user: rankuser ? rankuser.id : message.author.id,
                usertag: rankuser ? rankuser.tag : message.author.tag,
                xpcounter: 1,
                guild: message.guild.id,
                points: 0,
                neededpoints: 400,
                level: 1,
                oldmessage: "",
            });
            client.points.set(rankuser ? `${message.guild.id}-${rankuser.id}` : `${message.guild.id}-${message.author.id}`, rankuser ? rankuser.tag : message.author.tag, `usertag`); //set the usertag with EVERY message, if he has nitro his tag might change ;)
            client.points.set(message.guild.id, 1, `setglobalxpcounter`); //set points to 0
        }
        databasing();

        /**
         * ARGUMENTS
         * @info General arguments for the Whole message Event
         */
        const args = message.content.slice(prefix.length).trim().split(/ +/g);
        const command = args.shift().toLowerCase();


        /**
         * COMMANDS
         * @info if a message starts with the prefix, then run it
         */
        if (message.content.startsWith(prefix)) {

            switch (command) {
                case `rank`:
                    rank(message.mentions.users.first()||message.author);
                    break;
                    /////////////////////////////////
                case `leaderboard`:
                case `lb`:
                    leaderboard();
                    break;
                    /////////////////////////////////
                case `setxpcounter`:
                if (!message.member.hasPermission("ADMINISTRATOR") || !message.member.hasPermission("MANAGE_GUILD")) return message.reply("Você não tem permissão para executar este cmd!")
                    setxpcounter();
                break;
                    /////////////////////////////////
                case `setglobalxpcounter`:
                if (!message.member.hasPermission("ADMINISTRATOR") || !message.member.hasPermission("MANAGE_GUILD")) return message.reply("Você não tem permissão para executar este cmd!")
                    setglobalxpcounter();
                break;
                    /////////////////////////////////
                case `addpoints`:
                    if (!message.member.hasPermission("ADMINISTRATOR") || !message.member.hasPermission("MANAGE_GUILD")) return message.reply("Você não tem permissão para executar este cmd!")
                    addpoints();
                    break;
                    /////////////////////////////////
                case `setpoints`:
                    if (!message.member.hasPermission("ADMINISTRATOR") || !message.member.hasPermission("MANAGE_GUILD")) return message.reply("Você não tem permissão para executar este cmd!")

                    setpoints();
                    break;
                    /////////////////////////////////
                case `removepoints`:
                    if (!message.member.hasPermission("ADMINISTRATOR") || !message.member.hasPermission("MANAGE_GUILD")) return message.reply("Você não tem permissão para executar este cmd!")

                    removepoints();
                    break;
                    /////////////////////////////////
                case `addlevel`:
                    if (!message.member.hasPermission("ADMINISTRATOR") || !message.member.hasPermission("MANAGE_GUILD")) return message.reply("Você não tem permissão para executar este cmd!")

                    addlevel();
                    break;
                    /////////////////////////////////
                case `setlevel`:
                    if (!message.member.hasPermission("ADMINISTRATOR") || !message.member.hasPermission("MANAGE_GUILD")) return message.reply("Você não tem permissão para executar este cmd!")

                    setlevel();
                    break;
                    /////////////////////////////////
                case `removelevel`:
                    if (!message.member.hasPermission("ADMINISTRATOR") || !message.member.hasPermission("MANAGE_GUILD")) return message.reply("Você não tem permissão para executar este cmd!")

                    removelevel();
                    break;
                    /////////////////////////////////
                case `resetranking`:
                    if (!message.member.hasPermission("ADMINISTRATOR") || !message.member.hasPermission("MANAGE_GUILD")) return message.reply("Você não tem permissão para executar este cmd!")

                    resetranking();
                    break;
                    /////////////////////////////////
                case `registerall`:
                    if (!message.member.hasPermission("ADMINISTRATOR") || !message.member.hasPermission("MANAGE_GUILD")) return message.reply("Você não tem permissão para executar este cmd!")

                    registerall();
                    break;
                    /////////////////////////////////
                case `addrandomall`:
                    if (!message.member.hasPermission("ADMINISTRATOR") || !message.member.hasPermission("MANAGE_GUILD")) return message.reply("Você não tem permissão para executar este cmd!")

                    addrandomall();
                    break;
                    /////////////////////////////////
                case `resetrankingall`:
                    if (!message.member.hasPermission("ADMINISTRATOR") || !message.member.hasPermission("MANAGE_GUILD")) return message.reply("Você não tem permissão para executar este cmd!")

                    resetrankingall()
                    break;
                    /////////////////////////////////
                case `levelhelp`:
                case `rankinghelp`:
                case `levelinghelp`:
                case `rankhelp`:
                    levelinghelp();
                    break;
                    /////////////////////////////////
                default:
                   // message.reply(`UNKNOWN COMMAND! Try: \`${prefix}levelinghelp\``)
                    break;
            }
            return;
        }


        /**
         * Anti double messages
         * @info if the old message is the same as the message before: SKIP
         */
        function anti_double_messages() {
            const oldmessage = client.points.get(key, `oldmessage`);
            if (oldmessage.toLowerCase() === message.content.toLowerCase().replace(/\s+/g, '')) {
                return console.log("DOUPLICATED MESSAGE, no ranking points sorry!");
            }
            client.points.set(key, message.content.toLowerCase().replace(/\s+/g, ''), `oldmessage`); //setting the new old message
        }
        anti_double_messages();



        /**
         * Giving Ranking Points
         * @info adding a random number rounded, between 1 and 5
         */
        function Giving_Ranking_Points(thekey, maxnumber) {
            let setglobalxpcounter = client.points.get(message.guild.id, "setglobalxpcounter")
            if (!maxnumber) maxnumber = 5;
            var randomnum = ( Math.floor(Math.random() * Number(maxnumber)) + 1 ) * setglobalxpcounter;
            randomnum *= Number(client.points.get(key, `xpcounter`));
            randomnum = Number(Math.floor(randomnum));

            const curPoints = client.points.get(thekey ? thekey : key, `points`);
            const neededPoints = client.points.get(thekey ? thekey : key, `neededpoints`);
            let leftpoints = neededPoints - curPoints;

            let toaddpoints = randomnum;
            addingpoints(toaddpoints, leftpoints);

            function addingpoints(toaddpoints, leftpoints) {
                if (toaddpoints >= leftpoints) {
                    client.points.set(thekey ? thekey : key, 0, `points`); //set points to 0
                    client.points.inc(thekey ? thekey : key, `level`); //add 1 to level
                     //get current NEW level
                    const newLevel = client.points.get(thekey ? thekey : key, `level`);
                    /**
                     * HARDEN UP THE NEXT LEVEL UP
                     * @info The neededpoints shall raise always, when the newLevel is divideable by 4, at levels: 4,8,12,16,20,24,28,32,36,40,44,...
                     */
                    if (newLevel % 4 === 0) client.points.math(thekey ? thekey : key, `+`, 100, `neededpoints`)

                    const newneededPoints = client.points.get(thekey ? thekey : key, `neededpoints`); //get NEW needed Points
                    const newPoints = client.points.get(thekey ? thekey : key, `points`); //get current NEW points

                    addingpoints(toaddpoints - leftpoints, newneededPoints); //Ofc there is still points left to add so... lets do it!
                    LEVELUP() //SEND LEVEL UP EMBED MESSAGE
                } else {
                    client.points.math(thekey ? thekey : key, `+`, Number(toaddpoints), `points`)
                }
            }
        }
        Giving_Ranking_Points();

        /**
         * CURRENT DATA
         * @info getting the current data for LEVEL, POINTS and NEEDEDPOINTS
         */
        const curLevel = client.points.get(key, `level`);
        const curPoints = client.points.get(key, `points`);
        const neededPoints = client.points.get(key, `neededpoints`);


        /**
         * LEVELUP
         * @info curPoints >= neededPoints | =>
         * @info if the current points are equal or more then the neededpoints the points shall reset and the level shall raise!
         */
        function LEVELUP() {
                const newLevel = client.points.get(key, `level`); //get current NEW level
                const newPoints = client.points.get(key, `points`); //get current NEW points
                const newneededPoints = client.points.get(key, `neededpoints`); //get NEW needed Points

                //THE INFORMATION EMBED
                const embed = new Discord.MessageEmbed()
                    .setAuthor(`Ranking de:  ${message.author.tag}`, message.member.user.displayAvatarURL({
                        dynamic: true
                    }))
                    .setDescription(`Você subiu de nível para o nível: **\`${newLevel}\`**! (Pontos: \`${newPoints}\` / \`${newneededPoints}\`) `)
                    .setColor(embedcolor);
                //send ping and embed message
                message.reply(embed);
        }


        /**
         * @param { FUNCTIONS AREA }
         * @info FUNCTIONS
         * @info Every command leads into a single function, which may or may not be able to work together!
         */

        /**
         * @info this function "BLOCK" is for the USER RANK and for LEADERBOARD
         */
        function rank(the_rankuser) {
            /**
             * GET the Rank User
             * @info you can tag him
             */
            try {
                let rankuser = the_rankuser ? the_rankuser : message.mentions.users.first() ? message.mentions.users.first() : args[0] ? args[0].length == 18 ? message.guild.members.cache.get(args[0]).user : message.guild.members.cache.find(u => u.user.username.toLowerCase().includes(String(args[0]).toLowerCase())).user : message.author
                if (!rankuser) return message.reply("ADICIONE UM RANKUSER!");
                // if(rankuser.bot) return message.reply("NO BOTS!");
                //Call the databasing function!
                const key = `${message.guild.id}-${rankuser.id}`;
                databasing(rankuser);
                //do some databasing
                const filtered = client.points.filter(p => p.guild === message.guild.id).array();
                const sorted = filtered.sort((a, b) => b.level - a.level || b.points - a.points);
                const top10 = sorted.splice(0, message.guild.memberCount);
                let i = 0;
                //count server rank sometimes an error comes
                for (const data of top10) {
                    try {
                        i++;
                        if (data.user === rankuser.id) break; //if its the right one then break it ;)
                    } catch {
                        i = `Erro de contagem de classificação`;
                        break;
                    }
                }
                //math
                let curpoints = Number(client.points.get(key, `pontos`).toFixed(2));
                //math
                let curnextlevel = Number(client.points.get(key, `neededpoints`).toFixed(2));
                //if not level == no rank
                if (client.points.get(key, `nivel`) === undefined) i = `Sem classificação`;
                //define the ranking card
                const rank = new canvacord.Rank()
                    .setAvatar(rankuser.displayAvatarURL({
                        dynamic: false,
                        format: 'png'
                    }))
                    .setCurrentXP(Number(curpoints.toFixed(2)), embedcolor)
                    .setRequiredXP(Number(curnextlevel.toFixed(2)), embedcolor)
                    .setStatus("online", true, 5)
                    .renderEmojis(true)
                    .setProgressBar(embedcolor, "COLOR")
                    .setRankColor(embedcolor, "COLOR")
                    .setLevelColor(embedcolor, "COLOR")
                    .setUsername(rankuser.username, embedcolor)
                    .setRank(Number(i), "Rank", true)
                    .setLevel(Number(client.points.get(key, `Nivel`)), "Nivel", true)
                    .setDiscriminator(rankuser.discriminator, embedcolor);
                rank.build()
                    .then(data => {
                        //add rankcard to attachment
                        const attachment = new Discord.MessageAttachment(data, "RankCard.png");
                        //define embed
                        const embed = new Discord.MessageEmbed()
                            .setTitle(`Ranking de:  ${rankuser.username}`)
                            .setColor(embedcolor)
                            .setImage("attachment://RankCard.png")
                            .attachFiles(attachment)
                        //send that embed
                        message.channel.send(embed);
                        return;
                    });
            } catch (error) {
                console.log(error.stack)
                message.reply("ADICIONE UM RANKUSER!");
            }
        }

                function leaderboardembed() {
            const filtered = client.points.filter(p => p.guild === message.guild.id).array();
            let orilent;
            const sorted = filtered.sort((a, b) => b.level - a.level || b.points - a.points);
            let embeds = [];
            let j = 0;
            let maxnum = 50;
            orilent = sorted.length;
            if(isNaN(maxnum)) {
                console.log("maximum_leaderboard NÃO É UM NÚMERO")
                maxnum = 50;}
            if (maxnum > sorted.length)
                maxnum = sorted.length + (10 - Number(String(sorted.length/10).slice(2)));
            if(maxnum < 10) maxnum = 10;
            for (let i = 10; i <= maxnum; i += 10) {
                const top = sorted.splice(0, 10);
                const embed = new Discord.MessageEmbed()
                    .setTitle(`\`${message.guild.name}\` | Entre os melhores`)
                    .setTimestamp()
                    .setDescription(`Top ${i<orilent?i:orilent}/${orilent} Ranking:`)
                    .setColor(embedcolor);
                for (const data of top) {
                    j++;
                    try {
                        embed.addField(`**${j}**. \`${data.usertag}\``, `**Pontos:** \`${data.points.toFixed(2)}\` / \`${data.neededpoints}\` | **Nivel:** \`${data.level}\``);
                    } catch {
                        embed.addField(`**${j}**. \`${data.usertag}\``, `**Pontos:** \`${data.points.toFixed(2)}\` / \`${data.neededpoints}\` | **Nivel:** \`${data.level}\``);
                    }
                }
                embeds.push(embed);
            }
            return embeds;
        }
        async function leaderboard() {
            let currentPage = 0;
            const embeds = leaderboardembed();
            if(embeds.length == 1){
                return message.channel.send(embeds[0])
            }
            const lbembed = await message.channel.send(
                `**Pagina atual - ${currentPage + 1}/${embeds.length}**`,
                embeds[currentPage]
            );

            try {
                await lbembed.react("⏪");
                await lbembed.react("⏹");
                await lbembed.react("⏩");
            } catch (error) {
                console.error(error);
            }

            const filter = (reaction, user) => ["⏪", "⏹", "⏩"].includes(reaction.emoji.name) && message.author.id === user.id;
            const collector = lbembed.createReactionCollector(filter, {
                time: 60000
            });

            collector.on("collect", async (reaction, user) => {
                try {
                    if (reaction.emoji.name === "⏩") {
                        if (currentPage < embeds.length - 1) {
                            currentPage++;
                            lbembed.edit(`**Pagina atual - ${currentPage + 1}/${embeds.length}**`, embeds[currentPage]);
                        }
                    } else if (reaction.emoji.name === "⏪") {
                        if (currentPage !== 0) {
                            --currentPage;
                            lbembed.edit(`**Pagina atual - ${currentPage + 1}/${embeds.length}**`, embeds[currentPage]);
                        }
                    } else {
                        collector.stop();
                        reaction.message.reactions.removeAll();
                    }
                    await reaction.users.remove(message.author.id);
                } catch (error) {
                    console.error(error);
                }
            });
        }

        function setxpcounter(){
            try {
            /**
                 * GET the Rank User
                 * @info you can tag him
                 */
                if (!args[0]) return message.reply("ADICIONE UM RANKUSER!");
                let rankuser = message.mentions.users.first();
                if (!rankuser) return message.reply("ADICIONE UM RANKUSER!");
                // if(rankuser.bot) return message.reply("NO BOTS!");
                //Call the databasing function!
                const key = `${message.guild.id}-${rankuser.id}`;
                databasing(rankuser);
                if (!args[1]) return message.reply("ADICIONE PONTOS PARA ADICIONAR! Uso: `setxpcounter @USER 2`");
                client.points.set(key, Number(args[1]), `xpcounter`); //set points to 0
                const embed = new Discord.MessageEmbed()
                .setColor(embedcolor)
                .setDescription(`Definido com sucesso o CONTADOR de XP para \`${args[1]}x\` for: \`${rankuser.tag}\``)
                message.reply(embed);
            } catch (error) {
                console.log(error.stack)
                message.reply("ADICIONE UM RANKUSER!");
            }
        }

        function setglobalxpcounter(){
            try {
                if (!args[0]) return message.reply("ADICIONE PONTOS PARA ADICIONAR! Uso: `setglobalxpcounter 2`");
                client.points.set(message.guild.id, Number(args[0]), `setglobalxpcounter`); //set points to 0
                const embed = new Discord.MessageEmbed()
                .setColor(embedcolor)
                .setDescription(`Definido com sucesso o CONTADOR DE XP GLOBAL para \`${args[0]}x\` para: \`${message.guild.name}\``)
                message.reply(embed);
            } catch {
            }
        }
        /**
         * @info this function "BLOCK" is for managing the POINTS, adding, setting and removing! PER USER
         */
        function addpoints(amount) {
            try {
                /**
                 * GET the Rank User
                 * @info you can tag him
                 */
                if (!args[0]) return message.reply("ADICIONE UM RANKUSER!");
                let rankuser = message.mentions.users.first();
                if (!rankuser) return message.reply("ADICIONE UM RANKUSER!");
                // if(rankuser.bot) return message.reply("NO BOTS!");
                //Call the databasing function!
                const key = `${message.guild.id}-${rankuser.id}`;
                databasing(rankuser);

                const curPoints = client.points.get(key, `points`);
                const neededPoints = client.points.get(key, `neededpoints`);
                let leftpoints = neededPoints - curPoints;
                if (!args[1] && !amount) return message.reply("ADICIONE PONTOS PARA ADICIONAR! Uso: `addpoints @USER 100`");
                if (!amount) amount = Number(args[1]);
                if (amount < 0) removepoints(amount);
                let toaddpoints = amount;
                addingpoints(toaddpoints, leftpoints);

                function addingpoints(toaddpoints, leftpoints) {
                    if (toaddpoints >= leftpoints) {
                        client.points.set(key, 0, `points`); //set points to 0
                        client.points.inc(key, `level`); //add 1 to level
                        //HARDING UP!
                        const newLevel = client.points.get(key, `level`); //get current NEW level
                        if (newLevel % 4 === 0) client.points.math(key, `+`, 100, `neededpoints`)

                        const newneededPoints = client.points.get(key, `neededpoints`); //get NEW needed Points
                        const newPoints = client.points.get(key, `points`); //get current NEW points

                        //THE INFORMATION EMBED
                        const embed = new Discord.MessageEmbed()
                            .setAuthor(`Ranking of:  ${rankuser.tag}`, rankuser.displayAvatarURL({
                                dynamic: true
                            }))
                            .setDescription(`Você subiu de nível para o nível: **\`${newLevel}\`**! (Pontos: \`${newPoints + toaddpoints - leftpoints}\` / \`${newneededPoints}\`) `)
                            .setColor(embedcolor);
                        //send ping and embed message only IF the adding will be completed!
                        if (toaddpoints - leftpoints < newneededPoints)
                            message.channel.send(rankuser, embed);

                        addingpoints(toaddpoints - leftpoints, newneededPoints); //Ofc there is still points left to add so... lets do it!
                    } else {
                        client.points.math(key, `+`, Number(toaddpoints), `points`)
                    }
                }


                const embed = new Discord.MessageEmbed()
                    .setColor(embedcolor)
                    .setDescription(`Adicionado com sucesso \`${toaddpoints} pontos\` para: \`${rankuser.tag}\``)
                message.reply(embed);
                rank(rankuser); //also sending the rankcard
            } catch (error) {
                console.log(error.stack)
                message.reply("ADICIONE UM RANKUSER!");
            }
        }

        function setpoints() {
            try {
                /**
                 * GET the Rank User
                 * @info you can tag him
                 */
                if (!args[0]) return message.reply("ADICIONE UM RANKUSER!");
                let rankuser = message.mentions.users.first();
                if (!rankuser) return message.reply("ADICIONE UM RANKUSER!");
                // if(rankuser.bot) return message.reply("NO BOTS!");
                //Call the databasing function!
                const key = `${message.guild.id}-${rankuser.id}`;
                databasing(rankuser);

                let toaddpoints = Number(args[1]);
                if (!args[1]) return message.reply("ADICIONE PONTOS PARA DEFINIR! Uso: `addpoints @USER 100`");
                if (Number(args[1]) < 0) args[1] = 0;
                const neededPoints = client.points.get(key, `neededpoints`);
                addingpoints(toaddpoints, neededPoints);

                function addingpoints(toaddpoints, neededPoints) {
                    if (toaddpoints >= neededPoints) {
                        client.points.set(key, 0, `points`); //set points to 0
                        client.points.inc(key, `level`); //add 1 to level
                        //HARDING UP!
                        const newLevel = client.points.get(key, `level`); //get current NEW level
                        if (newLevel % 4 === 0) client.points.math(key, `+`, 100, `neededpoints`)

                        const newneededPoints = client.points.get(key, `neededpoints`); //get NEW needed Points
                        const newPoints = client.points.get(key, `points`); //get current NEW points

                        //THE INFORMATION EMBED
                        const embed = new Discord.MessageEmbed()
                            .setAuthor(`Ranking of:  ${rankuser.tag}`, rankuser.displayAvatarURL({
                                dynamic: true
                            }))
                            .setDescription(`Você subiu de nível para o nível: **\`${newLevel}\`**! (Points: \`${newPoints}\` / \`${newneededPoints}\`) `)
                            .setColor(embedcolor);
                        //send ping and embed message
                        message.channel.send(rankuser, embed);

                        addingpoints(toaddpoints - neededPoints, newneededPoints); //Ofc there is still points left to add so... lets do it!
                    } else {
                        client.points.set(key, Number(toaddpoints), `points`)
                    }
                }

                const embed = new Discord.MessageEmbed()
                    .setColor(embedcolor)
                    .setDescription(`Definido com sucesso \`${toaddpoints} Pontos\` para: \`${rankuser.tag}\``)
                message.channel.send(embed);
                rank(rankuser); //also sending the rankcard
            } catch (error) {
                console.log(error.stack)
                message.reply("ADICIONE UM RANKUSER!");
            }
        }

        function removepoints(amount) {
            try {
                /**
                 * GET the Rank User
                 * @info you can tag him
                 */
                if (!args[0]) return message.reply("ADICIONE UM RANKUSER!");
                let rankuser = message.mentions.users.first();
                if (!rankuser) return message.reply("ADICIONE UM RANKUSER!");
                // if(rankuser.bot) return message.reply("NO BOTS!");
                //Call the databasing function!
                const key = `${message.guild.id}-${rankuser.id}`;
                databasing(rankuser);

                const curPoints = client.points.get(key, `points`);
                const neededPoints = client.points.get(key, `neededpoints`);

                if (!args[1] && !amount) return message.reply("ADICIONE PONTOS PARA REMOVER! Uso: `addpoints @USER 100`");
                if (!amount) amount = Number(args[1]);
                if (amount < 0) addpoints(amount);

                removingpoints(amount, curPoints);

                function removingpoints(amount, curPoints) {
                    if (amount > curPoints) {
                        let removedpoints = amount - curPoints - 1;
                        client.points.set(key, neededPoints - 1, `points`); //set points to 0
                        if (client.points.get(key, `level`) == 1) return message.reply("JÁ EM 0 PONTOS");
                        client.points.dec(key, `level`); //remove 1 from level
                        //HARDING UP!
                        const newLevel = client.points.get(key, `level`); //get current NEW level
                        if ((newLevel + 1) % 4 === 0) { //if old level was divideable by 4 set neededpoints && points -100
                            client.points.math(key, `-`, 100, `points`)
                            client.points.math(key, `-`, 100, `neededpoints`)
                        }

                        const newneededPoints = client.points.get(key, `neededpoints`); //get NEW needed Points
                        const newPoints = client.points.get(key, `points`); //get current NEW points

                        //THE INFORMATION EMBED
                        const embed = new Discord.MessageEmbed()
                            .setAuthor(`Classificação de:  ${rankuser.tag}`, rankuser.displayAvatarURL({
                                dynamic: true
                            }))
                            .setDescription(`Você desceu de nível para o nível: **\`${newLevel}\`**! (Pontos: \`${newPoints - amount + removedpoints}\` / \`${newneededPoints}\`) `)
                            .setColor(embedcolor);
                        //send ping and embed message only IF the removing will be completed!
                        if (amount - removedpoints < neededPoints)
                            message.channel.send(rankuser, embed);

                        removingpoints(amount - removedpoints, newneededPoints); //Ofc there is still points left to add so... lets do it!
                    } else {
                        client.points.math(key, `-`, Number(amount), `points`)
                    }
                }

                const embed = new Discord.MessageEmbed()
                    .setColor(embedcolor)
                    .setDescription(`Removido com sucesso \`${amount} Pontos\` de: \`${rankuser.tag}\``)
                message.reply(embed);
                rank(rankuser); //also sending the rankcard
            } catch (error) {
                console.log(error.stack)
                message.reply("ADICIONE UM RANKUSER!");
            }
        }

        /**
         * @info this function "BLOCK" is for managing the LEVELS, adding, setting and removing! PER USER
         */
        function addlevel() {
            try {
                /**
                 * GET the Rank User
                 * @info you can tag him
                 */
                if (!args[0]) return message.reply("ADICIONE UM RANKUSER!");
                let rankuser = message.mentions.users.first();
                if (!rankuser) return message.reply("ADICIONE UM RANKUSER!");
                // if(rankuser.bot) return message.reply("NO BOTS!");

                //Call the databasing function!
                const key = `${message.guild.id}-${rankuser.id}`;
                databasing(rankuser);
                let newLevel = client.points.get(key, `level`);
                if (!args[1]) return message.reply("Por favor, adicione a quantidade de níveis que você deseja adicionar! Uso: addlevel @User 4");
                if (Number(args[1]) < 0) args[1] = 0;
                for (let i = 0; i < Number(args[1]); i++) {
                    client.points.set(key, 0, `points`); //set points to 0
                    client.points.inc(key, `level`); //add 1 to level
                    //HARDING UP!
                    newLevel = client.points.get(key, `level`); //get current NEW level
                    if (newLevel % 4 === 0) client.points.math(key, `+`, 100, `neededpoints`)
                }
                const newneededPoints = client.points.get(key, `neededpoints`); //get NEW needed Points
                const newPoints = client.points.get(key, `points`); //get current NEW points

                //THE INFORMATION EMBED
                const embed = new Discord.MessageEmbed()
                    .setAuthor(`Ranking de:  ${rankuser.tag}`, rankuser.displayAvatarURL({
                        dynamic: true
                    }))
                    .setDescription(`Você subiu de nível para o nível: **\`${newLevel}\`**! (Pontos: \`${newPoints}\` / \`${newneededPoints}\`) `)
                    .setColor(embedcolor);
                message.channel.send(rankuser, embed);
                rank(rankuser); //also sending the rankcard
                const sssembed = new Discord.MessageEmbed()
                .setColor(embedcolor)
                .setDescription(`Adicionado com sucesso ${args[1]} Níveis para: \`${rankuser.tag}\``)
                message.reply(sssembed);
            } catch (error) {
                console.log(error.stack)
                message.reply("ADICIONE UM RANKUSER!");
            }
        }

        function setlevel() {
            try {
                /**
                 * GET the Rank User
                 * @info you can tag him
                 */
                if (!args[0]) return message.reply("ADICIONE UM RANKUSER!");
                let rankuser = message.mentions.users.first();
                if (!rankuser) return message.reply("ADICIONE UM RANKUSER!");
                // if(rankuser.bot) return message.reply("NO BOTS!");

                //Call the databasing function!
                const key = `${message.guild.id}-${rankuser.id}`;
                databasing(rankuser);

                if (!args[1]) return message.reply("Por favor, adicione a quantidade de níveis que você deseja definir! Uso: setlevel @User 3");
                if (Number(args[1]) < 1) args[1] = 1;
                client.points.set(key, Number(args[1]), `level`); //set level to the wanted level
                client.points.set(key, 0, `points`); //set the points to 0

                let newLevel = client.points.get(key, `level`); //set level to the wanted level
                let counter = Number(newLevel) / 4;

                client.points.set(key, 400, `neededpoints`) //set neededpoints to 0 for beeing sure
                //add 100 for each divideable 4
                for (let i = 0; i < Math.floor(counter); i++) {
                    client.points.math(key, `+`, 100, `neededpoints`)
                }
                const newneededPoints = client.points.get(key, `neededpoints`); //get NEW needed Points

                const newPoints = client.points.get(key, `points`); //get current NEW points
                //THE INFORMATION EMBED
                const embed = new Discord.MessageEmbed()
                    .setAuthor(`Ranking de:  ${rankuser.tag}`, rankuser.displayAvatarURL({
                        dynamic: true
                    }))
                    .setDescription(`Você subiu de nível para o nível: **\`${newLevel}\`**! (Points: \`${newPoints}\` / \`${newneededPoints}\`) `)
                    .setColor(embedcolor);
                message.channel.send(rankuser, embed);
                rank(rankuser); //also sending the rankcard
                const sssembed = new Discord.MessageEmbed()
                .setColor(embedcolor)
                .setDescription(`Definido com sucesso \`${rankuser.tag}\` para o nível: ${args[1]}`)
                message.reply(sssembed);
            } catch (error) {
                console.log(error.stack)
                message.reply("ADICIONE UM RANKUSER!");
            }
        }

        function removelevel() {
            try {
                /**
                 * GET the Rank User
                 * @info you can tag him
                 */
                if (!args[0]) return message.reply("ADICIONE UM RANKUSER!");
                let rankuser = message.mentions.users.first();
                if (!rankuser) return message.reply("ADICIONE UM RANKUSER!");
                // if(rankuser.bot) return message.reply("NO BOTS!");

                //Call the databasing function!
                const key = `${message.guild.id}-${rankuser.id}`;
                databasing(rankuser);
                let newLevel = client.points.get(key, `level`);
                if (!args[1]) return message.reply("Por favor, adicione a quantidade de níveis que você deseja remover! Uso: removelevel @User 4");
                if (Number(args[1]) < 0) args[1] = 0;
                for (let i = 0; i < Number(args[1]); i++) {
                    client.points.set(key, 0, `points`); //set points to 0
                    client.points.dec(key, `level`); //add 1 to level
                    //HARDING UP!
                    newLevel = client.points.get(key, `level`); //get current NEW level
                    if(newLevel < 1) client.points.set(key, 1 ,`level`); //if smaller then 1 set to 1
                }
                snewLevel = client.points.get(key, `level`); //get current NEW level
                let counter = Number(snewLevel) / 4;

                client.points.set(key, 400, `neededpoints`) //set neededpoints to 0 for beeing sure
                //add 100 for each divideable 4
                for (let i = 0; i < Math.floor(counter); i++) {
                    client.points.math(key, `+`, 100, `neededpoints`)
                }
                const newneededPoints = client.points.get(key, `neededpoints`); //get NEW needed Points
                const newPoints = client.points.get(key, `points`); //get current NEW points

                //THE INFORMATION EMBED
                const embed = new Discord.MessageEmbed()
                    .setAuthor(`Ranking de:  ${rankuser.tag}`, rankuser.displayAvatarURL({
                        dynamic: true
                    }))
                    .setDescription(`Você desceu de nível para o nível: **\`${newLevel}\`**! (Pontos: \`${newPoints}\` / \`${newneededPoints}\`) `)
                    .setColor(embedcolor);
                message.channel.send(rankuser, embed);
                rank(rankuser); //also sending the rankcard
                const sssembed = new Discord.MessageEmbed()
                .setColor(embedcolor)
                .setDescription(`Removido com sucesso \`${args[0]}\` Níveis de:  \`${rankuser.tag}\``)
                message.reply(sssembed);
            } catch (error) {
                console.log(error.stack)
                message.reply("ADICIONE UM RANKUSER!");
            }
        }

        /**
         * @info This function is for ressetting a single USER
         */
        function resetranking() {
            try {
                /**
                 * GET the Rank User
                 * @info you can tag him
                 */
                if (!args[0]) return message.reply("ADICIONE UM RANKUSER!");
                let rankuser = message.mentions.users.first();
                if (!rankuser) return message.reply("ADICIONE UM RANKUSER!");
                // if(rankuser.bot) return message.reply("NO BOTS!");

                //Call the databasing function!
                const key = `${message.guild.id}-${rankuser.id}`;
                databasing(rankuser);

                client.points.set(key, 1, `level`); //set level to 0
                client.points.set(key, 0, `points`); //set the points to 0
                client.points.set(key, 400, `neededpoints`) //set neededpoints to 0 for beeing sure
                client.points.set(key, "", `oldmessage`); //set old message to 0

                //THE INFORMATION EMBED
                const embed = new Discord.MessageEmbed()
                    .setAuthor(`Ranking of:  ${rankuser.tag}`, rankuser.displayAvatarURL({
                        dynamic: true
                    }))
                    .setDescription(`Você foi redefinido para o nível: **\`1\`**! (Pontos: \`0\` / \`400\`) `)
                    .setColor(embedcolor);
                message.channel.send(rankuser, embed);
                rank(rankuser); //also sending the rankcard
                const sssembed = new Discord.MessageEmbed()
                .setColor(embedcolor)
                .setDescription(`Classificação redefinida com sucesso de:  \`${rankuser.tag}\``)
                message.reply(sssembed);
            } catch (error) {
                console.log(error.stack)
                message.reply("ADICIONE UM RANKUSER!");
            }
        }


        /**
         * @info this function "BLOCK" is for managing the POINTS for EVERYONE, like randompoints to EVERYONE, and registering EVERYONE and resetting EVERYONE
         */
        function registerall() {
            let allmembers = message.guild.members.cache.keyArray();
            for (let i = 0; i < allmembers.length; i++) {
                //Call the databasing function!
                let rankuser = message.guild.members.cache.get(allmembers[i]).user;
                databasing(rankuser);
            }
            const embed = new Discord.MessageEmbed()
            .setColor(embedcolor)
            .setDescription(`Todos registrados com sucesso
`)
            message.reply(embed);
        }

        function resetrankingall() {
            let allmembers = message.guild.members.cache.keyArray();
            for (let i = 0; i < allmembers.length; i++) {
                let rankuser = message.guild.members.cache.get(allmembers[i]).user;
                const key = `${message.guild.id}-${rankuser.id}`;
                client.points.set(key, 1, `level`); //set level to 0
                client.points.set(key, 0, `points`); //set the points to 0
                client.points.set(key, 400, `neededpoints`) //set neededpoints to 0 for beeing sure
                client.points.set(key, "", `oldmessage`); //set old message to 0
            }
            const embed = new Discord.MessageEmbed()
            .setColor(embedcolor)
            .setDescription(`Reiniciou todos com sucesso`)
            message.reply(embed);
        }

        function addrandomall() {
            let maxnum = 5;
            if (args[0]) maxnum = Number(args[0]);
            let allmembers = message.guild.members.cache.keyArray();
            for (let i = 0; i < allmembers.length; i++) {
                //Call the databasing function!
                let rankuser = message.guild.members.cache.get(allmembers[i]).user;
                databasing(rankuser);
                if(rankuser.bot) continue;
                Giving_Ranking_Points(`${message.guild.id}-${rankuser.id}`, maxnum);
                Giving_Ranking_Points(`${message.guild.id}-${message.author.id}`, maxnum);
            }
            const embed = new Discord.MessageEmbed()
            .setColor(embedcolor)
            .setDescription(`Adicionados ${args[0]} pontos com sucesso para todos`)
            message.reply(embed);
        }



        function levelinghelp() {
            const embed = new Discord.MessageEmbed()
                .setTitle(`\`${message.guild.name}\` | Comandos de Ranking`)
                .setTimestamp()
                .setDescription(`> **HELP:**  \`${prefix}levelinghelp\``)
                .setColor(embedcolor)
                .addFields([{
                        name: "`rank [@User]`",
                        value: ">>> *Mostra a classificação de um usuário*",
                        inline: true
                    },
                    {
                        name: "`leaderboard`",
                        value: ">>> *Mostra o ranking dos 10 principais*",
                        inline: true
                    },
                    {
                        name: "`setxpcounter <@USER> <VALOR>`",
                        value: ">>> *Altera a quantidade de quanto contar, x1, x2, x3, ...*",
                        inline: true
                    },

                    {
                        name: "`addpoints <@User> <VALOR>`",
                        value: ">>> *Adicione uma quantidade específica de pontos a um usuário*",
                        inline: true
                    },
                    {
                        name: "`setpoints <@User> <Amount`",
                        value: ">>> *Defina uma quantidade específica de pontos para um usuário*",
                        inline: true
                    },
                    {
                        name: "`removepoints <@User> <Amount`",
                        value: ">>> *Remover uma quantidade específica de pontos para um usuário*",
                        inline: true
                    },

                    {
                        name: "`addlevel <@User> <Amount`",
                        value: ">>> *Adicionar uma quantidade específica de níveis a um usuário*",
                        inline: true
                    },
                    {
                        name: "`setlevel <@User> <Amount`",
                        value: ">>> *Defina uma quantidade específica de níveis para um usuário*",
                        inline: true
                    },
                    {
                        name: "`removelevel <@User> <Amount`",
                        value: ">>> *Remova uma quantidade específica de níveis para um usuário*",
                        inline: true
                    },

                    {
                        name: "`resetranking <@User>`",
                        value: ">>> *Redefine a classificação de um usuário*",
                        inline: true
                    },
                    {
                        name: "`setglobalxpcounter <AMOUNT>`",
                        value: ">>> *Define o contador de XP global para esta guilda, padrão 1*",
                        inline: true
                    },
                    {
                        name: "\u200b",
                        value: "\u200b",
                        inline: true
                    },

                    {
                        name: "`registerall`",
                        value: ">>> *Registre todos no servidor para o banco de dados*",
                        inline: true
                    },
                    {
                        name: "`resetrankingall`",
                        value: ">>> *Redefinir a classificação de todos neste servidor*",
                        inline: true
                    },
                    {
                        name: "`addrandomall`",
                        value: ">>> *Adicione uma quantidade aleatória de pontos para todos*",
                        inline: true
                    }
                ])
            message.channel.send(embed)
        }

    })
}


//Coded by Tomato#6966!