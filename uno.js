const Discord = require("discord.js");
const Canvas = require("canvas");
const {Core, Player, Pile, Card} = require("./core.js");

/** 
 * The base implementation of uno
 * @class baseUno
*/
export default class baseUno extends Core {
	/**
	 * @param {Discord.GuildChannel} channel - The channel to send updates to
	 * @param {Discord.GuildMember} member - The provided member to make a player out of
	 * @param {Player} firstPlayer  - The initial default player
	 */
	constructor(channel, member, firstPlayer) {
		// TODO: add a command which changes the number points requried to win/lose.
		const rules = {
			points: ["Play for Points - :100:", "The game is played in a series of rounds, where the winning player recieves a number of points based on the other players' cards and wins once it's over 500", "💯"],
			altPoints: ["Alternate Points Rule - :1234:", "Instead, loosing players get points = require their own cards, and are eliminated when it reaches 500", "🔢"],
			startingCards: [`Number of Starting Cards: 7`, `type \`!startingcards 𝘯𝘶𝘮\` or \`!sc 𝘯𝘶𝘮\` to change`],
			contDraw: ["Draw Until You Discard - :arrow_up:", "If you can't play a card, you keep drawing until you can", "⬆️"],
			// TODO: add a command that changes how stacking works. i.e. "can stack on draw 4s" or "jumping in resets the stack"
			stacking: ["Stacking - :books:", "Draw 2s and Draw 4s can be stacked, moving play on to the next player, who can either stack again or draw for all stacked cards", "📚"],
			zSCards: ["0-7 Special Cards - :arrows_counterclockwise:", "0 cards rotate all hands in the direction of play, and 7s swap hands with a specific player of your choosing", "🔄"],
			jumpIn: ["Jump-in Rule - :zap:", "If you have a card that exactly matches the current card, you can play it immediately (no matter whose turn it is), and play continues as if you just took your turn", "⚡"]
		}

		const players = {
			[member.id]: firstPlayer
		}
		players[member.id].traits = {
			renegeCard: null,
			oneCardNoUno: false,
			points: 0
		}

		super("Uno", channel, rules, { startingCards: 7, clockwise: true}, {}, players);
	}

	/*
	static calls = Object.freeze({
		SAID_UNO: 0, // If the player with 1 card said uno
		FASTER: 1, // If a different player called out the 1 card player faster
		SLOWER: 2 // If no one has uno
	});
	*/

	setup() {
		return super.setup();
		//new unoMod(this);
		// Register server mods here...
		//this.events.emit("setup", Core.phases.START);
		// if (!this.setup.cancelled) {}
		//this.events.emit("setup", Core.phases.END);
		//this.setup.cancelled = false;
	}

	/**@param {Discord.GuildMember} member - The member to generate a Player = require*/
	genDefaultPlayer(member) {
		//this.events.emit("genDefaultPlayer", Core.phases.START, player);
		//this.events.emit("genDefaultPlayer", Core.phases.END, player);
		//this.genDefaultPlayer.cancelled = false;
		return new Player(member, [], false, 0, {}, {renegeCard: null, oneCardNoUno: false, points: 0});
	}

	/**@returns {void} */
	start() {
		//this.events.emit("start", Core.phases.START);
		//if (!this.start.cancelled) {
		if (Object.keys(this.players).length < 2) return this.meta.channel.send("Not enough players!");
		if (Object.keys(this.meta.rules).length) this.meta.ruleReactor.stop();
		this.meta.phase = 2;
		this.randomizePlayerOrder();
		this.piles.draw = new Pile();
		this.piles.discard = new Pile();
		this.deckCreate(this.piles.draw);
		this.piles.discard.cards.unshift(this.piles.draw.cards.shift());
		Object.values(this.players).forEach(player => player.cards = this.piles.draw.cards.splice(0, this.meta.traits.startingCards));
		if (this.piles.discard.cards[0].id === "ww") this.piles.discard.cards[0].traits.color = "w";
		this.meta.currentPlayer = Object.values(this.players).find(player => !player.index);
		this.meta.actionHistory.push("The game has just started!");
		switch (this.piles.discard.cards[0].id.substring(1)) {
			case "d":
				if (this.meta.rules.stacking) {
					this.piles.draw.traits.drawNum += 2;
				} else {
					const drew = this.draw(this.meta.currentPlayer, this.piles.draw, 2).length;
					this.meta.actionHistory.push(`${this.meta.currentPlayer.member.displayName} drew ${drew} card${Core.plural(drew)} due to the starting card`);
					this.nextPlayer();
				}
				break;
			case "s":
				this.meta.actionHistory.push(`${this.meta.currentPlayer.member.displayName} was skipped due to the starting card`);
				this.nextPlayer();
				break;
			case "r":
				this.meta.traits.clockwise = !this.meta.traits.clockwise;
				this.meta.actionHistory.push(`${this.meta.currentPlayer.member.displayName} was skipped and play is reversed due to the starting card`);
				this.nextPlayer();
				break;
		}
		Core.dealCards(Object.values(this.players));
		this.ctx.fillStyle = "#FFFFFF";
		this.meta.channel.send(`Play order: ${Object.values(this.players).sort((player1, player2) => player1.index - player2.index).reduce((acc, player) => {return `${acc}${player.member.displayName}, `}, "").slice(0,-2)}\nGo to <https://github.com/Bedrockbreaker/unobot/wiki/Uno> to learn how to play.`);
		if (!Object.values(this.players).reduce((acc, player) => {return acc+player.traits.points},0)) super.start().then(() => this.updateUI());
		this.resetTimeLimit();
		//}
		//this.events.emit("start", Core.phases.END);
		//this.start.cancelled = false;
	}

	/**
	 * Creates a deck of cards for the provided pile
	 * @param {Pile} pile - The pile to create a deck of cards for
	 * @returns {Card[]} The newly created cards for the pile
	 */
	deckCreate(pile) {
		/** @type {Card[]} */
		let cards = [];
		//this.events.emit("deckCreate", Core.phases.START, pile, cards);
		if (/*!this.deckCreate.cancelled && */pile === this.piles.draw) {
			const c = ["r","g","b","y"];
			const colors = ["Red", "Green", "Blue", "Yellow"];
			const url = "images/uno/";
			for (let k = 0; k < Math.ceil(Object.keys(this.players).length * this.meta.traits.startingCards / 28); k++) {
				for (let i = 0; i < 4; i++) {
					cards.push(new Card("ww", "Wild", `${url}ww.png`, {}), new Card("w4", "Wild Draw 4", `${url}w4.png`), new Card(`${c[i]}0`, `${colors[i]} 0`, `${url}${c[i]}0.png`),
						new Card(`${c[i]}d`, `${colors[i]} Draw 2`, `${url}${c[i]}d.png`), new Card(`${c[i]}d`, `${colors[i]} Draw 2`, `${url}${c[i]}d.png`),
						new Card(`${c[i]}s`, `${colors[i]} Skip`, `${url}${c[i]}s.png`), new Card(`${c[i]}s`, `${colors[i]} Skip`, `${url}${c[i]}s.png`),
						new Card(`${c[i]}r`, `${colors[i]} Reverse`, `${url}${c[i]}r.png`), new Card(`${c[i]}r`, `${colors[i]} Reverse`, `${url}${c[i]}r.png`));
					for (let j = 1; j < 10; j++) {
						cards.push(new Card(`${c[i]}${j}`, `${colors[i]} ${j}`, `${url}${c[i]}${j}.png`), new Card(`${c[i]}${j}`, `${colors[i]} ${j}`, `${url}${c[i]}${j}.png`));
					}
				}
			}
			// List of card ids that shouldn't ever be drawn first.
			if (typeof pile.traits.badFirstCards === "undefined") pile.traits.badFirstCards = ["w4"];
			if (this.meta.rules.stacking && typeof pile.traits.drawNum === "undefined") pile.traits.drawNum = 0;
		}
		//this.events.emit("deckCreate", Core.phases.MIDDLE, pile, cards);
		if (/*!this.deckCreate.cancelled && */pile === this.piles.draw) {
			do {
				Core.shuffle(cards);
			} while (pile.traits.badFirstCards.includes(cards[0].id));
			pile.cards = pile.cards.concat(cards);
		}
		//this.events.emit("deckCreate", Core.phases.END, pile, cards);
		//this.deckCreate.cancelled = false;
		return cards;
	}

	/**
	 * @param {string[]} args - The exact string the user typed, sans the server prefix, separated by spaces
	 * @param {Discord.GuildMember|Discord.User} member - The member who typed the message
	 * @param {Discord.Channel} channel - The channel the command was posted in
	 */
	discard(args, member, channel) {
		//this.events.emit("discard", Core.phases.START, args, member);
		if (/*!this.discard.cancelled && */this.players.hasOwnProperty(member.id)) {
			const player = this.players[member.id];
			member = player.member; // If the player sends a command through their DMs, the original "member" is actually a User.
			switch(args[0]) {
				case "sc":
				case "startingcards": {
					//this.events.emit("discard_sc", Core.phases.START, args, player);
					let message = "";
					//if (!this.discard.sc?.cancelled) {
					if (!player.isLeader) {this.meta.channel.send("Only the leader can change that!"); break;}
					if (isNaN(Number(args[1]))) {this.meta.channel.send(`${typeof args[1] === "undefined" ? "That" : `\`${args[1]}\``} is not a valid number!`); break;}
					this.meta.traits.startingCards = Math.abs(Math.floor(Number(args[1])));
					message = `:white_check_mark: Successfully changed the starting number of cards to ${this.meta.traits.startingCards}`;
					//}
					//this.events.emit("discard_sc", Core.phases.END, args, player, message);
					/*if (this.discard.sc && !this.discard.sc?.cancelled) */this.meta.channel.send(message);
					//this.discard.sc = {cancelled: false};
					break;
				}
				case "d":
				case "draw": {
					//this.events.emit("discard_draw", Core.phases.START, args, player);
					/**@type {Card[]} */
					let drew = [];
					//if (this.discard.draw && !this.discard.draw.cancelled) {
					if (this.meta.phase < 2 || this.meta.currentPlayer !== player || player.traits.renegeCard || this.piles.discard.cards[0].traits.owner) break; // renegeCard also happens to check if the player is trying to draw multiple times
					drew = this.draw(player, this.piles.draw, this.meta.rules.stacking ? this.piles.draw.traits.drawNum : (this.meta.rules.contDraw ? 0 : 1));
					player.traits.renegeCard = drew[drew.length-1];
					if (this.meta.rules.stacking) {
						if (this.piles.draw.traits.drawNum) this.nextPlayer(); // Also nulls the renege card
						this.piles.draw.traits.drawNum = 0;
					}
					//}
					//this.events.emit("discard_draw", Core.phases.END, args, player, drew);
					//if (this.discard.draw && !this.discard.draw.cancelled) {
					this.meta.actionHistory.push(`${member.displayName} drew ${drew.length} card${Core.plural(drew.length)}`);
					this.checkPlayersOneCardNoUno();
					this.updateUI();
					//}
					//this.discard.draw = {cancelled: false};
					break;
				}
				case "n":
				case "next":
				case "endturn": {
					//this.events.emit("discard_next", Core.phases.START, args, player);
					/**@type {Card[]} */
					let drew;
					let takeD4Cards = false;
					if (/*this.discard.next && !this.discard.next.cancelled && */this.meta.phase >= 2 && this.meta.currentPlayer === player && this.piles.discard.cards[0].traits.owner) {
						takeD4Cards = true;
						drew = this.draw(player, this.piles.draw, this.meta.rules.stacking ? this.piles.draw.traits.drawNum : 4).length;
						if (this.meta.rules.stacking) this.piles.draw.traits.drawNum = 0;
						this.meta.actionHistory.push(`${member.displayName} was forced to draw ${drew} card${Core.plural(drew)}`);
						this.piles.discard.cards[0].traits.owner = null;
						this.checkPlayersOneCardNoUno();
					}
					//this.events.emit("discard_next", Core.phases.END, args, player, drew);
					if (/*this.discard.next && !this.discard.next.cancelled && */this.meta.phase >= 2 && this.meta.currentPlayer === player && (player.traits.renegeCard || takeD4Cards)) {
						this.nextPlayer();
						this.updateUI();
					}
					//this.discard.nextPlayer = {cancelled: false}
					break;
				}
				case "uno": {
					if (this.meta.phase < 2) break;
					//this.events.emit("discard_uno", Core.phases.START, args, player);
					//if (this.discard.uno && !this.discard.uno.cancelled) {
					if (player.cards.length === 1 && player.traits.oneCardNoUno) {
						//this.events.emit("discard_uno", Core.phases.MIDDLE, args, player, baseUno.calls.SAID_UNO, player);
						//if (!this.discard.uno.cancelled) {
						player.traits.oneCardNoUno = false;
						this.meta.actionHistory.push(`${member.displayName} said uno!`);
						//}
					} else {
						const slowpoke = Object.values(this.players).find(player => player.traits.oneCardNoUno);
						if (slowpoke) {
							//this.events.emit("discard_uno", Core.phases.MIDDLE, args, player, baseUno.calls.FASTER, slowpoke);
							//if (!this.discard.uno.cancelled) {
							const drew = this.draw(slowpoke, this.piles.draw, 2).length;
							this.meta.actionHistory.push(`${slowpoke.member.displayName} drew ${drew} card${Core.plural(drew)} = require not saying \`!uno\` fast enough`);
							//}
						} else {
							//this.events.emit("discard_uno", Core.phases.MIDDLE, args, player, baseUno.calls.SLOWER, player);
							//if (!this.discard.uno.cancelled) {
							const drew = this.draw(player, this.piles.draw, 2).length;
							this.meta.actionHistory.push(`${member.displayName} drew ${drew} card${Core.plural(drew)} = require falsely calling uno`);
							//}
						}
					}
					//}
					//this.events.emit("discard_uno", Core.phases.END, args, player);
					/*if (!this.discard.uno.cancelled)*/this.updateUI();
					//this.discard.uno = {cancelled: false};
					break;
				}
				case "c":
				case "challenge": {
					if (this.meta.phase < 2 || this.meta.currentPlayer !== player || !this.piles.discard.cards[0].traits.owner) break;
					const owner = this.piles.discard.cards[0].traits.owner;
					if (owner.cards.some(card => card.id === "w4" ? false : this.match(card, this.piles.discard.cards[1]))) {
						const drew = this.draw(owner, this.piles.draw, this.meta.rules.stacking ? this.piles.draw.traits.drawNum : 4).length;
						if (this.meta.rules.stacking) this.piles.draw.traits.drawNum = 0;
						this.meta.actionHistory.push(`${owner.member.displayName} drew ${drew} card${Core.plural(drew)} = require failing to sneak a draw 4`);
					} else {
						const drew = this.draw(player, this.piles.draw, this.meta.rules.stacking ? this.piles.draw.traits.drawNum + 2 : 6).length;
						if (this.meta.rules.stacking) this.piles.draw.traits.drawNum = 0;
						this.meta.actionHistory.push(`${member.displayName} drew ${drew} card${Core.plural(drew)} = require unsuccessfully challenging a draw 4`);
						this.nextPlayer();
					}
					this.checkPlayersOneCardNoUno();
					this.piles.discard.cards[0].traits.owner = null;
					this.updateUI();
					break;
				}
				default: {
					if (this.meta.phase < 2) break;
					let discardStyle = "discarded";
					// !id.bool,num:2,string:yeet ...args
					const card = Core.getCards(player.cards, args[0].split(".")[0], args[0].split(".")[1])[0];
					if (this.meta.rules.jumpIn && player !== this.meta.currentPlayer && card?.id === this.piles.discard.cards[0].id) {
						member = player.member;
						this.meta.currentPlayer = player;
						discardStyle = "jumped in with";
					}
					if (this.meta.currentPlayer !== player) break;
					if (!card || !this.match(card, this.piles.discard.cards[0], args, player) || (this.meta.rules.stacking && this.piles.draw.traits.drawNum && (card.id.substring(1) !== "d" && card.id !== "w4"))) {
						channel.send("Invalid move!");
						break;
					}
					this.piles.discard.cards.unshift(player.cards.splice(player.cards.findIndex(card2 => card === card2),1)[0]);
					const sneaky = Object.values(this.players).find(player2 => player2.traits.oneCardNoUno);
					if (sneaky) {
						sneaky.traits.oneCardNoUno = false;
						this.meta.actionHistory.push(`${sneaky.member.displayName} got away without saying uno!`);
					}
					let action = `${member.displayName} ${discardStyle} a ${card.name}`;
					if (card.id.startsWith("w")) card.traits.color = args[1].substring(0,1);
					if (card.id === "w4") {
						this.piles.draw.traits.drawNum += 4;
						card.traits.owner = player;
					}
					this.nextPlayer();
					if (player.cards.length !== 0) {
						if (player.cards.length === 1 && !player.traits.oneCardNoUno) player.traits.oneCardNoUno = true;
						switch(card.id.substring(1)) {
							case "r":
								this.meta.traits.clockwise = !this.meta.traits.clockwise;
								if (Object.keys(this.players).length === 2) {
									action += ` and skipped ${this.meta.currentPlayer.member.displayName}'s turn`;
								} else {
									this.nextPlayer();
									action += " and reversed the play direction";
								}
								this.nextPlayer();
								break;
							case "s":
								action += ` and skipped ${this.meta.currentPlayer.member.displayName}'s turn`;
								this.nextPlayer();
								break;
							case "d":
								if (this.meta.rules.stacking) {
									this.piles.draw.traits.drawNum += 2;
								} else {
									const drew = this.draw(this.meta.currentPlayer, this.piles.draw, 2).length;
									action += ` and forced ${this.meta.currentPlayer.member.displayName} to draw ${drew} card${Core.plural(drew)}`;
									this.nextPlayer();
								}
								break;
							case "7":
								if (!this.meta.rules.zSCards) break;
								const player2ID = args[1].replace(/<@!?(\d*)>/, "$1");
								[player.cards, this.players[player2ID].cards] = [this.players[player2ID].cards, player.cards];
								this.players[player2ID].traits.oneCardNoUno = player.traits.oneCardNoUno = false;
								Core.dealCards([this.players[player2ID]]);
								break;
							case "0":
								if (!this.meta.rules.zSCards) break;
								const pLength = Object.keys(this.players).length;
								const temp = Object.values(this.players).find(player => player.index === (this.meta.traits.clockwise ? pLength - 1 : 0)).cards;
								for (let i = this.meta.traits.clockwise ? pLength - 1 : 0; this.meta.traits.clockwise ? i > 0 : i < pLength - 1; i += this.meta.traits.clockwise ? -1 : 1) {
									const player2 = Object.values(this.players).find(player => player.index === i);
									player2.cards = Object.values(this.players).find(player => player.index === i + (this.meta.traits.clockwise ? -1 : 1)).cards;
									player2.traits.oneCardNoUno = false;
								}
								Object.values(this.players).find(player => player.index === (this.meta.traits.clockwise ? 0 : pLength - 1)).cards = temp;
								Core.dealCards(Object.values(this.players).filter(player3 => player3 !== player));
								action += ` and rotated everyone's hands around`;
								break;
						}
						Core.dealCards([player]);
					} else {
						let won = true;
						if (this.meta.rules.points) {
							won = false;
							player.traits.points += Object.values(this.players).reduce(player2 => player2.cards.reduce((total, card2) => {return total+(Number(card2.id.substring(1)) || (card2.id.startsWith("w") ? 50 : 20))},0));
							if (player.traits.points >= 500) won = true;
						} else if (this.meta.rules.altPoints) {
							won = false;
							let lowestScore = Number.MAX_SAFE_INTEGER;
							Object.values(this.players).forEach(player2 => {
								player2.traits.points += player2.cards.reduce((total, card2) => {return total+(Number(card2.id.substring(1)) || (card2.id.startsWith("w") ? 50 : 20))},0);
								lowestScore = Math.min(lowestScore, player2.traits.points);
							});
							/**@type {Player[]} */
							let removedPlayers = [];
							Object.values(this.players).forEach(player2 => {
								if (player2.traits.points >= 500 && player2.traits.points !== lowestScore) {
									removedPlayers.push(player2.member.displayName);
									this.removePlayer(player2);
								}
							});
							this.meta.currentPlayer = Object.keys(this.players)[0]; // Ensures, when the game is won, the ui is updated one last time
							this.meta.channel.send(`Removed Players: ${removedPlayers.join(", ") || "None ~~yet~~"}`);
							if (Object.keys(this.players).length === 1) won = true;
						}
						if (won) {
							this.meta.channel.send(`${member.displayName} has won the game${this.meta.rules.points || this.meta.rules.altPoints ? ` with ${player.traits.points} points` : ""}!`);
							action += `, winning the game${this.meta.rules.points || this.meta.rules.altPoints ? ` with ${player.traits.points} points` : ""}!`;
							this.meta.ended = true;
						} else {
							this.meta.channel.send(`${member.displayName} has won the round with ${player.traits.points} points!`);
							action += `, winning the round with ${player.traits.points} points!`;
							player.traits.oneCardNoUno = false;
							this.start();
						}
					}
					this.meta.actionHistory.push(action);
					this.updateUI();
				}
			}
		}
		//this.events.emit("discard", Core.phases.END, args, member);
		//this.discard.cancelled = false;
	}

	nextPlayer() {
		//this.events.emit("nextPlayer", Core.phases.START);
		//if (!this.nextPlayer.cancelled) {
		const player = this.meta.currentPlayer;
		player.traits.renegeCard = null;
		const index = ((Object.values(this.players).find(player1 => player1 === this.meta.currentPlayer).index + (this.meta.traits.clockwise ? 1 : -1)) + Object.keys(this.players).length) % Object.keys(this.players).length;
		this.meta.currentPlayer = Object.values(this.players).find(player2 => player2.index === index);
		this.meta.currentPlayer.traits.renegeCard = null; // Just in case

		//this.ctx.drawImage();

		this.resetTimeLimit();
		//}
		//this.events.emit("nextPlayer", Core.phases.END);
		//this.nextPlayer.cancelled = false;
	}

	timeLimit() {
		//this.events.emit("timeLimit", Core.phases.START);
		//if (!this.timeLimit.cancelled) {
		const drew = this.draw(this.meta.currentPlayer, this.piles.draw, this.meta.rules.stacking ? this.piles.draw.traits.drawNum : (this.meta.rules.contDraw ? 0 : 1)).length;
		if (this.meta.rules.stacking) this.piles.draw.traits.drawNum = 0;
		this.meta.actionHistory.push(`${this.meta.currentPlayer.member.displayName} drew ${drew} card${Core.plural(drew)} for taking too long`);
		this.nextPlayer();
		//}
		//this.events.emit("timeLimit", Core.phases.END);
	}

	updateUI() {
		const display = new Discord.MessageEmbed();
		//this.events.emit("updateUI", Core.phases.START, display);
		//if (!this.updateUI.cancelled) {
		const rightPlayer = Object.values(this.players).find(player => player.index === (this.meta.currentPlayer.index+1)%Object.keys(this.players).length);
		const leftPlayer = Object.values(this.players).find(player => player.index === (this.meta.currentPlayer.index-1+Object.keys(this.players).length)%Object.keys(this.players).length);
		this.renderTable().then(() => {
			display.setTitle(`Current Discarded Card: ${this.piles.discard.cards[0].name}`)
			   //.setThumbnail(this.meta.currentPlayer.member.user.displayAvatarURL())
			   .attachFiles(new Discord.MessageAttachment(this.canvas.toBuffer(), "game.png"))
			   .setDescription(`It is currently ${this.meta.currentPlayer.member.displayName}'s turn${this.piles.discard.cards[0].id.startsWith("w") && this.piles.discard.cards.length > 1 ? `\n**Current Color: ${{r: "Red", g: "Green", b: "Blue", y: "Yellow"}[this.piles.discard.cards[0].traits.color]}**` : ""}${this.piles.discard.cards[0].traits.owner ? "\n**Type `!challenge` to challenge or `!next` to take the extra cards**" : ""}${this.meta.rules.stacking && this.piles.draw.traits.drawNum ? `\n**${this.piles.draw.traits.drawNum} Cards stacked to draw**` : ""}`)
			   .addField(`${leftPlayer.member.displayName} ${this.meta.traits.clockwise ? `-> **${this.meta.currentPlayer.member.displayName}** ->` : `<- **${this.meta.currentPlayer.member.displayName}** <-`} ${rightPlayer.member.displayName}`, this.meta.actionHistory.slice(-2).reverse().join("\n"))
			   .setColor(this.piles.discard.cards[0].id.startsWith("w") ? {r: "#D40000", g: "#2CA05A", b: "#2A7FFF", y: "#FFCC00", w: "#A100FF"}[this.piles.discard.cards[0].traits.color] : {6: "#71FF00", 5: "#BDFF00", 4: "#F1DF00", 3: "#FF9800", 2: "#FF4C00", 1: "#FF1400", 0: "#A100FF"}[Object.values(this.players).reduce((acc, player) => {return Math.min(acc, player.cards.length)}, 7).toString()] || "#26FF00")
			   .setImage("attachment://game.png"/*this.piles.discard.cards[0].image || "https://i.ibb.co/BwSXYnV/unknown.png"*/)
			   .setFooter(Object.values(this.players).reduce((acc, player) => {return acc += `${player.member.displayName}: ${player.cards.length} card${Core.plural(player.cards.length)}${(this.meta.rules.points || this.meta.rules.altPoints) ? ` + ${player.traits.points} point${Core.plural(player.traits.points)}, ` : ", "}`}, "").slice(0, -2));
			   this.meta.channel.send(display);
		});
		//}
		//this.events.emit("updateUI", Core.phases.END, display);
		/*if (!this.updateUI.cancelled) */ 
		//this.updateUI.cancelled = false;
	}

	/**@param {Discord.GuildMember} member - The member to generate a Player for */
	addPlayer(member) {
		const player = this.genDefaultPlayer(member);
		//this.events.emit("addPlayer", Core.phases.START, player);
		//if (!this.addPlayer.cancelled) {
		this.players[member.id] = player;
		if (this.meta.phase >= 2) player.cards = this.piles.draw.cards.splice(0, this.meta.traits.startingCards);
		//}
		//this.events.emit("addPlayer", Core.phases.END, player);
		//this.addPlayer.cancelled = false;
	}

	/**@param {Player} player - The Player to remove = require the game */
	removePlayer(player) {
		//this.events.emit("removePlayer", Core.phases.START, player);
		//if (!this.removePlayer.cancelled) {
		this.piles.draw.cards = this.piles.draw.cards.concat(player.cards);
		Core.shuffle(this.piles.draw.cards);
		this.meta.deletePlayer = player.member.id;
		if (player === this.meta.currentPlayer) this.nextPlayer();
		delete this.players[player.member.id];
		//}
		//this.events.emit("removePlayer", Core.phases.END, player);
		//this.removePlayer.cancelled = false;
	}

	/**
	 * Render everything which can change visually during a game.
	 */
	renderTable() {
		this.ctx.drawImage(this._canvas, 0, 0);
		const players = Object.values(this.players);
		this.ctx.drawImage(this.meta.images.halo, 300*Math.cos(2*Math.PI*this.meta.currentPlayer.index/players.length-Math.PI)+330, 200*Math.sin(2*Math.PI*this.meta.currentPlayer.index/players.length-Math.PI)+200);
		players.forEach(player => {
			const loc = {x: 300*Math.cos(2*Math.PI*player.index/players.length-Math.PI), y: 200*Math.sin(2*Math.PI*player.index/players.length-Math.PI)};
			this.ctx.fillText(player.cards.length.toString(), loc.x + 480, loc.y + 241);
			this.ctx.strokeText(player.cards.length.toString(), loc.x + 480, loc.y + 241);
		});
		return Canvas.loadImage(this.piles.discard.cards[0].image).then(image => {
			return this.ctx.drawImage(image, 337, 125, 175, 250);
		});
	}

	/** @param {Player[]} players2 - The list of players' avatars to render */
	drawStatic(players2) {
		const players = Object.values(this.players);
		return Canvas.loadImage("images/uno/icon.png").then(image => {
			players.forEach(player => {
				const loc = {x: 300*Math.cos(2*Math.PI*player.index/players.length-Math.PI), y: 200*Math.sin(2*Math.PI*player.index/players.length-Math.PI)};
				this.ctx.drawImage(image, loc.x + 430, loc.y + 210);
				if (this.meta.rules.points || this.meta.rules.altPoints) {
					this.ctx.fillText(`${player.traits.points} Pts`, loc.x + 430, loc.y + 285);
					this.ctx.strokeText(`${player.traits.points} Pts`, loc.x + 430, loc.y + 285);
				}
			});
			return super.drawStatic(players2);
		});
	}

	/**
	 * Tests if two cards match.
	 * If args and player are not provided, the function will return if the cards could match.
	 * If they are provided, it will return if the card matches and was played correctly (i.e. providing a valid color for a wild)
	 * @param {Card} card1 - The first card, generally the one in the player's hand
	 * @param {Card} card2 - The second card, generally the one on the discard pile
	 * @param {string[]} [args] - Any arguments the player typed for the card (i.e. colors for wilds)
	 * @param {Player} [player] - The player who is playing the card.
	 * @returns {boolean} If the cards matched
	 */
	match(card1, card2, args, player) {
		/**
		 * Your match function should return [boolean, boolean]
		 * 
		 * [can card match, could card still match even if your function returns false for the first value]
		 * @type {Array<Boolean[]>}
		 */
		let canMatch = [];
		//this.events.emit("match", Core.phases.START, card1, card2, args, player, canMatch);
		/*if (!this.match.cancelled) */canMatch.push([card1.id.startsWith(card2.id.substring(0,1)) || card1.id.substring(1) === card2.id.substring(1) || card1.id.startsWith("w") || card1.id.startsWith(card2.traits.color) || card2.traits.color === "w",
			(!player || !args || ((!player.traits.renegeCard || player.traits.renegeCard === card1) && (!this.meta.rules.zSCards || card1.id.substring(1) !== "7" || (this.players[args[1]?.replace(/<@!?(\d*)>/, "$1")] && args[1]?.replace(/<@!?(\d*)>/, "$1") !== player.member.id)) && (!card1.id.startsWith("w") || ["red", "r", "green", "g", "blue", "b", "yellow", "y"].includes(args[1]))))]);
		//this.events.emit("match", Core.phases.END, card1, card2, args, player, canMatch);
		//this.match.cancelled = false;
		return canMatch.some(match => match[0]) && canMatch.every(match => match[1]);
	}

	/**
	 * Checks if a player got away without saying uno.
	 */
	checkPlayersOneCardNoUno() {
		//this.events.emit("OCNU", Core.phases.start);
		//if (!this.checkPlayersOneCardNoUno.cancelled) {
		const sneaky = Object.values(this.players).find(player => player.traits.oneCardNoUno);
		if (sneaky) {
			sneaky.traits.oneCardNoUno = false;
			this.meta.actionHistory.push(`${sneaky.member.displayName} got away without saying uno!`);
		}
		//}
		//this.events.emit("OCNU", Core.phases.END);
		//this.checkPlayersOneCardNoUno.cancelled = false;
	}

	/**
	 * Draws a number of cards = require a pile, and inserts them into a Player's cards.
	 * Modified to allow for continuous draw rules, if numCards is 0
	 * @param {Player} player - The Player which gets the cards
	 * @param {Pile} pile - The Pile to draw cards = require
	 * @param {number} numCards - The number of Cards to draw
	 * @returns {Card[]} The newly drawn Cards
	 */
	draw(player, pile, numCards) {
		let newCards = [];
		//this.events.emit("draw", Core.phases.START, player, pile, numCards, newCards);
		//if (!this.draw.cancelled) {
		if (numCards || !this.meta.rules.contDraw) {
			for (let i = 0; i < numCards; i++) {
				newCards.push(pile.cards.shift());
				if (pile.cards.length === 0) this.deckCreate(pile); // Instead of reshuffling the old pile, we create a new one to preserve card history. Doesn't break mods which rely on previously discarded cards.
			}
		} else {
			do {
				newCards.push(pile.cards.shift());
				if (pile.cards.length === 0) this.deckCreate(pile);
			} while (!this.match(newCards[newCards.length - 1], this.piles.discard.cards[0]));
		}
		//}
		//this.events.emit("draw", Core.phases.MIDDLE, player, pile, numCards, newCards);
		//if (!this.draw.cancelled) {
		player.cards = player.cards.concat(newCards);
		Core.dealCards([player]);
		//}
		//this.events.emit("draw", Core.phases.END, player, pile, numCards, newCards);
		//this.draw.cancelled = false;
		return newCards;
	}
}