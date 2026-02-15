const axios = require("axios");

const REQUEST_TIMEOUT_MS = 12000;
const LYRICS_OVH_TIMEOUT_MS = 20000;
const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map();

const collapseSpaces = (value) => String(value || "").replace(/\s+/g, " ").trim();

const stripDecorators = (value) => {
  if (!value) return "";
  return collapseSpaces(
    String(value)
      .replace(/\[[^\]]*(official|lyrics?|audio|video|mv|4k|hd|visuali[sz]er)[^\]]*]/gi, "")
      .replace(/\([^\)]*(official|lyrics?|audio|video|mv|4k|hd|visuali[sz]er)[^\)]*\)/gi, "")
      .replace(/\s*[-–—]\s*(official\s*)?(visuali[sz]er)\b.*$/gi, "")
      .replace(/\s*[-–—]\s*(official\s*)?(lyrics?|lyric video|audio|video)\b.*$/gi, "")
      .replace(/\s*-\s*topic$/i, "")
  );
};

const parseArtistTitle = (query) => {
  const raw = collapseSpaces(query);
  if (!raw) return { artist: "", title: "" };
  const separators = [" - ", " – ", " — ", "|"];
  for (const separator of separators) {
    if (!raw.includes(separator)) continue;
    const [left, ...rest] = raw.split(separator);
    const right = rest.join(separator);
    if (left && right) {
      return {
        artist: stripDecorators(left),
        title: stripDecorators(right),
      };
    }
  }
  return { artist: "", title: stripDecorators(raw) };
};

const normalizeArtist = (artist) =>
  collapseSpaces(String(artist || "").replace(/\s*(ft\.?|feat\.?|featuring)\s+.+$/i, ""));

const normalizeTitle = (title) =>
  collapseSpaces(
    String(title || "")
      .replace(/\s*(ft\.?|feat\.?|featuring)\s+.+$/i, "")
      .replace(/\s*\/\s*lyrics?$/i, "")
  );

const getSongSearchData = (song) => {
  if (!song) return { artist: "", title: "" };
  const uploader = normalizeArtist(stripDecorators(song.uploader?.name || song.artist || ""));
  const rawTitle = stripDecorators(song.name || song.title || "");
  const parsed = parseArtistTitle(rawTitle);
  let artist = normalizeArtist(parsed.artist || uploader);
  let title = normalizeTitle(parsed.title || rawTitle);

  // Some tracks come as "Artist - Song" while uploader is noisy.
  if (!artist && rawTitle.includes(" - ")) {
    const splitParsed = parseArtistTitle(rawTitle);
    artist = normalizeArtist(splitParsed.artist);
    title = normalizeTitle(splitParsed.title);
  }

  return { artist, title };
};

const normalizeInput = ({ artist, title } = {}) => ({
  artist: normalizeArtist(stripDecorators(artist || "")),
  title: normalizeTitle(stripDecorators(title || "")),
});

const cachedGet = (key) => {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    cache.delete(key);
    return null;
  }
  return item.value;
};

const cachedSet = (key, value) => {
  cache.set(key, {
    value,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
};

const decodeHtmlEntities = (text) =>
  String(text || "")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");

const slugifyForVagalume = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " e ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const fetchFromVagalume = async (artist, title, apiKey) => {
  if (!title) return null;
  const params = {
    art: artist || "",
    mus: title,
  };
  if (apiKey) params.apikey = apiKey;

  const response = await axios.get("https://api.vagalume.com.br/search.php", {
    params,
    timeout: REQUEST_TIMEOUT_MS,
    validateStatus: () => true,
    headers: { "User-Agent": "KingBot/lyrics" },
  });

  if (response.status !== 200) return null;
  const item = response.data?.mus?.[0];
  const text = item?.text;
  if (!text) return null;

  return {
    source: "Vagalume",
    lyrics: String(text).trim(),
    title: item?.name || title,
    artist: response.data?.art?.name || artist || "",
    synced: false,
  };
};

const fetchFromVagalumeSite = async (artist, title) => {
  if (!artist || !title) return null;
  const artistSlug = slugifyForVagalume(artist);
  const titleSlug = slugifyForVagalume(title);
  if (!artistSlug || !titleSlug) return null;

  const url = `https://www.vagalume.com.br/${artistSlug}/${titleSlug}.html`;
  const response = await axios.get(url, {
    timeout: REQUEST_TIMEOUT_MS,
    validateStatus: () => true,
    headers: { "User-Agent": "KingBot/lyrics" },
  });
  if (response.status !== 200 || !response.data) return null;

  const html = String(response.data);
  const match = html.match(/<div id=lyrics[^>]*>([\s\S]*?)<\/div>/i);
  if (!match?.[1]) return null;

  const lyrics = decodeHtmlEntities(
    match[1]
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/\r/g, "")
  )
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n")
    .trim();

  if (!lyrics) return null;

  return {
    source: "Vagalume (site)",
    lyrics,
    title,
    artist,
    synced: false,
  };
};

const fetchFromVagalumeFallback = async (artist, title, apiKey) => {
  const apiResult = await fetchFromVagalume(artist, title, apiKey).catch(() => null);
  if (apiResult?.lyrics) return apiResult;

  // tentativa simples por titulo (sem retry em loop)
  if (artist) {
    const titleOnly = await fetchFromVagalume("", title, apiKey).catch(() => null);
    if (titleOnly?.lyrics) return titleOnly;
  }

  const siteResult = await fetchFromVagalumeSite(artist, title).catch(() => null);
  if (siteResult?.lyrics) return siteResult;

  return null;
};

const stripLrcTimestamps = (lyrics) => {
  const text = String(lyrics || "");
  if (!text) return "";
  return text
    .split(/\r?\n/)
    .map((line) =>
      line
        .replace(/\[\d{1,2}:\d{2}(?:\.\d{1,3})?\]/g, "")
        .replace(/\[\d{1,2}:\d{2}\]/g, "")
        .trim()
    )
    .filter(Boolean)
    .join("\n")
    .trim();
};

const fold = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const buildLrclibResult = (data, fallback = {}) => {
  let lyrics = String(data?.plainLyrics || "").trim();
  if (!lyrics) lyrics = stripLrcTimestamps(data?.syncedLyrics);
  if (!lyrics) return null;
  return {
    source: "LRCLIB",
    lyrics,
    title: data?.trackName || fallback.title || "",
    artist: data?.artistName || fallback.artist || "",
    synced: false,
  };
};

const fetchFromLrclib = async (artist, title) => {
  if (!title) return null;

  if (artist) {
    const exact = await axios
      .get("https://lrclib.net/api/get", {
        params: {
          artist_name: artist,
          track_name: title,
        },
        timeout: REQUEST_TIMEOUT_MS,
        validateStatus: () => true,
        headers: { "User-Agent": "KingBot/lyrics" },
      })
      .catch(() => null);

    if (exact?.status === 200) {
      const exactResult = buildLrclibResult(exact.data, { artist, title });
      if (exactResult) return exactResult;
    }
  }

  const search = await axios
    .get("https://lrclib.net/api/search", {
      params: {
        q: artist ? `${artist} ${title}` : title,
      },
      timeout: REQUEST_TIMEOUT_MS,
      validateStatus: () => true,
      headers: { "User-Agent": "KingBot/lyrics" },
    })
    .catch(() => null);

  if (search?.status !== 200 || !Array.isArray(search.data) || !search.data.length) return null;

  const wantedTitle = fold(title);
  const wantedArtist = fold(artist);

  const scored = search.data
    .map((entry) => {
      const built = buildLrclibResult(entry, { artist, title });
      if (!built) return null;
      const entryTitle = fold(built.title);
      const entryArtist = fold(built.artist);
      let score = 0;
      if (wantedTitle) {
        if (entryTitle === wantedTitle) score += 5;
        else if (entryTitle.includes(wantedTitle) || wantedTitle.includes(entryTitle)) score += 3;
      }
      if (wantedArtist) {
        if (entryArtist === wantedArtist) score += 4;
        else if (entryArtist.includes(wantedArtist) || wantedArtist.includes(entryArtist)) score += 2;
      }
      return { built, score };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);

  return scored[0]?.built || null;
};

const fetchFromLyricsOvh = async (artist, title) => {
  if (!artist || !title) return null;
  const response = await axios.get(
    `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`,
    {
      timeout: LYRICS_OVH_TIMEOUT_MS,
      validateStatus: () => true,
      headers: { "User-Agent": "KingBot/lyrics" },
    }
  );

  if (response.status !== 200) return null;
  const lyrics = String(response.data?.lyrics || "").trim();
  if (!lyrics) return null;

  return {
    source: "lyrics.ovh",
    lyrics,
    title,
    artist,
    synced: false,
  };
};

const getLyricsWithFallback = async (input = {}, options = {}) => {
  const normalized = normalizeInput(input);
  const key = `${normalized.artist.toLowerCase()}::${normalized.title.toLowerCase()}`;
  const cached = key !== "::" ? cachedGet(key) : null;
  if (cached) return { ...cached };

  const providers = [
    () => fetchFromLrclib(normalized.artist, normalized.title),
    () => fetchFromLyricsOvh(normalized.artist, normalized.title),
    () => fetchFromVagalumeFallback(normalized.artist, normalized.title, options.vagalumeApiKey),
  ];

  const errors = [];
  for (const provider of providers) {
    try {
      const result = await provider();
      if (result?.lyrics) {
        if (key !== "::") cachedSet(key, result);
        return result;
      }
    } catch (error) {
      errors.push(String(error?.message || error));
    }
  }

  return {
    source: null,
    lyrics: "",
    title: normalized.title,
    artist: normalized.artist,
    synced: false,
    errors,
  };
};

module.exports = {
  parseArtistTitle,
  getSongSearchData,
  getLyricsWithFallback,
};


