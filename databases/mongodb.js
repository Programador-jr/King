const mongoose = require("mongoose");
const dns = require("node:dns");
const GuildSettings = require("./settings");
const GuildStats = require("./infos");

const DNS_SERVERS = (process.env.DNS_SERVERS || "1.1.1.1,8.8.8.8").split(",");
dns.setServers(DNS_SERVERS);

const MONGO_URI = process.env.MONGO_URI;

let isConnected = false;

async function connectMongoDB() {
  if (isConnected) return;
  
  try {
    await mongoose.connect(MONGO_URI);
    isConnected = true;
    console.log(`✅ Conectado ao MongoDB (DNS: ${DNS_SERVERS.join(", ")})`);
  } catch (error) {
    console.error("❌ Erro ao conectar no MongoDB:", error.message);
    process.exit(1);
  }
}

class MongoDBEnmap {
  constructor() {
    this.cache = new Map();
  }

  async _load(guildId) {
    if (this.cache.has(guildId)) {
      return this.cache.get(guildId);
    }
    
    let doc = await GuildSettings.findById(guildId).lean().exec();
    if (!doc) {
      doc = { _id: guildId };
    }
    
    this.cache.set(guildId, doc);
    return doc;
  }

  async _save(guildId, data) {
    const toSave = { ...data };
    delete toSave._id;
    
    await GuildSettings.findByIdAndUpdate(guildId, toSave, { upsert: true });
    this.cache.set(guildId, { _id: guildId, ...toSave });
  }

  ensure(guildId, defaults = {}) {
    if (this.cache.has(guildId)) {
      const doc = this.cache.get(guildId);
      const hasData = Object.keys(doc).some(k => k !== '_id' && doc[k] !== undefined && doc[k] !== null && 
        (Array.isArray(doc[k]) ? doc[k].length > 0 : true));
      
      if (!hasData) {
        this._save(guildId, defaults);
        this.cache.set(guildId, { _id: guildId, ...defaults });
      }
      return doc;
    }
    
    this._save(guildId, defaults);
    const doc = { _id: guildId, ...defaults };
    this.cache.set(guildId, doc);
    return doc;
  }

  get(guildId, key) {
    if (!this.cache.has(guildId)) {
      return undefined;
    }
    
    const doc = this.cache.get(guildId);
    
    if (key === undefined) {
      const obj = { ...doc };
      delete obj._id;
      return obj;
    }
    
    return doc[key];
  }

  async _ensureAndGet(guildId, key) {
    await this._load(guildId);
    return this.get(guildId, key);
  }

  set(guildId, value, key) {
    if (!key) {
      this._save(guildId, value);
      return;
    }

    let doc = this.cache.get(guildId) || { _id: guildId };
    doc[key] = value;
    this._save(guildId, doc);
  }

  push(guildId, value, key) {
    let doc = this.cache.get(guildId) || { _id: guildId };
    const current = doc[key] || [];
    
    if (!Array.isArray(current)) {
      doc[key] = [value];
    } else {
      doc[key] = [...current, value];
    }
    
    this._save(guildId, doc);
  }

  remove(guildId, value, key) {
    let doc = this.cache.get(guildId) || { _id: guildId };
    const current = doc[key] || [];
    
    if (Array.isArray(current)) {
      doc[key] = current.filter(v => v !== value);
    } else {
      doc[key] = [];
    }
    
    this._save(guildId, doc);
  }

  has(guildId, key) {
    if (!this.cache.has(guildId)) {
      return false;
    }
    
    const doc = this.cache.get(guildId);
    return key in doc;
  }

  delete(guildId, key) {
    let doc = this.cache.get(guildId) || { _id: guildId };
    delete doc[key];
    this._save(guildId, doc);
  }

  async fetch(guildId) {
    await this._load(guildId);
    return this.cache.get(guildId);
  }

  clear() {
    this.cache.clear();
  }
}

async function addSongPlayed(guildId, song) {
  try {
    await GuildStats.findByIdAndUpdate(guildId, {
      $inc: { songsPlayed: 1 }
    }, { upsert: true });
  } catch (e) {
    console.log("Erro ao adicionar música tocada:", e.message);
  }
}

async function addMusicTime(guildId, seconds) {
  try {
    await GuildStats.findByIdAndUpdate(guildId, {
      $inc: { totalMusicTime: seconds }
    }, { upsert: true });
  } catch (e) {
    console.log("Erro ao adicionar tempo de música:", e.message);
  }
}

async function addCommandUsed(guildId, commandName) {
  try {
    const key = `topCommands.${commandName}`;
    await GuildStats.findByIdAndUpdate(guildId, {
      $inc: { commandsUsed: 1, [key]: 1 }
    }, { upsert: true });
  } catch (e) {
    console.log("Erro ao adicionar comando usado:", e.message);
  }
}

async function addUserJoined(guildId) {
  try {
    await GuildStats.findByIdAndUpdate(guildId, {
      $inc: { usersJoined: 1 }
    }, { upsert: true });
  } catch (e) {
    console.log("Erro ao adicionar usuário Joined:", e.message);
  }
}

async function getServerStats(guildId) {
  try {
    let stats = await GuildStats.findById(guildId);
    if (!stats) {
      stats = await GuildStats.create({ _id: guildId });
    }
    return stats;
  } catch (e) {
    console.log("Erro ao obter estatísticas:", e.message);
    return null;
  }
}

module.exports = {
  connectMongoDB,
  GuildSettings,
  GuildStats,
  MongoDBEnmap,
  addSongPlayed,
  addMusicTime,
  addCommandUsed,
  addUserJoined,
  getServerStats
};
