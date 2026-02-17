const playDl = require("play-dl");

const axios = require("axios");

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const SEARCH_TIMEOUT_MS = Math.max(1000, toNumber(process.env.MUSIC_SEARCH_TIMEOUT_MS, 9000));
const SEARCH_LIMIT = Math.max(3, toNumber(process.env.MUSIC_SEARCH_LIMIT, 10));
const ARTIST_FALLBACK_LIMIT = Math.max(1, toNumber(process.env.MUSIC_SEARCH_ARTIST_LIMIT, 5));
const SCORE_EARLY_STOP = toNumber(process.env.MUSIC_SEARCH_SCORE_STOP, 0.35);
const DIRECT_QUERY_MODE = String(process.env.MUSIC_SEARCH_DIRECT_QUERY ?? "true").toLowerCase() !== "false";
const SEARCH_SUFFIXES = String(process.env.MUSIC_SEARCH_SUFFIXES || "musica,oficial,audio")
  .split(",")
  .map((entry) => entry.trim())
  .filter(Boolean);
const trimEnv = (value) => String(value ?? "").trim();
const SC_CLIENT_ID = trimEnv(process.env.SOUNDCLOUD_CLIENT_ID);
const SPOTIFY_CLIENT_ID = trimEnv(process.env.SPOTIFY_CLIENT_ID);
const SPOTIFY_CLIENT_SECRET = trimEnv(process.env.SPOTIFY_CLIENT_SECRET);
const SPOTIFY_MARKET = trimEnv(process.env.SPOTIFY_MARKET || "BR");
let currentSoundcloudClientId = "";
let spotifyAccessToken = "";
let spotifyAccessTokenExpiresAt = 0;
let spotifyTokenPromise = null;

let soundcloudAuthPromise = null;
const setSoundCloudClientId = async (clientId) => {
  const normalized = trimEnv(clientId);
  if (!normalized) return false;
  const payload = { soundcloud: { client_id: normalized } };
  await playDl.setToken(payload);
  currentSoundcloudClientId = normalized;
  return true;
};

const refreshSoundCloudClientId = async () => {
  const freeClientId = await withTimeout(playDl.getFreeClientID(), Math.min(SEARCH_TIMEOUT_MS, 7000));
  await setSoundCloudClientId(freeClientId);
  return freeClientId;
};

const ensureSoundCloudAuth = async () => {
  if (soundcloudAuthPromise) return soundcloudAuthPromise;

  soundcloudAuthPromise = (async () => {
    try {
      await refreshSoundCloudClientId();
    } catch (_) {
      try {
        if (SC_CLIENT_ID) {
          await setSoundCloudClientId(SC_CLIENT_ID);
          return;
        }
      } catch (_) {
        currentSoundcloudClientId = "";
      }
    }
  })();

  return soundcloudAuthPromise;
};

const hasSpotifyCredentials = () => Boolean(SPOTIFY_CLIENT_ID && SPOTIFY_CLIENT_SECRET);

const ensureSpotifyAccessToken = async () => {
  if (!hasSpotifyCredentials()) return "";
  const now = Date.now();
  if (spotifyAccessToken && now < spotifyAccessTokenExpiresAt - 30_000) return spotifyAccessToken;
  if (spotifyTokenPromise) return spotifyTokenPromise;

  spotifyTokenPromise = (async () => {
    try {
      const auth = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64");
      const response = await withTimeout(
        axios.post(
          "https://accounts.spotify.com/api/token",
          "grant_type=client_credentials",
          {
            headers: {
              Authorization: `Basic ${auth}`,
              "Content-Type": "application/x-www-form-urlencoded"
            }
          }
        ),
        Math.min(SEARCH_TIMEOUT_MS, 8000)
      );
      spotifyAccessToken = String(response?.data?.access_token || "");
      const expiresIn = Number(response?.data?.expires_in || 0);
      spotifyAccessTokenExpiresAt = Date.now() + Math.max(300, expiresIn) * 1000;
      return spotifyAccessToken;
    } catch (_) {
      spotifyAccessToken = "";
      spotifyAccessTokenExpiresAt = 0;
      return "";
    } finally {
      spotifyTokenPromise = null;
    }
  })();

  return spotifyTokenPromise;
};

const isSoundCloudUrl = (value) => /soundcloud\.com|api(?:-v2)?\.soundcloud\.com/i.test(String(value || ""));
const isSoundCloudPlaylistUrl = (value) => /soundcloud\.com\/[^/]+\/sets\//i.test(String(value || ""));
const isSoundCloudAuthError = (error) => {
  const text = String(error?.message || error || "");
  return (
    /status code\s*429/i.test(text) ||
    /status code\s*403/i.test(text) ||
    /status code\s*401/i.test(text) ||
    /reading 'client_id'/i.test(text)
  );
};

const getDirectSoundCloudStreamUrl = async (rawUrl) => {
  const url = String(rawUrl || "").trim();
  if (!url || !isSoundCloudUrl(url) || isSoundCloudPlaylistUrl(url)) return "";

  const extractStreamUrl = (stream) => String(stream?.url || "").trim();

  const streamFromTrackInfo = async (trackInfo) => {
    if (!trackInfo) return "";
    try {
      const fromInfo = await withTimeout(playDl.stream_from_info(trackInfo), Math.max(SEARCH_TIMEOUT_MS, 12000));
      const fromInfoUrl = extractStreamUrl(fromInfo);
      if (fromInfoUrl) return fromInfoUrl;
    } catch (_) {
      // continue below
    }
    const permalink = String(trackInfo?.permalink || trackInfo?.url || "").trim();
    if (!permalink || isSoundCloudPlaylistUrl(permalink)) return "";
    try {
      const fromPermalink = await withTimeout(playDl.stream(permalink), Math.max(SEARCH_TIMEOUT_MS, 12000));
      return extractStreamUrl(fromPermalink);
    } catch (_) {
      return "";
    }
  };

  const getStream = async () => {
    await ensureSoundCloudAuth().catch(() => {});
    try {
      const stream = await withTimeout(playDl.stream(url), Math.max(SEARCH_TIMEOUT_MS, 12000));
      const direct = extractStreamUrl(stream);
      if (direct) return direct;
    } catch (_) {
      // try resolving track info below
    }
    try {
      const info = await withTimeout(playDl.soundcloud(url), Math.max(SEARCH_TIMEOUT_MS, 12000));
      return await streamFromTrackInfo(info);
    } catch (_) {
      return "";
    }
  };

  try {
    return await getStream();
  } catch (error) {
    if (!isSoundCloudAuthError(error)) return "";
    try {
      await refreshSoundCloudClientId();
      return await getStream();
    } catch (_) {
      return "";
    }
  }
};

const normalizeQuery = (input) => {
  if (!input) return "";
  return String(input)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
};

const isUrl = (value) => /^https?:\/\//i.test(String(value || "").trim());
const isSpotifyUrl = (value) => /(?:open\.)?spotify\.com|spotify\.link/i.test(String(value || ""));

const getSpotifyContentType = (rawUrl) => {
  try {
    const parsed = new URL(String(rawUrl || "").trim());
    const host = parsed.hostname.replace(/^www\./i, "").toLowerCase();
    if (host === "spotify.link") return "short";
    if (!host.endsWith("spotify.com")) return "";
    const segments = parsed.pathname
      .split("/")
      .map((part) => part.trim().toLowerCase())
      .filter(Boolean);
    const known = new Set(["track", "album", "playlist", "episode", "show", "artist"]);
    return segments.find((segment) => known.has(segment)) || "";
  } catch {
    return "";
  }
};

const getSpotifyOembedTitle = async (spotifyUrl) => {
  try {
    const response = await withTimeout(
      axios.get("https://open.spotify.com/oembed", {
        params: { url: spotifyUrl },
      }),
      Math.min(SEARCH_TIMEOUT_MS, 7000)
    );
    return String(response?.data?.title || "").trim();
  } catch {
    return "";
  }
};

const isYoutubeUrl = (value) => {
  const trimmed = String(value || "").trim();
  if (!trimmed) return false;
  if (/music\.youtube(?:\.com)?/i.test(trimmed)) return true;
  if (/youtu\.be/i.test(trimmed)) return true;
  if (/youtube\.com/i.test(trimmed)) return true;
  return false;
};

const withTimeout = async (promise, ms = SEARCH_TIMEOUT_MS) => {
  let timeoutId;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error("SEARCH_TIMEOUT")), ms);
      }),
    ]);
  } finally {
    clearTimeout(timeoutId);
  }
};

const stripDecorators = (title) =>
  String(title || "")
    .replace(
      /\[[^\]]*(official|oficial|lyrics?|letra|lyric video|audio|video|mv|4k|hd|visuali[sz]er|karaoke|instrumental|nightcore|slowed|sped up|speed up|remix|edit|reverb|ao vivo|live|cover|fan made|legendado|traducao|tradu[cç][aã]o)[^\]]*]/gi,
      ""
    )
    .replace(
      /\([^\)]*(official|oficial|lyrics?|letra|lyric video|audio|video|mv|4k|hd|visuali[sz]er|karaoke|instrumental|nightcore|slowed|sped up|speed up|remix|edit|reverb|ao vivo|live|cover|fan made|legendado|traducao|tradu[cç][aã]o)[^\)]*\)/gi,
      ""
    )
    .replace(
      /\s*[-–—]\s*(official|oficial|lyrics?|letra|lyric video|audio|video|mv|4k|hd|visuali[sz]er|karaoke|instrumental|nightcore|slowed|sped up|speed up|remix|edit|reverb|ao vivo|live|cover|fan made|legendado|traducao|tradu[cç][aã]o).*/gi,
      ""
    )
    .replace(/\s+/g, " ")
    .trim();

const canonicalTrackTitle = (title) =>
  normalizeQuery(
    stripDecorators(title)
      .replace(/\s*(ft\.?|feat\.?|featuring)\s+.+$/i, "")
      .replace(/\s*(remaster(ed)?|version|versao)\s*\d*$/i, "")
  );

const tokenize = (value) =>
  normalizeQuery(value)
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length > 1);

const tokenOverlap = (left, right) => {
  const leftTokens = tokenize(canonicalTrackTitle(left));
  const rightTokens = tokenize(canonicalTrackTitle(right));
  if (!leftTokens.length || !rightTokens.length) return 0;
  const rightSet = new Set(rightTokens);
  let common = 0;
  for (const token of leftTokens) {
    if (rightSet.has(token)) common += 1;
  }
  return common / Math.max(1, Math.min(leftTokens.length, rightTokens.length));
};

const isSameSongVariant = (seedTitle, candidateTitle) => {
  const seed = canonicalTrackTitle(seedTitle);
  const candidate = canonicalTrackTitle(candidateTitle);
  if (!seed || !candidate) return false;
  if (seed === candidate) return true;
  if ((seed.includes(candidate) || candidate.includes(seed)) && Math.min(seed.length, candidate.length) >= 8) {
    return true;
  }
  const overlap = tokenOverlap(seed, candidate);
  const seedTokens = tokenize(seed);
  const candidateTokens = tokenize(candidate);
  return Math.min(seedTokens.length, candidateTokens.length) >= 2 && overlap >= 0.85;
};

const cleanArtistName = (value) =>
  String(value || "")
    .replace(/\s*-\s*topic$/i, "")
    .replace(/\b(official|oficial)\b/gi, "")
    .replace(/\bvevo\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

const extractArtist = (query) => {
  if (!query) return "";
  const separators = [" - ", "|", " / "];
  for (const sep of separators) {
    if (query.includes(sep)) return query.split(sep)[0].trim();
  }
  const byMatch = query.match(/(.+)\s+by\s+(.+)/i);
  if (byMatch && byMatch[2]) return byMatch[2].trim();
  return "";
};

const detectGenre = (input) => {
  const normalized = normalizeQuery(input);
  if (!normalized) return "";
  const knownGenres = [
    "sertanejo",
    "funk",
    "forro",
    "pagode",
    "samba",
    "gospel",
    "mpb",
    "rock",
    "pop",
    "rap",
    "trap",
    "phonk",
    "reggaeton",
    "hip hop",
    "r b",
    "electronic",
    "eletronica",
    "kpop"
  ];
  for (const genre of knownGenres) {
    if (normalized.includes(genre)) return genre;
  }
  return "";
};

const titlePenalty = (title) => {
  const value = String(title || "");
  let penalty = 0;
  if (/(visuali[sz]er|lyrics?|letra|lyric video|karaoke|cover|nightcore|sped up|slowed|instrumental|legendado|traducao|tradu[cç][aã]o)/i.test(value)) {
    penalty += 0.12;
  }
  if (/(ao vivo|live|remix|edit|reverb)/i.test(value)) {
    penalty += 0.08;
  }
  return penalty;
};

const scoreTitle = (query, title, author) => {
  const q = normalizeQuery(query);
  if (!q) return 0;
  const t = normalizeQuery(title);
  const a = normalizeQuery(author || "");
  const rawTitle = String(title || "");
  const rawQuery = String(query || "");
  const qCanonical = canonicalTrackTitle(query);
  const tCanonical = canonicalTrackTitle(title);
  const qTokens = new Set(q.split(" "));
  const tTokens = new Set(t.split(" "));
  let matches = 0;
  qTokens.forEach((token) => {
    if (tTokens.has(token)) matches += 1;
  });
  let score = matches / Math.max(1, qTokens.size);
  if (t.includes(q)) score += 0.2;
  if (a && a.includes(q)) score += 0.2;
  if (qCanonical && tCanonical) {
    if (tCanonical === qCanonical) score += 0.35;
    else if (tCanonical.startsWith(qCanonical) || tCanonical.endsWith(qCanonical)) score += 0.15;
    const qCanonicalTokens = tokenize(qCanonical);
    const tCanonicalTokens = tokenize(tCanonical);
    if (tCanonicalTokens.length - qCanonicalTokens.length >= 6) score -= 0.12;
  }
  const queryWantsEdit = /(speed up|sped up|slowed|nightcore|8d|bass boosted|remix)/i.test(rawQuery);
  if (!queryWantsEdit && /(speed up|sped up|slowed|nightcore|8d|bass boosted)/i.test(rawTitle)) score -= 0.55;
  if (!queryWantsEdit && /\b(remix|edit)\b/i.test(rawTitle)) score -= 0.2;
  if (/\|/.test(rawTitle)) score -= 0.08;
  if (/\bofficial audio\b|\baudio oficial\b/i.test(rawTitle)) score += 0.06;
  score -= titlePenalty(title);
  return score;
};

const pickBestMatch = (query, items = []) => {
  let best = null;
  let bestScore = -Infinity;
  for (const item of items) {
    const score = scoreTitle(query, item?.title || "", item?.author || "");
    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }
  return best;
};

const parseDuration = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const mapSearchItem = (item) => {
  const title = item?.title || item?.name || item?.video?.title || "";
  const url =
    item?.permalink ||
    item?.permalink_url ||
    item?.url ||
    item?.video?.url ||
    item?.video?.link ||
    "";
  const author =
    item?.user?.name ||
    item?.user?.username ||
    item?.channel?.name ||
    item?.author?.name ||
    item?.uploader ||
    item?.channel?.title ||
    item?.channel ||
    "";
  const duration =
    parseDuration(item?.durationInSec) ||
    parseDuration(item?.duration) ||
    parseDuration(item?.durationInSeconds) ||
    0;
  const isLive = Boolean(item?.live || item?.isLive);
  return { title, url, author, duration, isLive };
};

const mapSpotifyTrackItem = (item) => {
  const title = String(item?.name || "").trim();
  const artist = Array.isArray(item?.artists) ? item.artists.map((a) => a?.name).filter(Boolean).join(", ") : "";
  const url = String(item?.external_urls?.spotify || "").trim();
  const duration = Math.round(Number(item?.duration_ms || 0) / 1000);
  const popularity = Number(item?.popularity || 0);
  return {
    title,
    artist,
    author: artist,
    url,
    duration,
    popularity,
    searchQuery: `${title} ${artist}`.trim()
  };
};

const searchSpotifyTracks = async (query, limit = 6) => {
  const token = await ensureSpotifyAccessToken();
  if (!token) return [];
  try {
    const response = await withTimeout(
      axios.get("https://api.spotify.com/v1/search", {
        params: {
          q: query,
          type: "track",
          limit,
          market: SPOTIFY_MARKET || undefined
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      }),
      Math.min(SEARCH_TIMEOUT_MS, 8000)
    );
    const items = Array.isArray(response?.data?.tracks?.items) ? response.data.tracks.items : [];
    return items.map(mapSpotifyTrackItem).filter((item) => item.title && item.url);
  } catch (_) {
    return [];
  }
};

const pickBestSpotifyTrack = (query, items = []) => {
  let best = null;
  let bestScore = -Infinity;
  for (const item of items) {
    const score =
      scoreTitle(query, item?.title || "", item?.artist || "") +
      Math.min(0.12, Math.max(0, Number(item?.popularity || 0)) / 1000);
    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }
  return best;
};

const searchSoundCloudTracksOnly = async (query, limit = 10) => {
  await ensureSoundCloudAuth().catch(() => {});
  let results = null;

  const run = async () => withTimeout(playDl.search(query, { limit, source: { soundcloud: "tracks" } }));

  try {
    results = await run();
  } catch (error) {
    if (isSoundCloudAuthError(error)) {
      try {
        await refreshSoundCloudClientId();
        results = await run();
      } catch (_) {
        results = null;
      }
    }
  }

  const items = Array.isArray(results) ? results : results?.items || [];
  return items.map(mapSearchItem).filter((item) => item.url && isSoundCloudUrl(item.url));
};

const searchWithPlayDl = async (query, limit = 10) => {
  await ensureSoundCloudAuth().catch(() => {});

  let results = null;
  try {
    results = await withTimeout(playDl.search(query, { limit, source: { soundcloud: "tracks" } }));
  } catch (error) {
    if (isSoundCloudAuthError(error)) {
      try {
        await refreshSoundCloudClientId();
        results = await withTimeout(playDl.search(query, { limit, source: { soundcloud: "tracks" } }));
      } catch (_) {
        results = null;
      }
    } else {
      results = null;
    }
  }
  if (!results || (Array.isArray(results) && results.length === 0)) {
    try {
      results = await withTimeout(playDl.search(query, { limit, source: { soundcloud: "tracks" } }));
    } catch (_) {
      results = null;
    }
  }
  if (!results || (Array.isArray(results) && results.length === 0)) {
    try {
      results = await withTimeout(playDl.search(query, { limit, source: { soundcloud: "playlists" } }));
    } catch (_) {
      results = null;
    }
  }
  if (!results || (Array.isArray(results) && results.length === 0)) {
    try {
      results = await withTimeout(playDl.search(query, { limit }));
    } catch (_) {
      results = null;
    }
  }
  const items = Array.isArray(results) ? results : results?.items || [];
  return items
    .map(mapSearchItem)
    .filter((item) => item.url && !isYoutubeUrl(item.url) && !isSpotifyUrl(item.url));
};

const searchWithFallbacks = async (query, limit = 10) => {
  return await searchWithPlayDl(query, limit);
};

const isLongFormQuery = (query) => /mix|set|live|ao vivo|show|festival|hour|1h|2h|dj|extended/i.test(query);
const maxDurationForQuery = (query) => (isLongFormQuery(query) ? 7200 : 1200);
const looksLiveRecording = (title) =>
  /\bao vivo\b|\blive at\b|\blive in\b|\blive from\b|\blive version\b/i.test(String(title || ""));

const uniqueBy = (arr, keyFn) => {
  const seen = new Set();
  const out = [];
  for (const item of arr) {
    const key = keyFn(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
};

const normalizeSeedInput = (seedInput) => {
  if (seedInput && typeof seedInput === "object" && !Array.isArray(seedInput)) {
    const query = String(seedInput.query || seedInput.title || "").trim();
    const title = String(seedInput.title || query).trim();
    const artistCandidate = seedInput.artist || extractArtist(query) || extractArtist(title) || "";
    return {
      query,
      title,
      artist: cleanArtistName(artistCandidate),
      genre: String(seedInput.genre || "").trim(),
      duration: Number(seedInput.duration) || 0
    };
  }

  const query = String(seedInput || "").trim();
  return {
    query,
    title: query,
    artist: cleanArtistName(extractArtist(query)),
    genre: "",
    duration: 0
  };
};

const buildRelatedQueries = (seed) => {
  const base = String(seed.query || seed.title || "").trim();
  const seedTitle = stripDecorators(seed.title || base);
  const artist = cleanArtistName(seed.artist || extractArtist(seedTitle) || extractArtist(base));
  const genre = seed.genre || detectGenre(base) || detectGenre(seedTitle);

  const queries = [
    artist ? `${artist} top songs` : "",
    artist ? `${artist} melhores musicas` : "",
    artist ? `${artist} official audio` : "",
    artist && genre ? `${artist} ${genre}` : "",
    genre ? `${genre} hits` : "",
    base ? `${base} radio` : "",
    base ? `${base} similares` : "",
    base ? `${base} similar songs` : "",
    artist ? `${artist} musica` : ""
  ].filter((q, index, self) => q && self.indexOf(q) === index);

  return { queries, artist, seedTitle };
};

const scoreRelatedCandidate = (video, seed) => {
  const title = video?.title || "";
  const author = cleanArtistName(video?.author || "");
  const seedTitle = seed.seedTitle || seed.title || seed.query || "";
  const seedArtist = cleanArtistName(seed.artist || "");
  const seedDuration = Number(seed.duration) || 0;

  if (isSameSongVariant(seedTitle, title)) return -2;

  let score = 0;
  const normAuthor = normalizeQuery(author);
  const normTitle = normalizeQuery(title);
  const normSeedArtist = normalizeQuery(seedArtist);

  if (normSeedArtist && normAuthor.includes(normSeedArtist)) score += 1.2;
  else if (normSeedArtist && normTitle.includes(normSeedArtist)) score += 0.5;

  score += tokenOverlap(seedTitle, title) * 0.4;

  if (seedDuration > 0 && Number(video.duration) > 0) {
    const delta = Math.abs(Number(video.duration) - seedDuration);
    if (delta <= 45) score += 0.15;
    if (delta > 420) score -= 0.2;
  }

  if (/(karaoke|instrumental|nightcore|slowed|sped up|8d|bass boosted|cover)/i.test(title)) {
    score -= 0.35;
  }
  if (/(ao vivo|live|remix|edit|reverb)/i.test(title)) {
    score -= 0.15;
  }

  score -= Math.min(0.2, titlePenalty(title));
  return score;
};

const findRelatedTracks = async (
  seedInput,
  { limit = 12, excludeUrls = [], excludeTitles = [] } = {}
) => {
  const seed = normalizeSeedInput(seedInput);
  const { queries, artist, seedTitle } = buildRelatedQueries(seed);
  const maxDuration = maxDurationForQuery(seed.query || seed.title || "");
  const allowLiveByQuery = isLongFormQuery(seed.query || seed.title || "");

  const excludedUrlSet = new Set((excludeUrls || []).filter(Boolean));
  const excludedTitleSet = new Set((excludeTitles || []).map((title) => canonicalTrackTitle(title)).filter(Boolean));
  const seedTitleKey = canonicalTrackTitle(seedTitle || seed.title || seed.query);
  if (seedTitleKey) excludedTitleSet.add(seedTitleKey);

  let results = [];
  let loggedError = false;
  for (const q of queries) {
    try {
      const items = await searchWithFallbacks(q, SEARCH_LIMIT);
      results.push(...items);
    } catch (err) {
      if (!loggedError) {
        console.warn(`[musicSearch] related search error: ${err?.message || err}`);
        loggedError = true;
      }
    }
  }

  const filtered = results.filter((video) => {
    if (!video?.url) return false;
    if (excludedUrlSet.has(video.url)) return false;
    if (video.isLive) return false;
    if (!allowLiveByQuery && looksLiveRecording(video.title)) return false;
    if (video.duration && video.duration > maxDuration) return false;
    const key = canonicalTrackTitle(video.title);
    if (key && excludedTitleSet.has(key)) return false;
    if (isSameSongVariant(seedTitle || seed.title || seed.query, video.title)) return false;
    return true;
  });

  const unique = uniqueBy(filtered, (video) => {
    const titleKey = canonicalTrackTitle(video.title);
    const artistKey = normalizeQuery(cleanArtistName(video.author || ""));
    if (titleKey || artistKey) return `${titleKey}::${artistKey}`;
    return video.url || video.title;
  });

  const scored = unique
    .map((video) => ({ video, score: scoreRelatedCandidate(video, { ...seed, artist, seedTitle }) }))
    .filter((entry) => entry.score > -0.25);

  if (!scored.length) {
    return unique.sort(() => Math.random() - 0.5).slice(0, Math.max(0, limit));
  }

  scored.sort((left, right) => {
    const delta = right.score - left.score;
    if (Math.abs(delta) > 0.01) return delta;
    return Math.random() - 0.5;
  });

  return scored.slice(0, Math.max(0, limit)).map((entry) => entry.video);
};

const findFallbackTrack = async (query) => {
  const normalized = normalizeQuery(query);
  const artist = extractArtist(query);
  const candidates = [query, normalized, ...SEARCH_SUFFIXES.map((suffix) => `${query} ${suffix}`)].filter(
    (value, index, self) => value && self.indexOf(value) === index
  );

  let best = null;
  let bestScore = 0;
  const maxDuration = maxDurationForQuery(query);
  const allowLiveByQuery = isLongFormQuery(query);
  let loggedError = false;

  for (const q of candidates) {
    let videos = [];
    try {
      videos = await searchWithFallbacks(q, SEARCH_LIMIT);
    } catch (err) {
      if (!loggedError) {
        console.warn(`[musicSearch] search error: ${err?.message || err}`);
        loggedError = true;
      }
      videos = [];
    }

    const filtered = videos.filter((video) => {
      if (video.isLive) return false;
      if (!allowLiveByQuery && looksLiveRecording(video.title)) return false;
      if (video.duration && video.duration > maxDuration) return false;
      return true;
    });

    const pool = filtered.length ? filtered : videos;
    for (const video of pool) {
      const author = video.author || "";
      let score = scoreTitle(query, video.title, author);
      if (artist && normalizeQuery(author).includes(normalizeQuery(artist))) score += 0.2;
      if (score > bestScore) {
        bestScore = score;
        best = video;
      }
    }

    if (bestScore >= SCORE_EARLY_STOP) break;
  }

  if (!best && artist) {
    try {
      const videos = await searchWithFallbacks(artist, ARTIST_FALLBACK_LIMIT);
      const filtered = videos.filter((video) => !video.isLive && (!video.duration || video.duration <= maxDuration));
      best = filtered[0] || videos[0] || null;
    } catch (err) {
      if (!loggedError) {
        console.warn(`[musicSearch] search error: ${err?.message || err}`);
        loggedError = true;
      }
      best = null;
    }
  }

  return best;
};

const resolveQuery = async (query) => {
  const trimmed = String(query || "").trim();
  if (!trimmed) return null;
  if (isYoutubeUrl(trimmed)) {
    return {
      unsupported: "youtube",
      message: "YouTube nao suportado. Use Spotify, SoundCloud ou outro link compativel."
    };
  }
  if (isUrl(trimmed)) {
    if (isSpotifyUrl(trimmed)) {
      const spotifyType = getSpotifyContentType(trimmed);
      if (spotifyType === "track" || spotifyType === "short") {
        const spotifyTitle = await getSpotifyOembedTitle(trimmed);
        const fallbackQuery = spotifyTitle || trimmed;
        try {
          const soundcloudMatches = await searchSoundCloudTracksOnly(fallbackQuery, Math.min(SEARCH_LIMIT, 8));
          const fallback =
            pickBestMatch(fallbackQuery, soundcloudMatches) ||
            pickBestMatch(spotifyTitle || trimmed, soundcloudMatches) ||
            soundcloudMatches[0];
          if (fallback?.url) {
            return {
              url: fallback.url,
              title: fallback.title || spotifyTitle || fallbackQuery,
              author: fallback.author || ""
            };
          }
        } catch (_) {
          // keep default behavior below
        }
      }
    }
    return { url: trimmed, title: trimmed };
  }

  try {
    const spotifyTracks = await searchSpotifyTracks(trimmed, Math.min(SEARCH_LIMIT, 8));
    const bestSpotify = pickBestSpotifyTrack(trimmed, spotifyTracks) || spotifyTracks[0];
    if (bestSpotify?.searchQuery) {
      const soundcloudMatches = await searchSoundCloudTracksOnly(bestSpotify.searchQuery, Math.min(SEARCH_LIMIT, 8));
      const bestSoundCloud =
        pickBestMatch(bestSpotify.searchQuery, soundcloudMatches) ||
        pickBestMatch(trimmed, soundcloudMatches) ||
        soundcloudMatches[0];
      if (bestSoundCloud?.url) {
        return {
          url: bestSoundCloud.url,
          title: bestSoundCloud.title || bestSpotify.title || trimmed,
          author: bestSoundCloud.author || bestSpotify.artist || ""
        };
      }
    }
  } catch (_) {
    // fallback below
  }

  try {
    const quickResults = await searchWithPlayDl(trimmed, Math.min(SEARCH_LIMIT, 6));
    const bestQuick = pickBestMatch(trimmed, quickResults) || quickResults[0];
    if (bestQuick?.url) {
      return {
        url: bestQuick.url,
        title: bestQuick.title || trimmed,
        author: bestQuick.author || ""
      };
    }
  } catch (_) {
    // fallback below
  }

  const best = await findFallbackTrack(trimmed);
  if (best?.url) {
    return { url: best.url, title: best.title || trimmed, author: best.author || "" };
  }

  if (DIRECT_QUERY_MODE) {
    // Fallback final: deixa o DisTube/SoundCloudPlugin resolver a busca textual.
    return { url: trimmed, title: trimmed };
  }

  return null;
};

module.exports = {
  findFallbackTrack,
  findRelatedTracks,
  resolveQuery,
  getDirectSoundCloudStreamUrl,
  isSoundCloudUrl,
  isUrl,
  canonicalTrackTitle,
  isSameSongVariant
};
