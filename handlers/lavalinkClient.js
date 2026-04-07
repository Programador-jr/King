const { EventEmitter } = require("node:events");
const fs = require("node:fs");
const path = require("node:path");
const { LavalinkManager } = require("lavalink-client");
const playdl = require("play-dl");
const WebSocket = require("ws");

class LavalinkManagerWrapper extends EventEmitter {
    constructor(client) {
        super();
        this.client = client;
        this.manager = null;
        this.rawListener = null;
        this.autoplayState = new Map();
        this.filterState = new Map();
        this.lastTrackStartAt = new Map();
        this.lastTrackErrorAt = new Map();
        this.lastTrackStuckAt = new Map();
        this.lastSocketClosedAt = new Map();
        this.voiceStateCache = new Map();
        this.voiceServerCache = new Map();
        this.voiceRecovery = new Map();
        this.trackStatsCache = new Map();
    }

    parseBoolean(value, fallback = false) {
        if (typeof value === "boolean") return value;
        if (typeof value !== "string") return fallback;
        const normalized = value.trim().toLowerCase();
        if (["1", "true", "yes", "on"].includes(normalized)) return true;
        if (["0", "false", "no", "off"].includes(normalized)) return false;
        return fallback;
    }

    shortError(error) {
        if (!error) return "";
        const message = error instanceof Error ? error.message : String(error);
        return String(message || "").replace(/\s+/g, " ").trim().slice(0, 200);
    }

    shortPayload(payload) {
        if (!payload) return "";
        const code = payload?.code ?? payload?.op ?? null;
        const reason = payload?.reason || payload?.message || null;
        if (code !== null || reason) {
            return `code=${code ?? "?"} reason=${String(reason || "").replace(/\s+/g, " ").trim().slice(0, 120)}`;
        }
        return this.shortError(payload);
    }

    log(level, message, error) {
        const suffix = error ? ` ${this.shortError(error)}` : "";
        const line = `[Lavalink] ${message}${suffix}`.trim();
        if (level === "error") return console.error(line);
        if (level === "warn") return console.warn(line);
        return console.log(line);
    }

    normalizeStat(value) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }

    extractStatsFromTrack(track) {
        const info = track?.info || {};
        const userData = track?.userData || {};
        const stats = userData?.stats || {};

        const views = this.normalizeStat(
            stats.views ?? userData.views ?? info.views ?? info.viewCount ?? info.view_count ?? info.viewcount,
        );
        const likes = this.normalizeStat(
            stats.likes ?? userData.likes ?? info.likes ?? info.likeCount ?? info.like_count ?? info.likecount,
        );
        const dislikes = this.normalizeStat(
            stats.dislikes ?? userData.dislikes ?? info.dislikes ?? info.dislikeCount ?? info.dislike_count ?? info.dislikecount,
        );

        return { views, likes, dislikes };
    }

    getTrackStatsKey(track) {
        const info = track?.info || {};
        return String(info.identifier || info.uri || info.url || "").trim();
    }

    isYouTubeTrack(track) {
        const info = track?.info || {};
        const source = String(info.sourceName || "").toLowerCase();
        const uri = String(info.uri || "").toLowerCase();
        if (source.includes("youtube") || source === "yt" || source === "ytsearch" || source === "ytmsearch") {
            return true;
        }
        return uri.includes("youtube.com") || uri.includes("youtu.be");
    }

    async fetchYouTubeStats(track) {
        const info = track?.info || {};
        const identifier = String(info.identifier || "").trim();
        const uri = String(info.uri || "").trim();
        const url = uri || (identifier ? `https://www.youtube.com/watch?v=${identifier}` : "");
        if (!url) return null;

        try {
            const result = await playdl.video_basic_info(url);
            const details = result?.video_details || {};
            const views = this.normalizeStat(details.views);
            const likes = this.normalizeStat(details.likes);
            const dislikes = this.normalizeStat(details.dislikes);
            if (views === null && likes === null && dislikes === null) return null;
            return { views, likes, dislikes };
        } catch {
            return null;
        }
    }

    async ensureTrackStats(track) {
        if (!track) return null;
        const existing = this.extractStatsFromTrack(track);
        if (existing.views !== null || existing.likes !== null || existing.dislikes !== null) {
            return existing;
        }

        const cacheKey = this.getTrackStatsKey(track);
        if (cacheKey && this.trackStatsCache.has(cacheKey)) {
            const cached = this.trackStatsCache.get(cacheKey);
            track.userData = { ...(track.userData || {}), stats: cached };
            return cached;
        }

        if (!this.isYouTubeTrack(track)) return null;
        const fetched = await this.fetchYouTubeStats(track);
        if (!fetched) return null;

        if (cacheKey) this.trackStatsCache.set(cacheKey, fetched);
        track.userData = { ...(track.userData || {}), stats: fetched };
        return fetched;
    }

    async ensureSongStats(song) {
        if (!song) return null;
        const track = song.__track;
        if (!track) return null;
        const stats = await this.ensureTrackStats(track);
        if (!stats) return null;
        song.views = stats.views ?? song.views ?? 0;
        song.likes = stats.likes ?? song.likes ?? 0;
        song.dislikes = stats.dislikes ?? song.dislikes ?? 0;
        return stats;
    }

    normalizeApiVersion(value, fallback = "v4") {
        const raw = String(value || "").trim().toLowerCase();
        if (raw === "v3" || raw === "3") return "v3";
        if (raw === "v4" || raw === "4") return "v4";
        return fallback;
    }

    getNodeOptions() {
        const rawHost = String(process.env.LAVALINK_HOST || "localhost").trim();
        const hostWithoutProtocol = rawHost.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
        const host = hostWithoutProtocol.split("/")[0];
        const port = Number.parseInt(process.env.LAVALINK_PORT || "2333", 10) || 2333;
        const secureDefault = port === 443 || /^https:\/\//i.test(rawHost);
        const authorization = String(process.env.LAVALINK_PASSWORD || "").trim();

        if (!authorization) {
            throw new Error("LAVALINK_PASSWORD nao definido no .env");
        }

        return {
            id: "main-node",
            host,
            port,
            secure: secureDefault,
            authorization,
            apiVersion: "v4",
        };
    }

    resolveHost(rawHost) {
        const cleaned = String(rawHost || "").trim();
        if (!cleaned) return "";
        const hostWithoutProtocol = cleaned.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
        return hostWithoutProtocol.split("/")[0];
    }

    loadNodesFromConfig() {
        const configPath = path.join(__dirname, "..", "botconfig", "lavalink.json");
        if (!fs.existsSync(configPath)) return [];

        let raw;
        try {
            raw = fs.readFileSync(configPath, "utf8");
        } catch (error) {
            this.log("warn", "Falha ao ler lavalink.json.", error);
            return [];
        }

        let parsed;
        try {
            parsed = JSON.parse(raw);
        } catch (error) {
            this.log("warn", "lavalink.json invalido.", error);
            return [];
        }

        const entries = Array.isArray(parsed) ? parsed : Object.values(parsed || {});
        const nodes = [];

        for (let index = 0; index < entries.length; index += 1) {
            const entry = entries[index] || {};
            const rawHost = entry.host || entry.hostname || entry.url || "";
            const host = this.resolveHost(rawHost);
            const port = Number.parseInt(entry.port, 10);
            const authorization = String(entry.password || entry.authorization || "").trim();

            if (!host || !Number.isFinite(port) || !authorization) {
                this.log("warn", `Node ignorado (config incompleta) na posicao ${index + 1}.`);
                continue;
            }

            const secureDefault = port === 443 || /^https:\/\//i.test(String(rawHost || "").trim());
            const secure = typeof entry.secure !== "undefined"
                ? this.parseBoolean(entry.secure, secureDefault)
                : secureDefault;
            const apiVersion = this.normalizeApiVersion(entry.version || entry.apiVersion, "v4");

            nodes.push({
                id: String(entry.id || entry.name || `node-${index + 1}`),
                host,
                port,
                secure,
                authorization,
                apiVersion,
            });
        }

        return nodes;
    }

    getNodeOptionsList() {
        const fromConfig = this.loadNodesFromConfig();
        if (fromConfig.length) return fromConfig;
        return [this.getNodeOptions()];
    }

    applyApiVersionCompatibility() {
        if (!this.manager) return;
        let patched = false;

        for (const node of this.manager.nodeManager.nodes.values()) {
            const apiVersion = this.normalizeApiVersion(node?.options?.apiVersion, "v4");
            if (apiVersion !== "v3") continue;
            node.version = "v3";
            patched = true;

            if (node.__v3WebsocketPatched) continue;
            node.__v3WebsocketPatched = true;

            node.connect = function patchedConnectForV3(sessionId) {
                if (this.connected) return;

                const headers = {
                    Authorization: this.options.authorization,
                    "User-Id": this._LManager.options.client.id,
                    "Client-Name": String(this._LManager.options.client.username || "Lavalink-Client").replace(/[^\x20-\x7E]/g, ""),
                };

                if (typeof this.options.sessionId === "string" || typeof sessionId === "string") {
                    headers["Session-Id"] = this.options.sessionId || sessionId;
                    this.sessionId = this.options.sessionId || sessionId;
                }

                this.socket = new WebSocket(
                    `ws${this.options.secure ? "s" : ""}://${this.options.host}:${this.options.port}/v3/websocket`,
                    { headers },
                );

                this.socket.on("open", this.open.bind(this));
                this.socket.on("close", (code, reason) => this.close(code, reason?.toString()));
                this.socket.on("message", this.message.bind(this));
                this.socket.on("error", this.error.bind(this));
            };
        }

        if (patched) {
            this.log("info", "Compatibilidade v3 ativada.");
        }
    }

    attachEvents() {
        this.manager.nodeManager.on("connect", (node) => {
            this.log("info", `Node conectado: ${node.id}`);
            this.emit("nodeConnect", node);
        });

        this.manager.nodeManager.on("disconnect", (node, reason) => {
            const detail = this.shortPayload(reason);
            this.log("warn", `Node desconectado: ${node.id}${detail ? ` (${detail})` : ""}`);
            this.emit("nodeDisconnect", node, reason);
        });

        this.manager.nodeManager.on("error", (node, error) => {
            this.log("error", `Node error: ${node?.id || "unknown"}`, error);
            this.emit("nodeError", node, error);
        });

        this.manager.on("trackStart", (player, track, payload) => {
            this.lastTrackStartAt.set(player.guildId, Date.now());
            this.ensureTrackStats(track).catch(() => {});
            this.emit("playSong", player, track, payload);
        });

        this.manager.on("trackEnd", (player, track, payload) => {
            this.emit("finishSong", player, track, payload);
        });

        this.manager.on("queueEnd", (player, track, payload) => {
            this.emit("finish", player, track, payload);
        });

        this.manager.on("playerDestroy", (player, reason) => {
            this.autoplayState.delete(player.guildId);
            this.filterState.delete(player.guildId);
            this.emit("empty", player, reason);
        });

        this.manager.on("trackError", (player, track, payload) => {
            const exception = payload?.exception || payload || new Error("Track error");
            this.lastTrackErrorAt.set(player.guildId, {
                at: Date.now(),
                payload,
            });
            this.emit("error", player.guildId, exception);
        });

        this.manager.on("trackStuck", (player, track, payload) => {
            this.lastTrackStuckAt.set(player.guildId, {
                at: Date.now(),
                payload,
            });
        });

        this.manager.on("playerSocketClosed", (player, payload) => {
            this.lastSocketClosedAt.set(player.guildId, {
                at: Date.now(),
                payload,
            });
            if (this.shouldRecoverSocketClose(payload) && player.queue?.current) {
                this.recoverAfterSocketClosed(player.guildId, payload).catch(() => {});
            }
        });
    }

    waitForUsableNode(timeoutMs = 15000, failFast = false) {
        if (this.manager?.useable) return Promise.resolve(true);

        return new Promise((resolve, reject) => {
            let settled = false;
            let lastError = null;

            const resolveOnce = (value) => {
                if (settled) return;
                settled = true;
                cleanup();
                resolve(value);
            };

            const rejectOnce = (error) => {
                if (settled) return;
                settled = true;
                cleanup();
                reject(error instanceof Error ? error : new Error(String(error)));
            };

            const timer = setTimeout(() => {
                if (lastError) {
                    rejectOnce(lastError);
                    return;
                }
                rejectOnce(new Error("Nenhum node Lavalink ficou utilizavel no tempo limite."));
            }, timeoutMs);

            const onConnect = () => {
                if (!this.manager?.useable) return;
                resolveOnce(true);
            };

            const onError = (_node, error) => {
                lastError = error instanceof Error ? error : new Error(String(error));
                if (failFast) {
                    rejectOnce(lastError);
                }
            };

            const cleanup = () => {
                clearTimeout(timer);
                this.manager?.nodeManager?.off("connect", onConnect);
                this.manager?.nodeManager?.off("error", onError);
            };

            this.manager.nodeManager.on("connect", onConnect);
            this.manager.nodeManager.on("error", onError);
        });
    }

    cacheVoicePacket(packet) {
        if (!packet || !packet.t || !packet.d) return;
        const data = packet.d;

        if (packet.t === "VOICE_STATE_UPDATE") {
            if (data.user_id !== this.client.user.id) return;
            if (!data.guild_id) return;
            if (!data.channel_id) {
                this.voiceStateCache.delete(data.guild_id);
                this.voiceServerCache.delete(data.guild_id);
                return;
            }
            this.voiceStateCache.set(data.guild_id, {
                sessionId: data.session_id,
                channelId: data.channel_id,
                guildId: data.guild_id,
                at: Date.now(),
            });
            return;
        }

        if (packet.t === "VOICE_SERVER_UPDATE") {
            if (!data.guild_id) return;
            this.voiceServerCache.set(data.guild_id, {
                token: data.token,
                endpoint: data.endpoint,
                guildId: data.guild_id,
                at: Date.now(),
            });
        }
    }

    async syncCachedVoiceToPlayer(guildId, minFreshAt = 0) {
        const player = this.getPlayer(guildId);
        if (!player?.node?.sessionId) return false;

        const state = this.voiceStateCache.get(guildId);
        const server = this.voiceServerCache.get(guildId);
        if (!state || !server) return false;
        if (minFreshAt > 0 && ((state.at || 0) < minFreshAt || (server.at || 0) < minFreshAt)) return false;
        if (!state.sessionId || !state.channelId || !server.token || !server.endpoint) return false;

        const voiceData = {
            sessionId: state.sessionId,
            channelId: state.channelId,
            token: server.token,
            endpoint: server.endpoint,
        };

        try {
            await player.node.updatePlayer({
                guildId,
                playerOptions: {
                    voice: voiceData,
                },
            });
            player.voice = { ...player.voice, ...voiceData };
            return true;
        } catch {
            return false;
        }
    }

    async waitForVoiceSession(guildId, timeoutMs = 15000, minFreshAt = 0) {
        const isVoiceReady = () => {
            const player = this.getPlayer(guildId);
            if (!player) return false;
            const voice = player.voice || {};
            const baseReady = Boolean(
                voice.sessionId &&
                voice.token &&
                voice.endpoint &&
                (voice.channelId || player.voiceChannelId),
            );
            if (!baseReady) return false;
            if (minFreshAt <= 0) return true;

            const state = this.voiceStateCache.get(guildId);
            const server = this.voiceServerCache.get(guildId);
            if (!state || !server) return false;
            if ((state.at || 0) < minFreshAt || (server.at || 0) < minFreshAt) return false;
            if (state.sessionId && voice.sessionId && state.sessionId !== voice.sessionId) return false;
            return true;
        };

        if (isVoiceReady()) return true;

        const startedAt = Date.now();
        while ((Date.now() - startedAt) < timeoutMs) {
            await this.syncCachedVoiceToPlayer(guildId, minFreshAt);
            if (isVoiceReady()) return true;
            await new Promise((resolve) => setTimeout(resolve, 250));
        }
        return false;
    }

    shouldRecoverSocketClose(payload) {
        const code = Number(payload?.code);
        return [4006, 4009, 4015].includes(code);
    }

    async waitForPlaybackState(guildId, timeoutMs = 12000, minPosition = 0) {
        const startedAt = Date.now();
        while ((Date.now() - startedAt) < timeoutMs) {
            const player = this.getPlayer(guildId);
            if (player && (player.playing || Number(player.position || 0) > (minPosition + 250))) {
                return true;
            }
            await new Promise((resolve) => setTimeout(resolve, 250));
        }
        return false;
    }

    async refreshVoiceSession(guildId, timeoutMs = 12000) {
        const player = this.getPlayer(guildId);
        if (!player || !player.voiceChannelId) return false;

        const refreshAt = Date.now();
        player.voice = {
            ...(player.voice || {}),
            sessionId: null,
            token: null,
            endpoint: null,
            channelId: player.voiceChannelId,
        };

        await player.connect().catch(() => {});
        const voiceReady = await this.waitForVoiceSession(guildId, timeoutMs, refreshAt);
        if (!voiceReady) return false;
        await this.syncCachedVoiceToPlayer(guildId, refreshAt);
        return true;
    }

    async recoverAfterSocketClosed(guildId, payload) {
        if (!this.shouldRecoverSocketClose(payload)) return false;
        if (this.voiceRecovery.has(guildId)) {
            return this.voiceRecovery.get(guildId);
        }

        const recoveryPromise = (async () => {
            const player = this.getPlayer(guildId);
            if (!player?.queue?.current || !player.voiceChannelId) return false;

            const previousPosition = Math.max(0, Math.floor(Number(player.position || 0)));
            const detail = this.shortPayload(payload);
            this.log("warn", `Recuperando sessao de voz invalida${detail ? ` (${detail})` : ""}.`);

            const refreshed = await this.refreshVoiceSession(guildId, 14000);
            if (!refreshed) return false;

            const track = player.queue.current;
            await player.play({
                clientTrack: track,
                position: previousPosition,
                paused: false,
            });

            const restored = await this.waitForPlaybackState(guildId, 12000, previousPosition);
            if (restored) {
                this.lastTrackStartAt.set(guildId, Date.now());
            }
            return restored;
        })().finally(() => {
            this.voiceRecovery.delete(guildId);
        });

        this.voiceRecovery.set(guildId, recoveryPromise);
        return recoveryPromise;
    }

    async connect() {
        if (this.manager?.initiated) {
            return this.manager;
        }

        const debugEnabled = this.parseBoolean(process.env.LAVALINK_DEBUG, false);
        const nodeOptionsList = this.getNodeOptionsList();
        if (!nodeOptionsList.length) {
            throw new Error("Nenhum node Lavalink configurado.");
        }

        if (!this.rawListener) {
            this.rawListener = async (packet) => {
                if (!this.manager) return;
                this.cacheVoicePacket(packet);
                try {
                    await this.manager.sendRawData(packet);
                    if (packet?.t === "VOICE_STATE_UPDATE" || packet?.t === "VOICE_SERVER_UPDATE") {
                        const guildId = packet?.d?.guild_id;
                        if (guildId) {
                            await this.syncCachedVoiceToPlayer(guildId);
                        }
                    }
                } catch (error) {
                    this.log("warn", "Falha ao enviar pacote raw.", error);
                }
            };
            this.client.on("raw", this.rawListener);
        }

        let lastError = null;

        for (const nodeOptions of nodeOptionsList) {
            try {
                this.manager = new LavalinkManager({
                    nodes: [nodeOptions],
                    sendToShard: (guildId, payload) => {
                        const guild = this.client.guilds.cache.get(guildId);
                        if (guild?.shard) {
                            guild.shard.send(payload);
                        }
                    },
                    client: {
                        id: this.client.user.id,
                        username: this.client.user.username,
                    },
                    autoSkip: true,
                    playerOptions: {
                        defaultSearchPlatform: "ytsearch",
                        onEmptyQueue: {
                            destroyAfterMs: 120000,
                        },
                    },
                    advancedOptions: {
                        enableDebugEvents: debugEnabled,
                        debugOptions: {
                            noAudio: debugEnabled,
                        },
                    },
                });

                this.applyApiVersionCompatibility();
                this.attachEvents();

                await this.manager.init({
                    id: this.client.user.id,
                    username: this.client.user.username,
                });

                await this.waitForUsableNode(20000, true);

                this.log("info", `Usando node ${nodeOptions.id}`);
                return this.manager;
            } catch (error) {
                lastError = error;
                this.log("warn", `Falha ao conectar no node ${nodeOptions.id}. Tentando o proximo...`, error);

                try {
                    await this.manager?.nodeManager?.disconnectAll(true, true);
                } catch {
                    // ignore cleanup errors
                }
                try {
                    this.manager?.removeAllListeners();
                    this.manager?.nodeManager?.removeAllListeners();
                } catch {
                    // ignore cleanup errors
                }
                this.manager = null;
            }
        }

        throw lastError || new Error("Nao foi possivel conectar a nenhum node Lavalink.");
    }

    normalizeRequester(requester) {
        const fallback = this.client.user;
        if (!requester) return fallback;
        if (requester.user) return requester.user;
        if (requester.id && (requester.tag || requester.username)) return requester;
        return fallback;
    }

    getPlayer(guildId) {
        if (!this.manager) return null;
        return this.manager.getPlayer(guildId) || this.manager.players.get(guildId) || null;
    }

    legacyRepeatMode(repeatMode) {
        if (repeatMode === "track") return 1;
        if (repeatMode === "queue") return 2;
        return 0;
    }

    lavalinkRepeatMode(mode) {
        const numeric = Number(mode);
        if (numeric === 1) return "track";
        if (numeric === 2) return "queue";
        return "off";
    }

    isUrl(query) {
        return /^https?:\/\//i.test(String(query || "").trim());
    }

    mapV3LoadType(loadType) {
        const normalized = String(loadType || "").toUpperCase();
        if (normalized === "TRACK_LOADED") return "track";
        if (normalized === "PLAYLIST_LOADED") return "playlist";
        if (normalized === "SEARCH_RESULT") return "search";
        if (normalized === "NO_MATCHES") return "empty";
        if (normalized === "LOAD_FAILED") return "error";
        return normalized.toLowerCase() || "empty";
    }

    normalizeV3Track(rawTrack) {
        if (!rawTrack || typeof rawTrack !== "object") return null;
        const info = rawTrack.info || {};
        return {
            ...rawTrack,
            encoded: rawTrack.encoded || rawTrack.track,
            info: {
                ...info,
                duration: info.duration ?? info.length ?? 0,
            },
        };
    }

    async searchTracksV3(player, attempt, requesterUser) {
        const cleanQuery = String(attempt?.query || "").trim();
        if (!cleanQuery) {
            return { loadType: "empty", tracks: [], exception: null, playlist: null, pluginInfo: {} };
        }

        const identifier = this.isUrl(cleanQuery)
            ? cleanQuery
            : `${attempt?.source ? `${attempt.source}:` : ""}${cleanQuery}`;

        const endpoint = `/loadtracks?identifier=${encodeURIComponent(identifier)}`;
        const raw = await player.node.request(endpoint);
        const loadType = this.mapV3LoadType(raw?.loadType);
        const rawTracks = Array.isArray(raw?.tracks) ? raw.tracks : [];
        const tracks = [];

        for (const rawTrack of rawTracks) {
            const normalizedTrack = this.normalizeV3Track(rawTrack);
            if (!normalizedTrack?.encoded) continue;
            try {
                tracks.push(this.manager.utils.buildTrack(normalizedTrack, requesterUser));
            } catch {
                // Ignore malformed tracks and keep processing the rest.
            }
        }

        const selectedTrackIndex =
            typeof raw?.playlistInfo?.selectedTrack === "number" ? raw.playlistInfo.selectedTrack : -1;

        const playlist = loadType === "playlist"
            ? {
                name: raw?.playlistInfo?.name || null,
                title: raw?.playlistInfo?.name || null,
                author: null,
                thumbnail: selectedTrackIndex >= 0 && tracks[selectedTrackIndex]
                    ? tracks[selectedTrackIndex].info?.artworkUrl || null
                    : null,
                uri: this.isUrl(cleanQuery) ? cleanQuery : null,
                selectedTrack: selectedTrackIndex >= 0 && tracks[selectedTrackIndex] ? tracks[selectedTrackIndex] : null,
                duration: tracks.reduce((acc, cur) => acc + (cur?.info?.duration || 0), 0),
            }
            : null;

        return {
            loadType,
            exception: raw?.exception || null,
            pluginInfo: raw?.pluginInfo || raw?.plugin || {},
            playlist,
            tracks,
        };
    }

    async searchTracks(player, query, requester) {
        const cleanQuery = String(query || "").trim();
        if (!cleanQuery) {
            throw new Error("Consulta vazia.");
        }

        const requesterUser = this.normalizeRequester(requester);
        const attempts = [];

        if (this.isUrl(cleanQuery)) {
            attempts.push({ query: cleanQuery });
        } else {
            attempts.push({ query: cleanQuery, source: "ytsearch" });
            attempts.push({ query: cleanQuery, source: "ytmsearch" });
            attempts.push({ query: cleanQuery, source: "scsearch" });
        }

        const apiVersion = this.normalizeApiVersion(player?.node?.options?.apiVersion, "v4");
        let lastError = null;

        for (const attempt of attempts) {
            if (apiVersion === "v3") {
                try {
                    const result = await this.searchTracksV3(player, attempt, requesterUser);
                    if (Array.isArray(result?.tracks) && result.tracks.length > 0) {
                        return result;
                    }
                    if (result?.exception?.message) {
                        lastError = new Error(result.exception.message);
                    }
                } catch (error) {
                    lastError = error;
                }
                continue;
            }

            try {
                const result = await player.search(attempt, requesterUser, false);
                if (Array.isArray(result?.tracks) && result.tracks.length > 0) {
                    return result;
                }
            } catch (error) {
                lastError = error;
            }
        }

        if (lastError) throw lastError;
        throw new Error("Nenhuma musica encontrada para a consulta informada.");
    }

    getTextChannelId(options) {
        if (!options) return null;
        if (options.textChannel?.id) return options.textChannel.id;
        if (options.channel?.id) return options.channel.id;
        if (options.message?.channel?.id) return options.message.channel.id;
        return null;
    }

    async ensureConnectedPlayer(voiceChannel, options = {}) {
        if (!this.manager?.initiated) {
            await this.connect();
        }

        const guildId = voiceChannel.guildId || voiceChannel.guild?.id;
        if (!guildId) {
            throw new Error("Guild invalida para criacao do player.");
        }

        const textChannelId = this.getTextChannelId(options);
        let player = this.getPlayer(guildId);
        const defaults = this.getGuildPlaybackDefaults(guildId);
        const defaultVolume = this.getSanitizedVolume(defaults.defaultvolume);
        let createdNow = false;

        if (!player) {
            player = this.manager.createPlayer({
                guildId,
                voiceChannelId: voiceChannel.id,
                textChannelId: textChannelId || undefined,
                volume: defaultVolume,
                selfDeaf: true,
                selfMute: false,
            });
            createdNow = true;
        }

        if (textChannelId) {
            player.textChannelId = textChannelId;
            player.options.textChannelId = textChannelId;
        }

        if (player.voiceChannelId !== voiceChannel.id) {
            await player.changeVoiceState({
                voiceChannelId: voiceChannel.id,
                selfDeaf: true,
                selfMute: false,
            });
        }

        const connectRequestedAt = Date.now();
        player.voice = {
            ...(player.voice || {}),
            sessionId: null,
            token: null,
            endpoint: null,
            channelId: voiceChannel.id,
        };
        await player.connect();

        const voiceReady = await this.waitForVoiceSession(guildId, 12000, connectRequestedAt);
        if (!voiceReady) {
            this.log("warn", "Handshake de voz pendente. Tentando reproduzir.");
        }

        if (createdNow) {
            this.autoplayState.set(guildId, Boolean(defaults.defaultautoplay));
            const filterSet = this.getFilterSet(guildId);
            filterSet.clear();
            for (const filterName of this.normalizeFilters(defaults.defaultfilters)) {
                if (filterName === "clear") continue;
                filterSet.add(filterName);
            }
            await this.applyFilterState(guildId);
        }

        return player;
    }

    waitForTrackStart(guildId, timeoutMs = 30000, startedAfter = Date.now()) {
        const lastStart = this.lastTrackStartAt.get(guildId) || 0;
        if (lastStart >= startedAfter) {
            const activePlayer = this.getPlayer(guildId);
            return Promise.resolve(activePlayer?.queue?.current || null);
        }

        return new Promise((resolve, reject) => {
            let settled = false;
            let timer = null;
            let poll = null;

            const cleanup = () => {
                if (timer) clearTimeout(timer);
                if (poll) clearInterval(poll);
                this.manager.off("trackStart", onStart);
                this.manager.off("trackError", onTrackError);
                this.manager.off("trackStuck", onTrackStuck);
                this.manager.off("playerSocketClosed", onSocketClosed);
            };

            const resolveOnce = (value) => {
                if (settled) return;
                settled = true;
                cleanup();
                resolve(value);
            };

            const rejectOnce = (error) => {
                if (settled) return;
                settled = true;
                cleanup();
                reject(error instanceof Error ? error : new Error(String(error)));
            };

            const checkPlayerState = () => {
                const player = this.getPlayer(guildId);
                if (!player) return;
                if (player.playing) {
                    resolveOnce(player.queue?.current || null);
                }
            };

            timer = setTimeout(async () => {
                try {
                    const player = this.getPlayer(guildId);
                    const voice = player?.voice || {};
                    const socketClosed = this.lastSocketClosedAt.get(guildId);
                    const stuck = this.lastTrackStuckAt.get(guildId);

                    if (
                        socketClosed?.payload &&
                        (socketClosed.at || 0) >= startedAfter &&
                        this.shouldRecoverSocketClose(socketClosed.payload)
                    ) {
                        const recovered = await this.recoverAfterSocketClosed(guildId, socketClosed.payload);
                        if (recovered) {
                            const recoveredPlayer = this.getPlayer(guildId);
                            resolveOnce(recoveredPlayer?.queue?.current || null);
                            return;
                        }
                    }

                    const voiceOk = Boolean(voice.sessionId && voice.token && voice.endpoint);
                    const details = [
                        `playing=${Boolean(player?.playing)}`,
                        `connected=${Boolean(player?.connected)}`,
                        `queue=${Array.isArray(player?.queue?.tracks) ? player.queue.tracks.length : 0}`,
                        `voice=${voiceOk}`,
                        socketClosed?.payload ? `socket=${this.shortPayload(socketClosed.payload)}` : null,
                        stuck?.payload ? `stuck=${this.shortPayload(stuck.payload)}` : null,
                    ].filter(Boolean).join(" ");
                    rejectOnce(new Error(`Lavalink nao iniciou a reproducao (${details}).`));
                } catch (error) {
                    rejectOnce(error);
                }
            }, timeoutMs);

            poll = setInterval(checkPlayerState, 250);

            const onStart = (player, track) => {
                if (player.guildId !== guildId) return;
                resolveOnce(track);
            };

            const onTrackError = (player, track, payload) => {
                if (player.guildId !== guildId) return;
                const exception = payload?.exception || payload || new Error("Falha ao iniciar a musica.");
                rejectOnce(exception);
            };

            const onTrackStuck = (player, track, payload) => {
                if (player.guildId !== guildId) return;
                const detail = this.shortPayload(payload);
                rejectOnce(new Error(`Track presa no Lavalink${detail ? ` (${detail})` : ""}.`));
            };

            const onSocketClosed = (player, payload) => {
                if (player.guildId !== guildId) return;
                if (this.shouldRecoverSocketClose(payload)) {
                    this.recoverAfterSocketClosed(guildId, payload)
                        .then((recovered) => {
                            if (recovered) {
                                const recoveredPlayer = this.getPlayer(guildId);
                                resolveOnce(recoveredPlayer?.queue?.current || null);
                                return;
                            }
                            const detail = this.shortPayload(payload);
                            rejectOnce(new Error(`Conexao de voz fechada pelo Lavalink/Discord${detail ? ` (${detail})` : ""}.`));
                        })
                        .catch((error) => rejectOnce(error));
                    return;
                }
                const detail = this.shortPayload(payload);
                rejectOnce(new Error(`Conexao de voz fechada pelo Lavalink/Discord${detail ? ` (${detail})` : ""}.`));
            };

            this.manager.on("trackStart", onStart);
            this.manager.on("trackError", onTrackError);
            this.manager.on("trackStuck", onTrackStuck);
            this.manager.on("playerSocketClosed", onSocketClosed);
        });
    }

    async play(voiceChannel, query, options = {}) {
        if (!voiceChannel?.id) {
            throw new Error("Canal de voz invalido.");
        }

        const requester = this.normalizeRequester(options.member || options.user || options.requester);
        const player = await this.ensureConnectedPlayer(voiceChannel, options);
        let voiceReady = await this.waitForVoiceSession(player.guildId, 8000);
        if (!voiceReady) {
            voiceReady = await this.refreshVoiceSession(player.guildId, 12000);
        }
        if (!voiceReady) {
            throw new Error("Conectei ao canal de voz, mas o Discord nao enviou a sessao de voz completa para iniciar a reproducao.");
        }
        const result = await this.searchTracks(player, query, requester);

        if (!Array.isArray(result?.tracks) || result.tracks.length === 0) {
            throw new Error("Nenhuma musica encontrada.");
        }

        const tracks = result.tracks.map((track) => {
            track.requester = requester;
            if (track.info) track.info.requester = requester;
            return track;
        });

        const hasCurrentTrack = Boolean(player.queue.current);
        const wasPlaying = Boolean(player.playing || hasCurrentTrack);
        const shouldInsertAtTop = Boolean(options.unshift || options.skip);

        if (shouldInsertAtTop) {
            await player.queue.add(tracks, 0);
        } else {
            await player.queue.add(tracks);
        }

        const shouldWaitForStart = !wasPlaying || Boolean(options.skip);
        const playbackRequestStartedAt = Date.now();

        await this.syncCachedVoiceToPlayer(player.guildId);

        if (options.skip && wasPlaying) {
            await player.skip();
        } else if (!wasPlaying || !player.playing) {
            await player.play();
        }

        if (shouldWaitForStart) {
            await this.waitForTrackStart(player.guildId, 30000, playbackRequestStartedAt);
        }

        return { player, tracks: result.tracks, result };
    }

    async skip(guildId) {
        const player = this.getPlayer(guildId);
        if (player) {
            await player.skip();
        }
    }

    async stop(guildId) {
        const player = this.getPlayer(guildId);
        if (player) {
            await player.destroy("Disconnected");
        }
    }

    async pause(guildId) {
        const player = this.getPlayer(guildId);
        if (player) {
            await player.pause();
        }
    }

    async resume(guildId) {
        const player = this.getPlayer(guildId);
        if (player) {
            await player.resume();
        }
    }

    async setVolume(guildId, volume) {
        const player = this.getPlayer(guildId);
        if (player) {
            await player.setVolume(Number(volume));
        }
    }

    async seek(guildId, positionInSeconds) {
        const player = this.getPlayer(guildId);
        if (player) {
            const positionMs = Math.max(0, Math.floor(Number(positionInSeconds) * 1000));
            await player.seek(positionMs);
        }
    }

    async shuffle(guildId) {
        const player = this.getPlayer(guildId);
        if (player) {
            await player.queue.shuffle();
        }
    }

    async setRepeatMode(guildId, mode) {
        const player = this.getPlayer(guildId);
        if (player) {
            await player.setRepeatMode(this.lavalinkRepeatMode(mode));
        }
    }

    getAutoplay(guildId) {
        return this.autoplayState.get(guildId) === true;
    }

    async toggleAutoplay(guildId) {
        const nextValue = !this.getAutoplay(guildId);
        this.autoplayState.set(guildId, nextValue);
        return nextValue;
    }

    getGuildPlaybackDefaults(guildId) {
        const fallback = {
            defaultvolume: 50,
            defaultautoplay: false,
            defaultfilters: [],
        };

        if (!this.client?.settings) return fallback;

        try {
            this.client.settings.ensure(guildId, fallback);
            const stored = this.client.settings.get(guildId) || {};
            return {
                defaultvolume: Number(stored.defaultvolume),
                defaultautoplay: Boolean(stored.defaultautoplay),
                defaultfilters: Array.isArray(stored.defaultfilters) ? stored.defaultfilters : fallback.defaultfilters,
            };
        } catch {
            return fallback;
        }
    }

    getSanitizedVolume(value) {
        const parsed = Number(value);
        if (!Number.isFinite(parsed)) return 50;
        return Math.max(1, Math.min(150, Math.round(parsed)));
    }

    getFilterSet(guildId) {
        if (!this.filterState.has(guildId)) {
            const seeded = new Set();
            try {
                const defaults = this.getGuildPlaybackDefaults(guildId).defaultfilters;
                for (const filterName of this.normalizeFilters(defaults)) {
                    if (filterName === "clear") continue;
                    seeded.add(filterName);
                }
            } catch {
                // ignore and fallback to empty set
            }
            this.filterState.set(guildId, seeded);
        }
        return this.filterState.get(guildId);
    }

    normalizeFilters(value) {
        const list = Array.isArray(value) ? value : [value];
        return list
            .flat(2)
            .filter(Boolean)
            .map((entry) => String(entry).trim().toLowerCase())
            .filter(Boolean);
    }

    getCustomFilterDefinition(filterName) {
        const key = String(filterName || "").trim().toLowerCase();
        if (!key) return "";
        const customFilters = this.client?.distube?.customFilters || {};
        const legacyFilters = this.client?.distube?.filters || {};
        const value = customFilters[key] ?? legacyFilters[key] ?? "";
        return String(value || "");
    }

    parseNumericInDefinition(definition, matcher) {
        const source = String(definition || "");
        const match = source.match(matcher);
        if (!match) return null;
        const value = Number(match[1]);
        return Number.isFinite(value) ? value : null;
    }

    getBassLevelFromFilter(filterName) {
        const name = String(filterName || "").toLowerCase();
        const numbered = name.match(/^bassboost(\d{1,2})$/);
        if (numbered) {
            const parsed = Number(numbered[1]);
            if (Number.isFinite(parsed)) return Math.max(0, Math.min(20, parsed));
        }

        if (name === "lightbass") return 8;
        if (name === "heavybass") return 20;
        if (name === "bassboost") return 15;
        if (name === "purebass") return 20;
        if (name === "subboost") return 10;
        if (name === "earrape") return 20;

        const fromDefinition = this.parseNumericInDefinition(
            this.getCustomFilterDefinition(name),
            /bass=g=([-+]?\d+(\.\d+)?)/i,
        );
        if (fromDefinition === null) return null;
        return Math.max(0, Math.min(20, fromDefinition));
    }

    getTrebleLevelFromFilter(filterName) {
        const name = String(filterName || "").toLowerCase();
        if (name === "treble") return 5;
        const fromDefinition = this.parseNumericInDefinition(
            this.getCustomFilterDefinition(name),
            /treble=g=([-+]?\d+(\.\d+)?)/i,
        );
        if (fromDefinition === null) return null;
        return Math.max(-20, Math.min(20, fromDefinition));
    }

    getSpeedLevelFromFilter(filterName) {
        const name = String(filterName || "").toLowerCase();
        if (name !== "customspeed") return null;
        const fromDefinition = this.parseNumericInDefinition(
            this.getCustomFilterDefinition(name),
            /atempo=([-+]?\d+(\.\d+)?)/i,
        );
        if (fromDefinition === null || fromDefinition <= 0) return null;
        return Math.max(0.25, Math.min(3, fromDefinition));
    }

    buildEqualizerFromFilters(activeFilters) {
        const bands = Array.from({ length: 15 }, (_, band) => ({ band, gain: 0 }));
        const clampGain = (value) => Math.max(-0.25, Math.min(1, value));
        const addGain = (band, gain) => {
            if (!Number.isInteger(band) || band < 0 || band > 14) return;
            bands[band].gain = clampGain(bands[band].gain + gain);
        };

        for (const filterName of activeFilters) {
            const bass = this.getBassLevelFromFilter(filterName);
            if (bass !== null) {
                const strength = Math.max(0, Math.min(1, bass / 20));
                addGain(0, 0.6 * strength);
                addGain(1, 0.5 * strength);
                addGain(2, 0.35 * strength);
                addGain(3, 0.18 * strength);
            }

            const treble = this.getTrebleLevelFromFilter(filterName);
            if (treble !== null) {
                const strength = treble / 20;
                addGain(10, 0.12 * strength);
                addGain(11, 0.2 * strength);
                addGain(12, 0.28 * strength);
                addGain(13, 0.3 * strength);
                addGain(14, 0.24 * strength);
            }
        }

        return bands.filter((entry) => Math.abs(entry.gain) >= 0.01);
    }

    async applyFilterState(guildId) {
        const player = this.getPlayer(guildId);
        if (!player?.filterManager) return;

        const activeFilters = [...this.getFilterSet(guildId)];
        const activeSet = new Set(activeFilters);
        const fm = player.filterManager;

        const safeApply = async (label, executor) => {
            try {
                await executor();
            } catch (error) {
                this.log("warn", `Falha ao aplicar filtro "${label}".`, error);
            }
        };

        await safeApply("reset", () => fm.resetFilters());

        if (activeSet.has("nightcore")) {
            await safeApply("nightcore", () => fm.toggleNightcore());
        }
        if (activeSet.has("vaporwave")) {
            await safeApply("vaporwave", () => fm.toggleVaporwave());
        }
        if (activeSet.has("karaoke")) {
            await safeApply("karaoke", () => fm.toggleKaraoke());
        }
        if (activeSet.has("vibrato")) {
            await safeApply("vibrato", () => fm.toggleVibrato());
        }
        if (activeSet.has("tremolo")) {
            await safeApply("tremolo", () => fm.toggleTremolo());
        }
        if (activeSet.has("8d") || activeSet.has("surrounding") || activeSet.has("pulsator")) {
            await safeApply("rotation", () => fm.toggleRotation());
        }

        if (!activeSet.has("nightcore") && !activeSet.has("vaporwave")) {
            const customSpeed = this.getSpeedLevelFromFilter("customspeed");
            if (customSpeed && customSpeed !== 1) {
                await safeApply("customspeed", () => fm.setSpeed(customSpeed));
            }
        }

        const equalizer = this.buildEqualizerFromFilters(activeFilters);
        if (equalizer.length > 0) {
            await safeApply("equalizer", () => fm.setEQ(equalizer));
        }

        if (activeSet.has("earrape")) {
            await safeApply("earrape", () => fm.setVolume(1.35));
        }
    }

    createFiltersFacade(player) {
        const guildId = player.guildId;
        const getNames = () => [...this.getFilterSet(guildId)];

        return {
            get names() {
                return getNames();
            },
            get collection() {
                return new Map(getNames().map((name) => [name, true]));
            },
            has: (name) => this.getFilterSet(guildId).has(String(name || "").toLowerCase()),
            set: async (filters) => {
                const set = this.getFilterSet(guildId);
                set.clear();
                for (const filterName of this.normalizeFilters(filters)) {
                    if (filterName === "clear") continue;
                    set.add(filterName);
                }
                await this.applyFilterState(guildId);
                return getNames();
            },
            add: async (filters) => {
                const normalized = this.normalizeFilters(filters);
                if (normalized.includes("clear")) {
                    this.getFilterSet(guildId).clear();
                    await this.applyFilterState(guildId);
                    return getNames();
                }
                const set = this.getFilterSet(guildId);
                for (const filterName of normalized) {
                    set.add(filterName);
                }
                await this.applyFilterState(guildId);
                return getNames();
            },
            remove: async (filters) => {
                const set = this.getFilterSet(guildId);
                for (const filterName of this.normalizeFilters(filters)) {
                    set.delete(filterName);
                }
                await this.applyFilterState(guildId);
                return getNames();
            },
            clear: async () => {
                this.getFilterSet(guildId).clear();
                await this.applyFilterState(guildId);
                return getNames();
            },
        };
    }

    trackToSong(track) {
        const info = track?.info || {};
        const requester = this.normalizeRequester(track?.requester || info?.requester || track?.userData?.requester);
        const durationSec = Number.isFinite(info.duration) ? Math.floor(info.duration / 1000) : 0;
        const stats = this.extractStatsFromTrack(track);

        return {
            name: info.title || "Sem titulo",
            url: info.uri || "",
            streamURL: info.uri || "",
            duration: durationSec,
            formattedDuration: this.formatDuration(durationSec),
            thumbnail: info.artworkUrl || info.thumbnail || (info.identifier ? `https://img.youtube.com/vi/${info.identifier}/mqdefault.jpg` : null),
            id: info.identifier || null,
            user: requester,
            requester,
            isStream: Boolean(info.isStream),
            views: stats.views ?? 0,
            likes: stats.likes ?? 0,
            dislikes: stats.dislikes ?? 0,
            __track: track,
        };
    }

    getSongs(player) {
        const tracks = [];
        if (player.queue.current) tracks.push(player.queue.current);
        if (Array.isArray(player.queue.tracks) && player.queue.tracks.length > 0) {
            tracks.push(...player.queue.tracks);
        }
        return tracks.map((track) => this.trackToSong(track));
    }

    getPreviousSongs(player) {
        if (!Array.isArray(player.queue.previous)) return [];
        return player.queue.previous.map((track) => this.trackToSong(track));
    }

    async removeFromQueue(player, index, amount = 1) {
        const start = Number(index);
        const total = Math.max(1, Number(amount) || 1);
        if (!Number.isFinite(start) || start <= 0) {
            throw new Error("Nao e possivel remover a musica atual (indice 0).");
        }

        const startTrackIndex = start - 1;
        if (startTrackIndex >= player.queue.tracks.length) return [];

        const indexes = [];
        for (let i = 0; i < total; i += 1) {
            const current = startTrackIndex + i;
            if (current < player.queue.tracks.length) {
                indexes.push(current);
            }
        }

        if (indexes.length === 0) return [];
        await player.queue.remove(indexes.length === 1 ? indexes[0] : indexes);
        return indexes;
    }

    async clearQueue(player) {
        if (!player.queue.tracks.length) return;
        await player.queue.splice(0, player.queue.tracks.length);
    }

    async moveQueueSong(player, fromIndex, toIndex) {
        const from = Number(fromIndex);
        const to = Number(toIndex);

        if (!Number.isFinite(from) || from <= 0) {
            throw new Error("Indice de origem invalido.");
        }
        if (!Number.isFinite(to) || to <= 0) {
            throw new Error("Indice de destino invalido.");
        }

        const sourceTrackIndex = from - 1;
        if (sourceTrackIndex >= player.queue.tracks.length) {
            throw new Error("A musica de origem nao existe na fila.");
        }

        const track = player.queue.tracks[sourceTrackIndex];
        await player.queue.splice(sourceTrackIndex, 1);

        const destinationTrackIndex = Math.min(Math.max(to - 1, 0), player.queue.tracks.length);
        await player.queue.splice(destinationTrackIndex, 0, track);
    }

    async jumpToSong(player, position) {
        const target = Number(position);
        if (!Number.isFinite(target) || target < 0) {
            throw new Error("Posicao invalida.");
        }

        if (target === 0) {
            await player.seek(0);
            return;
        }

        await player.skip(target);
    }

    async playPrevious(player) {
        const previousTrack = await player.queue.shiftPrevious();
        if (!previousTrack) {
            throw new Error("Nao ha musicas anteriores.");
        }

        if (player.queue.current) {
            await player.queue.splice(0, 0, player.queue.current);
        }

        await player.play({ clientTrack: previousTrack });
        await this.waitForTrackStart(player.guildId, 10000);
    }

    createQueueWrapper(player) {
        const wrapper = {
            stop: async () => this.stop(player.guildId),
            skip: async () => this.skip(player.guildId),
            pause: async () => this.pause(player.guildId),
            resume: async () => this.resume(player.guildId),
            setVolume: async (volume) => this.setVolume(player.guildId, volume),
            seek: async (position) => this.seek(player.guildId, position),
            shuffle: async () => this.shuffle(player.guildId),
            setRepeatMode: async (mode) => this.setRepeatMode(player.guildId, mode),
            toggleAutoplay: async () => this.toggleAutoplay(player.guildId),
            jump: async (position) => this.jumpToSong(player, position),
            previous: async () => this.playPrevious(player),
            clear: async () => this.clearQueue(player),
            move: async (fromIndex, toIndex) => this.moveQueueSong(player, fromIndex, toIndex),
            remove: async (index, amount = 1) => {
                if (typeof index === "undefined") {
                    return this.stop(player.guildId);
                }
                return this.removeFromQueue(player, index, amount);
            },
            addToQueue: async (song, position) => {
                const track = song?.__track;
                if (!track) return;
                const destination = Math.max(0, (Number(position) || 1) - 1);
                await player.queue.splice(destination, 0, track);
            },
        };

        Object.defineProperties(wrapper, {
            id: { enumerable: true, get: () => player.guildId },
            songs: { enumerable: true, get: () => this.getSongs(player) },
            previousSongs: { enumerable: true, get: () => this.getPreviousSongs(player) },
            volume: { enumerable: true, get: () => player.volume },
            repeatMode: { enumerable: true, get: () => this.legacyRepeatMode(player.repeatMode) },
            autoplay: {
                enumerable: true,
                get: () => this.getAutoplay(player.guildId),
                set: (value) => {
                    this.autoplayState.set(player.guildId, Boolean(value));
                    return true;
                },
            },
            playing: { enumerable: true, get: () => player.playing },
            paused: { enumerable: true, get: () => player.paused },
            stopped: { enumerable: true, get: () => false },
            currentTime: { enumerable: true, get: () => Math.floor((player.position || 0) / 1000) },
            formattedCurrentTime: {
                enumerable: true,
                get: () => this.formatDuration(Math.floor((player.position || 0) / 1000)),
            },
            formattedDuration: {
                enumerable: true,
                get: () => {
                    const totalMs = player.queue.utils.totalDuration();
                    return this.formatDuration(Math.floor(totalMs / 1000));
                },
            },
            voiceChannel: {
                enumerable: true,
                get: () => ({ id: player.voiceChannelId }),
            },
            textChannel: {
                enumerable: true,
                get: () => ({ id: player.textChannelId }),
            },
            filters: {
                enumerable: true,
                get: () => this.createFiltersFacade(player),
            },
        });

        return wrapper;
    }

    getQueue(guildId) {
        const player = this.getPlayer(guildId);
        if (!player) return null;
        return this.createQueueWrapper(player);
    }

    formatDuration(seconds) {
        if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (hours > 0) {
            return `${hours}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
        }

        return `${mins}:${String(secs).padStart(2, "0")}`;
    }

    get lavalink() {
        return this.manager;
    }
}

module.exports = LavalinkManagerWrapper;
