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
