const assert = require("node:assert/strict");
const { test } = require("node:test");
require("../handlers/discordCompat");
const { SPOTIFY_MIXES, YT_MIXES, selectYtMix } = require("../handlers/customMixes");
const mixCommand = require("../commands/Musica/mix");

test("mix selection maps category aliases to matching Spotify and YouTube playlists", () => {
  const selected = selectYtMix("  ROCK classics ");

  assert.equal(selected.spotify.key, "rock");
  assert.equal(selected.youtube.key, "rock");
  assert.ok(SPOTIFY_MIXES.includes(selected.spotify));
  assert.ok(YT_MIXES.includes(selected.youtube));
});

test("unknown mix names fall back to the default category", () => {
  const selected = selectYtMix("unknown-category");

  assert.equal(selected.spotify, SPOTIFY_MIXES[0]);
  assert.equal(selected.youtube, YT_MIXES[0]);
});

test("mix command falls back to the other provider when playback fails", async () => {
  const voiceChannel = {
    id: "voice-1",
    userLimit: 0,
    full: false,
    permissionsFor: () => ({ has: () => true }),
  };
  const textChannel = { id: "text-1" };
  const edits = [];
  const loadingMessage = { edit: async (payload) => edits.push(payload) };
  const message = {
    member: {
      guild: {
        members: { me: { voice: { channel: null } } },
        channels: { cache: new Map([[textChannel.id, textChannel]]) },
      },
      voice: { channel: voiceChannel },
    },
    guildId: "guild-1",
    channelId: textChannel.id,
    reply: async () => loadingMessage,
  };
  const playedLinks = [];
  const client = {
    allEmojis: { x: "x", loading: "loading" },
    user: { id: "bot-1" },
    settings: { get: () => "youtube" },
    distube: {
      getQueue: () => ({ songs: [] }),
      play: async (_channel, link, options) => {
        playedLinks.push({ link, options });
        if (playedLinks.length === 1) throw new Error("provider unavailable");
      },
    },
  };

  await mixCommand.run(client, message, ["rock"]);

  assert.equal(playedLinks.length, 2);
  assert.match(playedLinks[0].link, /youtube\.com/);
  assert.match(playedLinks[1].link, /^https:\/\/open\.spotify\.com\/playlist\//);
  assert.equal(playedLinks[1].options.member, message.member);
  assert.equal(playedLinks[1].options.textChannel, textChannel);
  assert.equal(edits.length, 2);
});
