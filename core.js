//import events from "events";
const Discord = require("discord.js");
const Canvas require("canvas");

/**
 * Provides basic functionality for all games
 * @class Core
 */
class Core {
	/**
	 * @param {string} title - The display name of the game
	 * @param {Discord.GuildChannel} channel - The channel to send updates to
	 * @param {number} [phase=0] - The current phase of the game. <1 is joining, [1,2) is setup, >=2 is playing
	 * @param {Player} [currentPlayer] - The current player, according to whose turn it is
	 * @param {number} [timeLimit=0] - The time limit, in seconds, for each player on their turn. 0 means no limit
	 * @param {string[]} [actionHistory=[]] - A history of players' actions
	 * @param {boolean} [allowsMidGameJoin=true] - If the current game allows players to join after it has already started
	 * @param {Object<string, (string[]|boolean)>} [rules={}] - An object containing the customizable rules for the game
	 * @param {Object<string, *>} traits - An object used to define any custom traits of the game
	 * @param {Object<string, Pile>} piles - An object containing all of the card piles in the game
	 * @param {Object<string, Player>} players - An object while holds all the players in a game
	*/
	constructor(title, channel, rules = {}, traits = {}, piles, players, timeLimit = 0, allowsMidGameJoin = true, phase = 0, currentPlayer, actionHistory = []) {
		// If for whatever reason I need to get the class of a game: game#constructor.name
		this.meta = {
			/** The display name of the game */
			title: title,
			/** The channel to send updates to */
			channel: channel,
			/** The current phase of the game. <1 is joining, [1,2) is setup, >=2 is playing */
			phase: phase,
			/** The current player, according to whose turn it is */
			currentPlayer: currentPlayer,
			/** The time limit, in seconds, for each player on their turn. 0 means no limit */
			timeLimit: timeLimit,
			/** A history of players' actions */
			actionHistory: actionHistory,
			allowsMidGameJoin: allowsMidGameJoin,
			/** Cache of images used for rendering 
			 * @type {Object<string, CanvasImageSource>}
			*/
			images: {},
			/** List of optional rules. Initialize with a string array, is later replaced with whether those rules are active or not */
			rules: rules,
			/** An object used to define any custom traits of the game */
			traits: traits,
			/** The member id of the player to remove from the game */
			deletePlayer: "0",
			/** Used to mark when the game has ended */
			ended: false
		}
		/** Piles of cards the game contains */
		this.piles = piles;
		/** Players who are playing in the game */
		this.players = players;

		/** The canvas used to render scenes 
		 * @type {HTMLCanvasElement}
		*/
		this.canvas = Canvas.createCanvas(850, 500);
		/** The rendering context of the canvas 
		 * @type {CanvasRenderingContext2D}
		*/
		this.ctx = this.canvas.getContext("2d");
		/** The events emitter used for mods */
		//this.events = new events.EventEmitter();
	}

	/** 
	 * Enum for event phases fired for mods.
	 * @enum {number}
	*/
	/*
	static phases = Object.freeze({
		START: 0,
		MIDDLE: 1,
		END: 2
	});
	*/

	/**
	 * Mutates the array and returns the shuffled version.
	 * @param {Array} array 
	 * @returns {Array} The mutated array
	 */
	static shuffle(array) {
		let i, j;
		for (i = array.length - 1; i > 0; i--) {
			j = Math.floor(Math.random() * (i + 1));
			[array[i], array[j]] = [array[j], array[i]];
		}
		return array;
	}

	/**
	 * If `num` is equal to 1, returns the singular suffix. Else, return the plural suffix
	 * @param {number} num 
	 * @param {string} [plural="s"] 
	 * @param {string} [singular=""] 
	 * @returns {string} Either the plural of singular suffix of a word.
	 */
	static plural(num, plural, singular) {
		if (num === 1) return singular || "";
		return plural || "s";
	}

	/**
	 * Attempts to find the cards specified from an array of cards. Basically a fancy filter function
	 * @param {Card[]} cards - The list of cards to search in
	 * @param {string} cardID - The card id of the card
	 * @param {(Object<string, *>|string|Array[])} traits - The special traits a card must have. Any boolean traits of the card must be false if not specified.
	 * If an array or string is passed, any traits which aren't set to a specific value, i.e. "marked" default to true. 
	 * @example getCards(player, "r2", "marked,score:2,stolenfrom:bob")
	 * @example getCards(player, "r2", {marked: true, score: 2, stolenfrom: "bob"})
	 * @example getCards(player, "r2", [["marked"],["score","2"],["stolenfrom","bob"]])
	 */
	static getCards(cards, cardID, traits) {
		// TODO: allow ranges for numbers to be selected. ("score:>2,score:<=5")
		traits = traits || [];
		if (typeof traits === "object" && typeof traits.length === "undefined") traits = Object.keys(traits).map(key => [key, traits[key].toString()]);
		if (typeof traits === "string") traits = traits.split(",").map(trait => trait.split(":"));
		const tempFilter = cards.filter(card => card.id === cardID && traits.every(trait => card.traits[trait[0]]?.toString() === (trait[1] || "true")));
		return tempFilter.filter(card => {
			return Object.keys(card.traits).every(trait => {
				const mentionedTrait = traits.find(trait2 => trait2[0] === trait);
				return typeof card.traits[trait] === "boolean" ? (card.traits[trait].toString() === (mentionedTrait ? (mentionedTrait[1] || "true") : "false")) : true;
			});
		});
	}

	/**
	 * Display the specified players' cards to them, optionally sorted and a unique color for each one.
	 * If a falsey value is passed, deal all players. If a player's member id is passed, only deal to that player.
	 * @param {Player[]} players - the player(s) to display their cards to.
	 * @param {function(Player) => Card[]} [sortFunction] - The function to sort a specific player's cards by
	 * @param {function(Player) => Discord.ColorResolvable} [colorFunction] - The function for the color of a specific player's embed sidebar
	 * @returns {void}
	 */
	static dealCards(players, sortFunction, colorFunction) {
		// TODO: implement passing in a sort function. Ex: phase 10, where the cards should be sorted to suit the players' phases.
		// TODO: implement the color. Ex: you have 1 card in uno.
		if (players.length === 0) return;
		const player = players.pop();
		if (player.member.user.bot) return this.dealCards(players, sortFunction, colorFunction); // I use the bot to test things. Makes sure that this doesn't error
		const hand = new Discord.MessageEmbed()
			.setTitle("Your Hand:")
			.setDescription(Object.values(player.cards).map(card => `${card.id}: ${card.name}`).sort().join("\n"))
			.setColor(Math.floor(Math.random() * 16777215));
		player.member.send(hand).then(this.dealCards(players, sortFunction, colorFunction));
	}

	/**
	 * Registers mods and caches images
	 */
	setup() {
		return Canvas.loadImage("images/halo.png").then(image => {
			this.meta.images.halo = image;
		});
	}

	/**
	 * Starts the game
	 */
	start() {
		this.ctx.font = "40px Arial";
		return new Promise(resolve => {
			Canvas.loadImage("images/background.png").then(image => {
				this.ctx.drawImage(image, 0, 0);
				return this.drawStatic(Object.values(this.players).sort((player1, player2) => player1.index - player2.index));
			}).then(() => {
				this._canvas = Canvas.createCanvas(this.canvas.width, this.canvas.height);
				this._ctx = this._canvas.getContext("2d");
				this._ctx.drawImage(this.canvas, 0, 0);
				resolve();
			});
		});
	}

	/**
	 * The catch-all method for any unknown commands.
	 * Usually to handle discarding
	 * @virtual
	 * @param {string[]} args - The exact string the user typed, sans the server prefix, separated by spaces
	 * @param {Discord.GuildMember|Discord.User} - The member who typed the message
	 */
	discard(args, member) {}

	/**
	 * Advances to the next player
	 * @virtual
	 */
	nextPlayer() {}

	/**
	 * Called when the current player has taken too long on their turn
	 * @virtual
	 */
	timeLimit() {}

	/**
	 * Updates the UI displayed in the server
	 * @virtual
	 */
	updateUI() {}

	/**
	 * Adds a player to the game
	 * @virtual
	 * @param {Discord.GuildMember} member - The member to generate a Player for
	 */
	addPlayer(member) {}

	/**
	 * Removes a player from the game
	 * @virtual
	 * @param {Player} player - The Player to remove from the game
	 */
	removePlayer(player) {}

	/**
	 * Randomizes the player order within a game
	 */
	randomizePlayerOrder() {
		let indexes = Core.shuffle(Array.from(Array(Object.keys(this.players).length).keys()));
		Object.values(this.players).forEach(player => player.index = indexes.pop());
	}

	/**
	 * Resets the time limit for the game
	 */
	resetTimeLimit() {
		// TODO: end the game if everyone hasn't gone once in row, or 10 min have passed.
		clearTimeout(this.timeLimit);
		if (!this.meta.timeLimit) return;
		this.timeLimit = setTimeout(() => {
			this.timeLimit();
			this.updateUI();
		}, this.meta.timeLimit * 1000);
	}

	/**
	 * Render static images which don't change during the game onto the table
	 * @param {Player[]} players - The list of players' avatars to render
	 */
	drawStatic(players) {
		if (!players.length) return;
		const pLength = Object.keys(this.players).length;
		return Canvas.loadImage(players[0].member.user.displayAvatarURL({format: "png", size: 64})).then(image => {
			this.ctx.drawImage(image, 300*Math.cos(2*Math.PI*players[0].index/pLength-Math.PI)+340, 200*Math.sin(2*Math.PI*players[0].index/pLength-Math.PI)+210, 80, 80);
			return this.drawStatic(players.slice(1));
		});
	}

	/**
	 * Draws a number of cards from a pile, and inserts them into a Player's cards
	 * @param {Player} player - The Player which gets the cards
	 * @param {Pile} pile - The Pile to draw cards from
	 * @param {number} numCards - The number of Cards to draw
	 * @returns {Card[]} The newly drawn Cards
	 */
	draw(player, pile, numCards) {
		let newCards = [];
		//this.events.emit("draw", Core.phases.START, player, pile, numCards, newCards);
		//if (!this.draw.cancelled) {
		for (let i = 0; i < numCards; i++) {
			newCards.push(pile.cards.shift());
			if (pile.cards.length === 0) this.deckCreate(pile); // Instead of reshuffling the old pile, we create a new one to preserve card history. Doesn't break mods which rely on previously discarded cards.
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

/**
 * A Player object
 * @class Player
 */
class Player {
	/**
	 * @param {Discord.GuildMember} member - The member associated with the player
	 * @param {?Card[]} cards - The list of cards in the player's posession
	 * @param {?boolean} isLeader - If the player is a leader/host over a game
	 * @param {?number} index - The index of the player in turn-order. 0 is first player
	 * @param {?Object<Player, string>} knowledge - What specific knowledge this player knows, that others might not.
	 * @param {?Object<string, *>} traits - Any special traits the player may have
	 */
	constructor(member, cards = [], isLeader = false, index = 0, knowledge = {}, traits = {}) {
		this.member = member;
		this.cards = cards;
		this.isLeader = isLeader;
		this.index = index;
		this.knowledge = knowledge;
		this.traits = traits;
	}
}

/**
 * A Pile object. Basically a stack of cards that don't belong to a specific player
 * @class Pile
 */
class Pile {
	/**
	 * @param {?Card[]} cards - The cards in the pile
	 * @param {?Object<string, *>} traits - Any special traits the pile might have
	 */
	constructor(cards = [], traits = {}) {
		this.cards = cards;
		this.traits = traits;
	}
}

/**
 * A Card object
 * @class Card
 */
class Card {
	/**
	 * @param {string} id - The id of the card
	 * @param {?string} [name=id] - The Human-Readable name of the card
	 * @param {?string} image - The URL to the image of the card
	 * @param {?Object<string, *>} traits - Any special traits the card might have
	 */
	constructor(id, name, image = "", traits = {}) {
		this.id = id;
		this.name = name || id;
		this.image = image;
		this.traits = traits;
	}

	/**
	 * Tests to see if a card is "real"
	 * @returns {boolean} If the card is real
	 */
	isEmpty() {
		return Object.keys(this).length > 0
	}

	/**
	 * Tests if two cards are equal. Ignores the name and images of the cards
	 * @deprecated
	 * @param {Card} card - The second card to check of equivity
	 * @returns {boolean} If the two cards' values are equal
	 */
	isEqual(card) {
		if (this === card) return true;
		return typeof Core.getCards([card], this.id, this.traits)[0] !== "undefined" && typeof Core.getCards([this], card.id, card.traits)[0] !== "undefined";
	}
}

export { Core, Player, Pile, Card };