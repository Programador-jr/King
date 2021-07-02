const Discord = require("discord.js");
const {token, default_prefix} = require('./config.json');
const Canvas = require("canvas");
const {Core, Player, Pile, Card} = require("./core.js"); // Pile and Card are imported for console-use. They are not directly used in this file.

// Load built-in card games
const baseUno = require("./uno.js");
//import baseExkit from "./baseExkit.js";

const client = new Discord.Client();
const {createCanvas, loadImg} = Canvas;
let ans = null;
let exited = false;
let submissions = [];

const globalGames = new Map();
globalGames.set("players", {});

bot.on("warn", console.warn);
bot.on("error", console.error);
bot.on("ready", () => {
	console.log(`Logged in as ${bot.user.tag}`);
	bot.user.setActivity("Card Games - !help", {type: "PLAYING"});
});

bot.on("message", async msg => {
	if (exited !msg.content.startsWith("log ") && !msg.member.id === "224285881383518208") return;
	const args = msg.content.split(" ");
	const channel = msg.channel;
	const member = msg.member || msg.author;
	const globalPlayers = globalGames.get("players");
	/**@type {?Discord.Guild} */
	const guild = msg.guild || globalPlayers[member.id];
	/**@type {Core} */
	const serverGame = guild ? globalGames.get(guild.id) : null;
	if (msg.content.startsWith("!")) {
		// TODO: allow discord admin to always be leaders.
		const isLeader = serverGame?.players[member.id]?.isLeader;
		if (serverGame && serverGame.meta.timeLimit > 0 && serverGame.meta.phase > 2) serverGame.resetTimeLimit();
		switch (args[0].substr(1).toLowerCase()) {
			// TODO: reorganize the placement of each command in the code.
			// TODO: add a command which saves the current rule settings as the default for next games. (Only available for discord admin.)
			// TODO: restrict submit and select to my podcast server only.
			case "submit":
				submissions.push(args.slice(1).join(" "));
				channel.send("Submission Recieved!");
				break;
			case "select":
				// TODO: select only the submissions that the member didn't submit.
				channel.send(Core.shuffle(submissions).pop());
				break;
			case "help":
				channel.send("https://github.com/Bedrockbreaker/unobot/wiki");
				break;
			case "p":
			case "play":
				if (!guild) return;
				if (serverGame) return channel.send("A game is already in progress!");
				if (globalPlayers[member.id]) return channel.send("You're already in a game in a different server!");
				if (args.length === 1) return channel.send("Usage: `!(p|play) 𝘨𝘢𝘮𝘦`. Playable games: `uno`, `explodingKittens`");
				let newGame;
				switch (args[1].toLowerCase()) {
					case "uno":
						newGame = new baseUno(channel, member, new Player(member, [], true, 0, {}));
						break;
					case "exploding":
					case "kittens":
					case "explodingkittens":
					case "exkit":
						return channel.send("Please wait for the v3.5.0 update!");
						//newGame = new exkitCore();
						break;
					default:
						return channel.send(`\`${args[1]}\` isn't a recognized game!`);
				}
				globalGames.set(guild.id, newGame);
				globalPlayers[member.id] = guild;
				channel.send(`Who's joining \`${newGame.meta.title}\`? (Type \`!join\` to join. When finished, type \`!start\`)\nPlayers: ${member.displayName}`);
				break;
			case "j":
			case "join":
				if (!serverGame) return channel.send("Usage: `!(j|join)`. Joins a game currently accepting players. Type `!play` to start a game!");
				if (serverGame.players.hasOwnProperty(member.id)) return channel.send("You're already in that game!");
				if (!serverGame.meta.allowsMidGameJoin) return channel.send("This game currently isn't accepting players!");
				if (globalPlayers[member.id]) return channel.send("You're already in a different game in a different server!");
				serverGame.addPlayer(member);
				globalPlayers[member.id] = guild;
				channel.send(`Who's joining \`${serverGame.meta.title}\`? (Type \`!join\` to join. When finished, type \`!start\`)\nPlayers: ${Object.values(serverGame.players).reduce((acc, player) => {return `${acc}${player.member.displayName}, `}, "").slice(0,-2)}`);
				break;
			case "s":
			case "start":
				if (!serverGame) return channel.send("Usage: `!(s|start)`. Starts a game. Type `!play` to begin playing a game.");
				if (!isLeader) return channel.send("Only the leader can start the game!");
				if (serverGame.meta.phase >= 2) return channel.send("The game has already started!");
				// TODO: move this into Core
				// TODO: add a voting system, keeping this as well. Default to leader only, but the leader may open it up to voting, or public voting (the entire server can vote, not just those in the game).
				if (serverGame.meta.phase < 1) {
					serverGame.meta.phase = 1;
					serverGame.setup();
					if (Object.keys(serverGame.meta.rules).length) { // If there are custom rules...
						const rulesEmbed = new Discord.MessageEmbed()
							.setTitle("What rules is this game being played by?\n(respond by submitting reaction emojis)")
							.setDescription(`**When you are done changing the rules, type \`!start\`\nCommands for Playing: https://github.com/Bedrockbreaker/unobot/wiki/${serverGame.meta.title.replace(/ /g, "-")}**\n\n${Object.values(serverGame.meta.rules)[0][0]}`)
							.setColor(Math.floor(Math.random() * 16777215) + 1);
						for (let i = 0; i < Object.keys(serverGame.meta.rules).length-1; i++) {
							rulesEmbed.addField(serverGame.meta.rules[Object.keys(serverGame.meta.rules)[i]][1], serverGame.meta.rules[Object.keys(serverGame.meta.rules)[i+1]][0]);
						}
						rulesEmbed.addField(serverGame.meta.rules[Object.keys(serverGame.meta.rules)[Object.keys(serverGame.meta.rules).length-1]][1],"Vote below by reacting with emojis!");
						serverGame.meta.channel.send(rulesEmbed)
							.then(message => {
								serverGame.meta.rulesEmbed = message;
								addReaction(message, serverGame.meta.rules, 0);
							})
							.then(() => {
								serverGame.meta.ruleReactor = serverGame.meta.rulesEmbed.createReactionCollector((reaction, member) => {
									return Object.values(serverGame.meta.rules).map(rule => rule[2]).includes(reaction.emoji.name) && member.id === Object.values(serverGame.players).find(player => player.isLeader).member.id;
								});
								serverGame.meta.ruleReactor.on("end", collection => {
									const ruleBools = Object.values(serverGame.meta.rules).map(rule => collection.map(reaction => reaction.emoji.name).includes(rule[2]));
									for (let i in ruleBools) {
										serverGame.meta.rules[Object.keys(serverGame.meta.rules)[i]] = ruleBools[i];
									}
								});
							});
						return;
					}
				}
				serverGame.start();
				break;
			case "quit":
				if (!serverGame) return channel.send("Usage: `!quit`. Quit from a game you have currently joined. Start a game with `!play`");
				if (!serverGame.players.hasOwnProperty(member.id)) return channel.send("You can't quit from a game you haven't joined!");
				serverGame.removePlayer(serverGame.players[member.id]);
				delete globalPlayers[member.id];
				if (Object.keys(serverGame.players).length !== 0) return channel.send(`Bye <@${member.id}>!`);
				globalGames.delete(guild.id);
				channel.send("Stopping game..");
				break;
			case "kick":
				if (!serverGame) return channel.send("Usage: `!kick @𝘶𝘴𝘦𝘳`. Kicks the mentioned user from the current game. Start a game with `!play`");
				if (!isLeader) return channel.send("Only the leader can kick people!");
				const kickedUser = args[1].replace(/<@!?(\d*)>/, "$1");
				if (!serverGame.players.hasOwnProperty(kickedUser)) return channel.send(`Unable to find ${args[1]}!tAre they in the game? Did you @ them?`);
				serverGame.removePlayer(member);
				channel.send(`Who's joining \`${serverGame.meta.title}\`? (Type \`!join\` to join. When finished, type \`!start\`)\nPlayers: ${Object.values(serverGame.players).reduce((acc, player) => {return `${acc}${player.member.displayName}, `}, "").slice(0,-2)}>`);
				delete globalPlayers[member.id];
				if (Object.keys(serverGame.players).length !== 0) return channel.send(`Kicked <@${kickedUser}>`);
				globalGames.delete(guild.id);
				channel.send("Stopping game..");
				break;
			case "tl":
			case "timelimit":
				if (!serverGame) return channel.send("Usage: `!(tl|timelimit) 𝘯𝘶𝘮`. Changes the turn time limit to *num* seconds. If set to 0, the time limit is disabled. Start a game with `!play`");
				if (!isLeader) return channel.send("Only the leader can change that!");
				if (isNaN(Number(args[1]))) return channel.send(args[1] === undefined ? "Please specify a number!" : `\`${args[1]}\` is not a valid number!`);
				serverGame.meta.timeLimit = Math.abs(Math.floor(Number(args[1])));
				serverGame.resetTimeLimit();
				channel.send(`Changed the turn time limit to ${serverGame.meta.timeLimit} seconds`);
				break;
			case "mgj":
			case "midgamejoin":
				if (!serverGame) return channel.send("Usage: `!midgamejoin`. Toggles the option to allow people to join in the middle of a game. Defaults to true. Start a game with `!play`");
				if (!isLeader) return channel.send("Only the leader can change that!");
				serverGame.meta.allowsMidGameJoin = !serverGame.meta.allowsMidGameJoin;
				channel.send(`Currently ${serverGame.meta.allowsMidGameJoin ? "A" : "Disa"}llowing people to join mid-game`);
				break;
			case "endgame":
				if (!serverGame) return channel.send("Usage: `!endgame`. Abruptly ends the game. Start a game with `!play`");
				if (!isLeader) return channel.send("Only the leader can abruptly end the game!");
				Object.keys(serverGame.players).forEach(playerID => delete globalPlayers[playerID]);
				globalGames.delete(guild.id);
				channel.send("Stopping game..");
				break;
			default:
				if (!serverGame) return;
				serverGame.discard([args[0].substring(1), ...args.slice(1)], member, channel);
				delete globalPlayers[serverGame.meta.deletePlayer]; // Since most of the time deletePlayer is 0, this won't do anything. It just continues silently.
				serverGame.meta.deletePlayer = 0;
				if (serverGame.meta.ended) {
					Object.keys(serverGame.players).forEach(playerID => delete globalPlayers[playerID]);
					globalGames.delete(guild.id);
				}
				break;
		}
	}
	if (member.id === "224285881383518208") {
		switch(args[0]) {
			case "log":
				try {
					ans = eval(args.splice(1).join(" "));
					console.log(ans);
				} catch(err) {
					console.error(err);
				}
				break;
			case "msg":
				try {
					ans = eval(args.splice(1).join(" "));
					if (typeof ans === "undefined") ans = "undefined";
					if (ans === null) ans = "null";
					if (!ans) ans = ans.toString();
					channel.send(ans);
				} catch(err) {
					channel.send(err);
				}
				break;
			case "del":
				if (isNaN(Number(args[1]))) return;
				channel.messages.fetch({ limit: Number(args[1])+1 }).then(msgColl => channel.bulkDelete(msgColl).then(delMsgs => console.log(`deleted ${delMsgs.size-1} messages`)));
				break;
		}
	}
	// Actively discourages the use of "lol," "lel," or "lul" in my own discord servers.
	if (guild && ["614241181341188159", "449762523353186315", "563223150012268567", "582345451689213953"].includes(guild.id) && msg.content.match(/([^a-z]|o|e|u|^)l(o|e|u)l([^a-z]|o|e|u|$)/im)) {
		const lol = new Discord.MessageEmbed()
			.setColor(Math.floor(Math.random()*16777215)+1)
			.setImage("https://cdn.discordapp.com/attachments/563223150569979909/694432954318979122/lol.png");
		channel.send(lol);
	}
});

bot.on("voiceStateUpdate", (oldMem, newMem) => {
	if (newMem.guild.id === "614241181341188159" && newMem.voiceChannel != undefined && newMem.voiceChannel.id === "614241699820208164") {
		try {
			newMem.guild.members.cache.get(newMem.guild.members.cache.mapValues(member => [member.id, member.roles.cache.get("615701598504747010")]).filter(value => typeof value[1] !== "undefined")[0][0]).roles.remove("615701598504747010");
		} catch {}
		newMem.member.roles.add("615701598504747010");
	}
});

function addReaction(message, rules, index) {
	if (index >= Object.keys(rules).length) return;
	if (!Object.values(rules)[index][2]) return addReaction(message, rules, index + 1);
	message.react(Object.values(rules)[index][2]).then(() => addReaction(message, rules, index + 1));
}

// Used when I use discord as a console. Allows me to disable the hosted bot temporarily, and use the dev bot instead.
function exit() {
	if (typeof auth === "undefined") {
		exited = !exited;
		return exited ? "Manually exiting..." : "Coming back online!";
	}
	return "Don't worry, I'm still alive!";
}
client.login(token);
