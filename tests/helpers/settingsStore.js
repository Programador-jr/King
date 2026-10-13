function createSettingsStore() {
  const documents = new Map();

  return {
    ensure(guildId, defaults) {
      const current = documents.get(guildId) || {};
      for (const [key, value] of Object.entries(defaults)) {
        if (current[key] === undefined) current[key] = value;
      }
      documents.set(guildId, current);
      return current;
    },
    get(guildId, key) {
      const current = documents.get(guildId);
      return key === undefined ? current : current?.[key];
    },
    set(guildId, keyOrDocument, value) {
      const current = documents.get(guildId) || {};
      if (keyOrDocument && typeof keyOrDocument === "object") {
        documents.set(guildId, { ...current, ...keyOrDocument });
      } else {
        documents.set(guildId, { ...current, [keyOrDocument]: value });
      }
    },
  };
}

module.exports = { createSettingsStore };
