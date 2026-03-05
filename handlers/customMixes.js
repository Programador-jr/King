const SPOTIFY_MIXES = Object.freeze([
  {
    key: "default",
    label: "Predefinido",
    aliases: ["default", "d"],
    url: "https://open.spotify.com/playlist/0md0lRijhWGpfAo5VnUrWn?si=b235htwaSB6k3_WLmEoCWA"
  },
  {
    key: "ncs",
    label: "NCS",
    aliases: ["ncs", "n"],
    url: "https://open.spotify.com/playlist/2NdDBIGHUCu977yW5iKWQY?si=YjT_LNxbRPKIu7aaoNQN8g"
  },
  {
    key: "pop",
    label: "Pop",
    aliases: ["pop", "p"],
    url: "https://open.spotify.com/playlist/008G1BbvK1NQvbAV8MHvDz?si=hysVz_SOT_iUZG89IwPjBQ"
  },
  {
    key: "rock",
    label: "Rock",
    aliases: ["rock", "ro"],
    url: "https://open.spotify.com/playlist/0ULGzMMIi6wWzPuSfZK5Y9?si=MnuKIUb_Sl2HLuUvXj_AFQ"
  },
  {
    key: "metal",
    label: "Metal",
    aliases: ["metal", "me", "h"],
    url: "https://open.spotify.com/playlist/37i9dQZF1DWWOaP4H0w5b0?si=nFxCO4dLSb22rjqgLHlE6A"
  },
  {
    key: "remix",
    label: "Remix",
    aliases: ["remix", "re"],
    url: "https://open.spotify.com/playlist/2h9UT9SQZoC58sQ5KvTFdX?si=bb2BWubMS9OJgm1BJTbtcw"
  }
]);

const YT_MIXES = Object.freeze([
  {
    key: "default",
    label: "Predefinido",
    aliases: ["default", "d"],
    url: "https://youtube.com/playlist?list=PLE7g3JKEFhIn1RlWdj0orT4Qxw04RjP0S&si=Pmx_bfoQ4bWCornY"
  },
  {
    key: "ncs",
    label: "NCS",
    aliases: ["ncs", "n"],
    url: "https://youtube.com/playlist?list=PLRBp0Fe2Gpgn8Y9qI-p0aTxVtw8onBSFj&si=j5gEAirDTJ5l-Mwm"
  },
  {
    key: "pop",
    label: "Pop",
    aliases: ["pop", "p"],
    url: "https://www.youtube.com/playlist?list=PLMC9KNkIncKvYin_USF1qoJQnIyMAfRxl"
  },
  {
    key: "rock",
    label: "Rock",
    aliases: ["rock", "ro"],
    url: "https://youtube.com/playlist?list=PLE7g3JKEFhIl75b_mrrPViDeQPZp-KyOi&si=Nez7taomLkhzqWBP"
  },
  {
    key: "metal",
    label: "Metal",
    aliases: ["metal", "me", "h"],
    url: "https://youtube.com/playlist?list=PLhQCJTkrHOwSX8LUnIMgaTq3chP1tiTut&si=4DbyZXTqntWeLRRo"
  },
  {
    key: "remix",
    label: "Remix",
    aliases: ["remix", "re"],
    url: "https://youtube.com/playlist?list=PLE7g3JKEFhIlzfqqaSWg6MMzKHQUl9w4N&si=mwS7CFXDwF5w8-fM"
  }
]);

const normalize = (value) => String(value || "").trim().toLowerCase();

const uniqueAliases = (mix) => {
  const set = new Set((mix.aliases || []).map(normalize).filter(Boolean));
  return [...set];
};

const selectYtMix = (input) => {
  const query = normalize(input);
  if (!query) return { spotify: SPOTIFY_MIXES[0], youtube: YT_MIXES[0] };

  for (const mix of SPOTIFY_MIXES) {
    const aliases = uniqueAliases(mix).sort((a, b) => b.length - a.length);
    if (aliases.some((alias) => query.startsWith(alias))) {
      const ytMix = YT_MIXES.find(y => y.key === mix.key) || YT_MIXES[0];
      return { spotify: mix, youtube: ytMix };
    }
  }
  return { spotify: SPOTIFY_MIXES[0], youtube: YT_MIXES[0] };
};

const getMixKeys = () => SPOTIFY_MIXES.map((mix) => mix.key);

const getMixUsage = () => `mix [${getMixKeys().join("|")}]`;

const getMixDescription = () =>
  "Toca uma mixagem por categoria. Tenta Spotify primeiro, se falhar usa YouTube.";

const getMixHelpDetails = () =>
  [
    "Playlists disponíveis:",
    ...SPOTIFY_MIXES.map((mix) => {
      const aliases = uniqueAliases(mix).join("/");
      return `- \`${mix.key}\` (${aliases})`;
    })
  ].join("\n");

module.exports = {
  SPOTIFY_MIXES,
  YT_MIXES,
  selectYtMix,
  getMixUsage,
  getMixDescription,
  getMixHelpDetails
};
