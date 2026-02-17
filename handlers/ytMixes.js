const YT_MIXES = Object.freeze([
  {
    key: "default",
    label: "Top Hits",
    aliases: ["default", "d", "top"],
    url: "https://open.spotify.com/playlist/0md0lRijhWGpfAo5VnUrWn?si=Lv2HoPyWQGurZn9f93EtWA"
  },
  {
    key: "ncs",
    label: "Eletronica",
    aliases: ["ncs", "n", "edm"],
    url: "https://open.spotify.com/playlist/6gJj32s2qLIYTnAJwjBSrF?si=x_FYjb5LRR-cz0gC3YYHfg"
  },
  {
    key: "pop",
    label: "Pop",
    aliases: ["pop", "p"],
    url: "https://open.spotify.com/playlist/37i9dQZF1DX6aTaZa0K6VA?si=q64IaP5vQ1-17iz-wMbjvQ"
  },
  {
    key: "rock",
    label: "Rock",
    aliases: ["rock", "ro"],
    url: "https://open.spotify.com/playlist/5gA47nvZB06cll2KXPAEGY?si=gz2Q93x7RfamOAnwL8bunQ"
  },
  {
    key: "remix",
    label: "Remix",
    aliases: ["remix", "re", "dance"],
    url: "https://open.spotify.com/playlist/7mzOaHuq4kJzlOSsXN73kH?si=A07dgsonQOi3H3STDaVTEw"
  }
]);

const normalize = (value) => String(value || "").trim().toLowerCase();

const uniqueAliases = (mix) => {
  const set = new Set((mix.aliases || []).map(normalize).filter(Boolean));
  return [...set];
};

const selectYtMix = (input) => {
  const query = normalize(input);
  if (!query) return YT_MIXES[0];

  for (const mix of YT_MIXES) {
    const aliases = uniqueAliases(mix).sort((a, b) => b.length - a.length);
    if (aliases.some((alias) => query.startsWith(alias))) return mix;
  }
  return YT_MIXES[0];
};

const getMixKeys = () => YT_MIXES.map((mix) => mix.key);

const getMixUsage = () => `mix [${getMixKeys().join("|")}]`;

const getMixDescription = () =>
  "Toca uma mixagem do Spotify por categoria. Use help para ver todas as playlists disponiveis.";

const getMixHelpDetails = () =>
  [
    "Playlists disponiveis:",
    ...YT_MIXES.map((mix) => {
      const aliases = uniqueAliases(mix).join("/");
      return `- \`${mix.key}\` (${aliases})`;
    })
  ].join("\n");

module.exports = {
  YT_MIXES,
  selectYtMix,
  getMixUsage,
  getMixDescription,
  getMixHelpDetails
};
