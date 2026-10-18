const assert = require("node:assert/strict");
const { test } = require("node:test");
const LavalinkManagerWrapper = require("../handlers/lavalinkClient");
const filters = require("../botconfig/filters.json");
const { EventEmitter } = require("node:events");

test("searchTracks normalizes a legacy query object instead of searching for [object Object]", async () => {
    const wrapper = new LavalinkManagerWrapper({
        user: { id: "bot-id", username: "King" },
    });
    const attempts = [];
    wrapper.ensureWorkingNode = async () => ({ options: { apiVersion: "v4" } });

    const player = {
        search: async (attempt) => {
            attempts.push(attempt);
            return {
                loadType: "search",
                tracks: [{ encoded: "encoded-track", info: { title: "Test track" } }],
            };
        },
    };

    const result = await wrapper.searchTracks(player, { query: "test track" }, { id: "requester-id", username: "Requester" });

    assert.equal(result.tracks.length, 1);
    assert.deepEqual(attempts[0], { query: "test track", source: "ytsearch" });
    assert.ok(attempts.every((attempt) => !String(attempt.query).includes("[object Object]")));
});

test("ensureConnectedPlayer preserves a valid voice session when adding another track", async () => {
    const wrapper = new LavalinkManagerWrapper({
        user: { id: "bot-id", username: "King" },
    });
    const voice = {
        sessionId: "voice-session",
        token: "voice-token",
        endpoint: "voice.example.invalid",
        channelId: "voice-channel",
    };
    let connectCalls = 0;
    let voiceChangeCalls = 0;
    const player = {
        guildId: "guild-id",
        voiceChannelId: "voice-channel",
        connected: true,
        voice: { ...voice },
        textChannelId: "old-text-channel",
        options: {},
        connect: async () => { connectCalls += 1; },
        changeVoiceState: async () => { voiceChangeCalls += 1; },
    };

    wrapper.manager = { initiated: true };
    wrapper.getPlayer = () => player;
    wrapper.getGuildPlaybackDefaults = () => ({
        defaultvolume: 50,
        defaultautoplay: false,
        defaultfilters: [],
    });
    wrapper.waitForVoiceSession = async () => {
        throw new Error("Should not wait for a new voice handshake for a valid session.");
    };
    wrapper.applyFilterState = async () => {};

    const result = await wrapper.ensureConnectedPlayer(
        { id: "voice-channel", guildId: "guild-id" },
        { textChannel: { id: "new-text-channel" } },
    );

    assert.equal(result, player);
    assert.equal(connectCalls, 0);
    assert.equal(voiceChangeCalls, 0);
    assert.deepEqual(player.voice, voice);
    assert.equal(player.textChannelId, "new-text-channel");
    assert.equal(player.options.textChannelId, "new-text-channel");
});

test("the default custom-speed filter is neutral and does not accelerate playback", () => {
    const wrapper = new LavalinkManagerWrapper({
        user: { id: "bot-id", username: "King" },
        distube: { customFilters: filters, filters: {} },
    });

    assert.equal(wrapper.getSpeedLevelFromFilter("customspeed"), 1);
});


test("waitForTrackStart does not mistake a stale playing flag for a newly started track", async () => {
    const wrapper = new LavalinkManagerWrapper({
        user: { id: "bot-id", username: "King" },
    });
    wrapper.manager = new EventEmitter();
    wrapper.getPlayer = () => ({
        guildId: "guild-id",
        playing: true,
        connected: true,
        voice: {
            sessionId: "voice-session",
            token: "voice-token",
            endpoint: "voice.example.invalid",
        },
        queue: {
            current: { encoded: "previous-track" },
            tracks: [],
        },
    });

    await assert.rejects(
        wrapper.waitForTrackStart("guild-id", 25, Date.now()),
        /Lavalink nao iniciou a reproducao/
    );
});

test("refreshVoiceSession forces a leave/join and only accepts fresh voice packets", async () => {
    const wrapper = new LavalinkManagerWrapper({
        user: { id: "bot-id", username: "King" },
    });
    const calls = [];
    const player = {
        guildId: "guild-id",
        voiceChannelId: "voice-channel",
        options: { voiceChannelId: "voice-channel" },
        voice: {
            sessionId: "stale-session",
            token: "stale-token",
            endpoint: "stale.example.invalid",
            channelId: "voice-channel",
        },
        disconnect: async (force) => {
            calls.push(["disconnect", force]);
            player.voiceChannelId = null;
        },
        connect: async () => {
            calls.push(["connect"]);
            player.voiceChannelId = player.options.voiceChannelId;
        },
    };

    wrapper.getPlayer = () => player;
    wrapper.waitForVoiceSession = async (_guildId, _timeoutMs, minFreshAt) => {
        assert.ok(minFreshAt > 0);
        assert.equal(wrapper.voiceStateCache.has("guild-id"), false);
        assert.equal(wrapper.voiceServerCache.has("guild-id"), false);
        const at = Date.now();
        wrapper.voiceStateCache.set("guild-id", {
            sessionId: "fresh-session",
            channelId: "voice-channel",
            guildId: "guild-id",
            at,
        });
        wrapper.voiceServerCache.set("guild-id", {
            token: "fresh-token",
            endpoint: "voice.example.invalid",
            guildId: "guild-id",
            at,
        });
        player.voice = {
            sessionId: "fresh-session",
            token: "fresh-token",
            endpoint: "voice.example.invalid",
            channelId: "voice-channel",
        };
        return true;
    };
    wrapper.syncCachedVoiceToPlayer = async () => true;

    assert.equal(await wrapper.refreshVoiceSession("guild-id", 100), true);
    assert.deepEqual(calls, [["disconnect", true], ["connect"]]);
    assert.equal(player.voice.sessionId, "fresh-session");
});

test("getVoiceSessionDiagnostics identifies missing voice updates without exposing credentials", () => {
    const wrapper = new LavalinkManagerWrapper({
        user: { id: "bot-id", username: "King" },
    });
    wrapper.manager = { initiated: true };
    wrapper.getPlayer = () => ({
        guildId: "guild-id",
        voiceChannelId: "voice-channel",
        options: { voiceChannelId: "voice-channel" },
        voice: {},
    });
    wrapper.voiceStateCache.set("guild-id", {
        sessionId: "session-secret",
        channelId: "voice-channel",
        at: Date.now(),
    });
    wrapper.voiceServerCache.set("guild-id", {
        token: "token-secret",
        endpoint: null,
        at: Date.now(),
    });

    const details = wrapper.getVoiceSessionDiagnostics("guild-id");

    assert.match(details, /state=complete/);
    assert.match(details, /server=missing/);
    assert.match(details, /channelMatch=true/);
    assert.equal(details.includes("session-secret"), false);
    assert.equal(details.includes("token-secret"), false);
});

