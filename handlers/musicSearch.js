const playDl = require("play-dl");
let Innertube;
try {
  ({ Innertube } = require("youtubei.js"));
} catch (_) {
  Innertube = null;
}

let ytClientPromise = null;
const getYoutubeClient = async () => {
  if (!Innertube) return null;
  if (!ytClientPromise) {
    ytClientPromise = Innertube.create().catch((err) => {
      ytClientPromise = null;
      throw err;
    });
  }
  return ytClientPromise;
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

const parseDuration = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const mapSearchItem = (item) => {
  const title = item?.title || item?.name || item?.video?.title || "";
  const url = item?.url || item?.video?.url || item?.video?.link || "";
  const author =
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

const mapYoutubeiItem = (item) => {
  const id = item?.id || item?.video_id || item?.videoId;
  const title = item?.title?.text || item?.title || "";
  const author = item?.author?.name || item?.author?.text || item?.author || "";
  const duration = parseDuration(item?.duration?.seconds || item?.duration?.seconds_text || item?.duration);
  const isLive = Boolean(item?.is_live || item?.isLive || item?.is_live_content);
  const url = id ? `https://www.youtube.com/watch?v=${id}` : "";
  return { title, url, author, duration, isLive };
};

const searchWithYoutubei = async (query, limit = 10) => {
  const yt = await getYoutubeClient();
  if (!yt) return [];
  const result = await yt.search(query, { type: "video" });
  const videos = result?.videos || result?.items || [];
  return videos.slice(0, limit).map(mapYoutubeiItem).filter((item) => item.url);
};

const searchWithPlayDl = async (query, limit = 10) => {
  let results = null;
  try {
    results = await playDl.search(query, { limit, source: { youtube: "video" } });
  } catch (_) {
    results = await playDl.search(query, { limit });
  }
  const items = Array.isArray(results) ? results : results?.items || [];
  return items.map(mapSearchItem).filter((item) => item.url);
};

const searchWithFallbacks = async (query, limit = 10) => {
  let lastError = null;
  try {
    const videos = await searchWithYoutubei(query, limit);
    if (videos.length) return videos;
  } catch (err) {
    lastError = err;
  }
  try {
    return await searchWithPlayDl(query, limit);
  } catch (err) {
    lastError = err;
  }
  if (lastError) throw lastError;
  return [];
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
      const items = await searchWithFallbacks(q, 10);
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
  const candidates = [query, normalized, `${query} musica`, `${query} oficial`, `${query} audio`].filter(
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
      videos = await searchWithFallbacks(q, 10);
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

    if (bestScore >= 0.35) break;
  }

  if (!best && artist) {
    try {
      const videos = await searchWithFallbacks(artist, 5);
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
  if (/music\.youtube(?:\.com)?/i.test(trimmed)) {
    return {
      unsupported: "youtube_music",
      message: "YouTube Music nao suportado. Tente usar um link do YouTube"
    };
  }
  if (isUrl(trimmed)) {
    try {
      const url = new URL(trimmed);
      const host = String(url.hostname || "").toLowerCase();
      if (host === "music.youtube.com" || host.endsWith(".music.youtube.com")) {
        return {
          unsupported: "youtube_music",
          message: "YouTube Music nao suportado. Tente usar um link do YouTube"
        };
      }
    } catch (_) {
      // ignore invalid URL parsing and fallback to normal behavior
    }
    return { url: trimmed, title: trimmed };
  }
  const best = await findFallbackTrack(trimmed);
  if (!best?.url) return null;
  return { url: best.url, title: best.title || trimmed, author: best.author || "" };
};

module.exports = {
  findFallbackTrack,
  findRelatedTracks,
  resolveQuery,
  isUrl,
  canonicalTrackTitle,
  isSameSongVariant
};
