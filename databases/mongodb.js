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
    this.loading = new Map();
  }

  _normalizeDoc(guildId, doc = {}) {
    return { _id: String(guildId), ...doc, _id: String(guildId) };
  }

  _saveSafe(guildId, data) {
    this._save(guildId, data).catch((error) => {
      console.error(`[MongoDBEnmap] Falha ao salvar guild ${guildId}:`, error.message);
    });
  }

  async _loadFromDatabase(guildId) {
    const id = String(guildId);
    const doc = await GuildSettings.findById(id).lean().exec();
    if (!doc) {
      return null;
    }

    const normalized = this._normalizeDoc(id, doc);
    this.cache.set(id, normalized);
    return normalized;
  }

  async _load(guildId) {
    const id = String(guildId);

    if (this.loading.has(id)) {
      await this.loading.get(id);
      return this.cache.get(id) || { _id: id };
    }

    if (this.cache.has(id)) {
      return this.cache.get(id);
    }

    const loadPromise = this._loadFromDatabase(id).catch((error) => {
      console.error(`[MongoDBEnmap] Falha ao carregar guild ${id}:`, error.message);
      return null;
    });

    this.loading.set(id, loadPromise);

    try {
      const loaded = await loadPromise;
      if (loaded) {
        return loaded;
      }

      const empty = { _id: id };
      this.cache.set(id, empty);
      return empty;
    } finally {
      this.loading.delete(id);
    }
  }

  async _save(guildId, data) {
    const id = String(guildId);
    const toSave = { ...data };
    delete toSave._id;
    
    await GuildSettings.findByIdAndUpdate(id, toSave, { upsert: true });
    this.cache.set(id, { _id: id, ...toSave });
  }

  async warmCache() {
    const docs = await GuildSettings.find({}).lean().exec();

    for (const doc of docs) {
      if (!doc || !doc._id) continue;
      const id = String(doc._id);
      this.cache.set(id, this._normalizeDoc(id, doc));
    }

    return docs.length;
  }

  ensure(guildId, defaults = {}) {
    const id = String(guildId);
    const cached = this.cache.get(id);

    if (cached) {
      if (this.loading.has(id)) {
        return cached;
      }

      let changed = false;
      const merged = { ...cached };

      for (const [key, value] of Object.entries(defaults)) {
        if (merged[key] === undefined || merged[key] === null) {
          merged[key] = value;
          changed = true;
        }
      }

      if (changed) {
        this.cache.set(id, merged);
        this._saveSafe(id, merged);
      }

      return merged;
    }

    const seeded = this._normalizeDoc(id, defaults);
    this.cache.set(id, seeded);

    const loadPromise = this._loadFromDatabase(id)
      .then((docFromDb) => {
        if (!docFromDb) {
          this._saveSafe(id, seeded);
          return seeded;
        }

        const merged = { ...defaults, ...docFromDb, _id: id };
        const needsBackfill = Object.keys(defaults).some(
          (key) => docFromDb[key] === undefined || docFromDb[key] === null
        );

        this.cache.set(id, merged);
        if (needsBackfill) {
          this._saveSafe(id, merged);
        }

        return merged;
      })
      .catch((error) => {
        console.error(`[MongoDBEnmap] Falha ao sincronizar guild ${id}:`, error.message);
        return seeded;
      })
      .finally(() => {
        this.loading.delete(id);
      });

    this.loading.set(id, loadPromise);
    return seeded;
  }

  get(guildId, key) {
    const id = String(guildId);
    if (!this.cache.has(id)) {
      return undefined;
    }
    
    const doc = this.cache.get(id);
    
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
    const id = String(guildId);

    if (!key) {
      const doc = this._normalizeDoc(id, value);
      this.cache.set(id, doc);
      this._saveSafe(id, doc);
      return;
    }

    let doc = { ...(this.cache.get(id) || { _id: id }) };
    doc[key] = value;
    this.cache.set(id, doc);
    this._saveSafe(id, doc);
  }

  push(guildId, value, key) {
    const id = String(guildId);
    let doc = { ...(this.cache.get(id) || { _id: id }) };
    const current = doc[key] || [];
    
    if (!Array.isArray(current)) {
      doc[key] = [value];
    } else {
      doc[key] = [...current, value];
    }
    
    this.cache.set(id, doc);
    this._saveSafe(id, doc);
  }

  remove(guildId, value, key) {
    const id = String(guildId);
    let doc = { ...(this.cache.get(id) || { _id: id }) };
    const current = doc[key] || [];
    
    if (Array.isArray(current)) {
      doc[key] = current.filter(v => v !== value);
    } else {
      doc[key] = [];
    }
    
    this.cache.set(id, doc);
    this._saveSafe(id, doc);
  }

  has(guildId, key) {
    const id = String(guildId);
    if (!this.cache.has(id)) {
      return false;
    }
    
    const doc = this.cache.get(id);
    return key in doc;
  }

  delete(guildId, key) {
    const id = String(guildId);
    let doc = { ...(this.cache.get(id) || { _id: id }) };
    delete doc[key];
    this.cache.set(id, doc);
    this._saveSafe(id, doc);
  }

  async fetch(guildId) {
    await this._load(guildId);
    return this.cache.get(String(guildId));
  }

  clear() {
    this.cache.clear();
    this.loading.clear();
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
