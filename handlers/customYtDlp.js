const path = require("path");
const os = require("os");
const fs = require("fs");
const { spawn } = require("child_process");
const { DisTubeError, PlayableExtractorPlugin, Playlist, Song } = require("distube");
const { download } = require("@distube/yt-dlp");

const isPlaylist = (info) => Array.isArray(info?.entries);

const YTDLP_PATH =
  process.env.YTDLP_PATH ||
  path.join(
    path.dirname(require.resolve("@distube/yt-dlp")),
    "..",
    "bin",
    `yt-dlp${process.platform === "win32" ? ".exe" : ""}`
  );

const toFlag = (key) => `--${String(key).replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;

const buildArgs = (url, flags = {}) => {
  const args = [url];
  for (const [key, value] of Object.entries(flags)) {
    if (value === undefined || value === null || value === false) continue;
    const flag = toFlag(key);
    if (value === true) {
      args.push(flag);
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item === undefined || item === null || item === false) continue;
        args.push(flag, String(item));
      }
      continue;
    }
    args.push(flag, String(value));
  }
  return args;
};

const trimEnv = (value) => String(value ?? "").trim();

const YTDLP_EXTRACTOR_ARGS =
  trimEnv(process.env.YTDLP_EXTRACTOR_ARGS) ||
  trimEnv(process.env.YOUTUBE_EXTRACTOR_ARGS) ||
  "youtube:player_client=android,web";

const existingCookiesFile =
  trimEnv(process.env.YTDLP_COOKIES_FILE) ||
  trimEnv(process.env.YTDLP_COOKIE_FILE) ||
  trimEnv(process.env.YOUTUBE_COOKIES_FILE);

const fallbackCookieFiles = [
  path.join(process.cwd(), "cookies.txt"),
  path.join(process.cwd(), "cookie.txt"),
  path.join(process.cwd(), "cooke.txt"),
];

const cookiesFromBrowser =
  trimEnv(process.env.YTDLP_COOKIES_FROM_BROWSER) ||
  trimEnv(process.env.YOUTUBE_COOKIES_FROM_BROWSER);

const rawCookieInput =
  trimEnv(process.env.YTDLP_COOKIE) ||
  trimEnv(process.env.YOUTUBE_COOKIE);

const rawCookieInputB64 = trimEnv(process.env.YTDLP_COOKIE_B64);

const decodeBase64 = (value) => {
  try {
    return Buffer.from(value, "base64").toString("utf8");
  } catch {
    return "";
  }
};

const getRawCookieText = () => {
  if (rawCookieInputB64) return decodeBase64(rawCookieInputB64).trim();
  if (!rawCookieInput) return "";
  if (rawCookieInput.toLowerCase().startsWith("base64:")) {
    return decodeBase64(rawCookieInput.slice(7)).trim();
  }
  return rawCookieInput;
};

const looksLikeNetscapeCookieFile = (text) => {
  if (!text) return false;
  return text.includes("Netscape HTTP Cookie File") || /\t(TRUE|FALSE)\t\/\t/.test(text);
};

const convertCookieHeaderToNetscape = (header) => {
  const expires = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365;
  const lines = ["# Netscape HTTP Cookie File"];
  const pairs = String(header || "")
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);

  for (const pair of pairs) {
    const idx = pair.indexOf("=");
    if (idx <= 0) continue;
    const name = pair.slice(0, idx).trim();
    const value = pair.slice(idx + 1).trim();
    if (!name || !value) continue;
    lines.push(`.youtube.com\tTRUE\t/\tTRUE\t${expires}\t${name}\t${value}`);
  }
  if (lines.length <= 1) return "";
  return lines.join("\n");
};

let generatedCookiesFile = "";
const resolveCookiesFile = () => {
  if (existingCookiesFile) {
    if (fs.existsSync(existingCookiesFile)) return existingCookiesFile;
    console.warn(`[CustomYtDlp] Arquivo de cookies nao encontrado: ${existingCookiesFile}`);
  }

  for (const file of fallbackCookieFiles) {
    if (fs.existsSync(file)) return file;
  }

  const cookieText = getRawCookieText();
  if (!cookieText) return "";

  try {
    const content = looksLikeNetscapeCookieFile(cookieText)
      ? cookieText
      : convertCookieHeaderToNetscape(cookieText);
    if (!content) {
      console.warn("[CustomYtDlp] Cookie invalido no env. Use formato Netscape ou header completo com nome=valor.");
      return "";
    }
    generatedCookiesFile = path.join(os.tmpdir(), `yt-dlp-cookies-${process.pid}.txt`);
    fs.writeFileSync(generatedCookiesFile, content, "utf8");
    return generatedCookiesFile;
  } catch (e) {
    console.warn(`[CustomYtDlp] Falha ao gerar arquivo temporario de cookies: ${e}`);
    return "";
  }
};

const cookiesFile = resolveCookiesFile();

const buildBaseFlags = () => {
  const flags = {
    noWarnings: true,
    ignoreConfig: true,
    preferFreeFormats: true,
    skipDownload: true,
    simulate: true,
  };

  if (YTDLP_EXTRACTOR_ARGS) flags.extractorArgs = YTDLP_EXTRACTOR_ARGS;
  if (cookiesFromBrowser) flags.cookiesFromBrowser = cookiesFromBrowser;
  if (cookiesFile) flags.cookies = cookiesFile;
  return flags;
};

const formatYtDlpError = (err) => {
  const text = String(err?.stderr || err || "");
  if (/Sign in to confirm you.?re not a bot/i.test(text) || /Use --cookies-from-browser or --cookies/i.test(text)) {
    return `${text}\n\nConfigure um destes envs para autenticar o YouTube: YTDLP_COOKIES_FILE (caminho), YTDLP_COOKIE/YOUTUBE_COOKIE (string), YTDLP_COOKIE_B64, ou YTDLP_COOKIES_FROM_BROWSER.`;
  }
  return text;
};

const tryParseJson = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const parseYtDlpJsonOutput = (stdout, stderr) => {
  const direct = tryParseJson(stdout.trim());
  if (direct) return direct;

  const lines = `${stdout}\n${stderr}`
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .reverse();

  for (const line of lines) {
    if (!line.startsWith("{") && !line.startsWith("[")) continue;
    const parsed = tryParseJson(line);
    if (parsed) return parsed;
  }

  throw new Error((stderr || stdout || "Failed to parse yt-dlp output").trim());
};

const isFormatUnavailableError = (err) =>
  /Requested format is not available/i.test(String(err?.stderr || err || ""));
const isBotCheckError = (err) =>
  /Sign in to confirm you.?re not a bot/i.test(String(err?.stderr || err || "")) ||
  /Use --cookies-from-browser or --cookies/i.test(String(err?.stderr || err || ""));

const extractYoutubeId = (rawUrl) => {
  try {
    const value = String(rawUrl || "").trim();
    if (!value) return "";
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./i, "").toLowerCase();
    if (host === "youtu.be") return url.pathname.split("/").filter(Boolean)[0] || "";
    if (host.endsWith("youtube.com")) {
      const fromQuery = url.searchParams.get("v");
      if (fromQuery) return fromQuery;
      const parts = url.pathname.split("/").filter(Boolean);
      const isEmbed = parts[0] === "embed" || parts[0] === "shorts" || parts[0] === "live";
      if (isEmbed && parts[1]) return parts[1];
    }
    return "";
  } catch {
    return "";
  }
};

const isYoutubeLikeUrl = (rawUrl) => {
  const value = String(rawUrl || "").toLowerCase();
  return value.includes("youtube.com/") || value.includes("youtu.be/");
};

let youtubeiInnertube = null;
const getInnertube = async () => {
  if (youtubeiInnertube) return youtubeiInnertube;
  try {
    const { Innertube } = require("youtubei.js");
    youtubeiInnertube = await Innertube.create({ retrieve_player: true });
    return youtubeiInnertube;
  } catch {
    return null;
  }
};

const getFormatMime = (fmt) => String(fmt?.mime_type || fmt?.mimeType || "").toLowerCase();
const hasAudioTrack = (fmt) => fmt?.has_audio === true || getFormatMime(fmt).includes("audio/");
const hasVideoTrack = (fmt) => fmt?.has_video === true || getFormatMime(fmt).includes("video/");
const getFormatBitrate = (fmt) =>
  Number(
    fmt?.bitrate ||
      fmt?.average_bitrate ||
      fmt?.averageBitrate ||
      0
  );

const resolveYoutubeiFormatUrl = async (fmt) => {
  const directUrl = String(fmt?.url || "").trim();
  if (directUrl) return directUrl;
  if (typeof fmt?.decipher === "function") {
    try {
      const deciphered = await fmt.decipher();
      if (typeof deciphered === "string" && deciphered.trim()) return deciphered.trim();
      const decipheredUrl = String(deciphered?.url || "").trim();
      if (decipheredUrl) return decipheredUrl;
    } catch {
      // ignore and try next candidate
    }
  }
  return "";
};

const pickBestAudioFromFormats = async (formats = []) => {
  const all = Array.isArray(formats) ? formats.filter(Boolean) : [];
  if (!all.length) return "";

  const audioOnly = all.filter((fmt) => hasAudioTrack(fmt) && !hasVideoTrack(fmt));
  const audioLike = all.filter((fmt) => hasAudioTrack(fmt));
  const ranked = (audioOnly.length ? audioOnly : audioLike.length ? audioLike : all).sort(
    (a, b) => getFormatBitrate(b) - getFormatBitrate(a)
  );

  for (const candidate of ranked) {
    const url = await resolveYoutubeiFormatUrl(candidate);
    if (url) return url;
  }

  return "";
};

const getYoutubeiAudioUrl = async (rawUrl) => {
  const ytId = extractYoutubeId(rawUrl);
  if (!ytId) return "";
  const innertube = await getInnertube();
  if (!innertube) return "";
  const clients = ["ANDROID", "IOS", "WEB"];

  for (const client of clients) {
    try {
      const info = await innertube.getBasicInfo(ytId, { client });
      const adaptive = Array.isArray(info?.streaming_data?.adaptive_formats) ? info.streaming_data.adaptive_formats : [];
      const muxed = Array.isArray(info?.streaming_data?.formats) ? info.streaming_data.formats : [];
      let url = await pickBestAudioFromFormats([...adaptive, ...muxed]);
      if (url) return url;

      const detailedInfo = await innertube.getInfo(ytId, { client });
      const detailedAdaptive = Array.isArray(detailedInfo?.streaming_data?.adaptive_formats)
        ? detailedInfo.streaming_data.adaptive_formats
        : [];
      const detailedMuxed = Array.isArray(detailedInfo?.streaming_data?.formats)
        ? detailedInfo.streaming_data.formats
        : [];
      url = await pickBestAudioFromFormats([...detailedAdaptive, ...detailedMuxed]);
      if (url) return url;
    } catch {
      // try next client
    }
  }

  return "";
};

let playDlLib = null;
const getPlayDl = () => {
  if (playDlLib !== null) return playDlLib;
  try {
    playDlLib = require("play-dl");
  } catch {
    playDlLib = false;
  }
  return playDlLib;
};

const getPlayDlAudioUrl = async (rawUrl) => {
  const playDl = getPlayDl();
  if (!playDl) return "";
  try {
    const info = await playDl.video_info(String(rawUrl || "").trim());
    const formats = Array.isArray(info?.format) ? info.format : [];
    const audioOnly = formats.find(
      (entry) =>
        entry?.url &&
        /audio/i.test(String(entry?.mimeType || "")) &&
        !/video/i.test(String(entry?.mimeType || ""))
    );
    const audioLike = formats.find((entry) => entry?.url && /audio/i.test(String(entry?.mimeType || "")));
    const any = formats.find((entry) => entry?.url);
    return audioOnly?.url || audioLike?.url || any?.url || "";
  } catch {
    return "";
  }
};

const withoutCookieFlags = (flags) => {
  const next = { ...flags };
  delete next.cookies;
  delete next.cookiesFromBrowser;
  return next;
};

const json = (url, flags = {}, options = {}) =>
  new Promise((resolve, reject) => {
    const child = spawn(YTDLP_PATH, buildArgs(url, flags), {
      windowsHide: true,
      ...options,
    });

    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr?.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        return reject(new Error((stderr || stdout || `yt-dlp exited with code ${code}`).trim()));
      }
      try {
        resolve(parseYtDlpJsonOutput(stdout, stderr));
      } catch (err) {
        reject(err);
      }
    });
  });

class CustomYtDlpPlugin extends PlayableExtractorPlugin {
  constructor({ update } = {}) {
    super();
    if (cookiesFile) {
      console.log(`[CustomYtDlp] Cookies carregados de: ${cookiesFile}`);
    } else {
      console.warn("[CustomYtDlp] Nenhum arquivo de cookies detectado (cookies opcionais nao encontrados).");
    }
    if (update ?? true) download().catch(() => undefined);
  }

  validate() {
    return true;
  }

  async resolve(url, options) {
    const base = buildBaseFlags();
    const noExtractorArgs = { ...base };
    delete noExtractorArgs.extractorArgs;
    const noPreferFree = { ...base, preferFreeFormats: false };
    const noCookies = withoutCookieFlags(base);
    const altClientTv = { ...base, extractorArgs: "youtube:player_client=tv_embedded,android,web" };
    const altClientIos = { ...base, extractorArgs: "youtube:player_client=ios,android,web" };
    const altClientTvNoCookies = withoutCookieFlags(altClientTv);
    const altClientIosNoCookies = withoutCookieFlags(altClientIos);
    const attempts = [
      { ...base, dumpSingleJson: true, flatPlaylist: true },
      { ...base, dumpSingleJson: true, flatPlaylist: true, format: "best" },
      { ...base, dumpSingleJson: true, format: "best" },
      { ...altClientTv, dumpSingleJson: true, flatPlaylist: true },
      { ...altClientTv, dumpSingleJson: true, format: "best" },
      { ...altClientIos, dumpSingleJson: true, flatPlaylist: true },
      { ...altClientIos, dumpSingleJson: true, format: "best" },
      { ...noExtractorArgs, dumpSingleJson: true, flatPlaylist: true },
      { ...noExtractorArgs, dumpSingleJson: true, format: "best" },
      { ...noPreferFree, dumpSingleJson: true, flatPlaylist: true },
      { ...noPreferFree, dumpSingleJson: true, format: "best" },
      { ...noCookies, dumpSingleJson: true, flatPlaylist: true },
      { ...noCookies, dumpSingleJson: true, format: "best" },
      { ...altClientTvNoCookies, dumpSingleJson: true, flatPlaylist: true },
      { ...altClientTvNoCookies, dumpSingleJson: true, format: "best" },
      { ...altClientIosNoCookies, dumpSingleJson: true, flatPlaylist: true },
      { ...altClientIosNoCookies, dumpSingleJson: true, format: "best" },
      { dumpSingleJson: true, noWarnings: true, ignoreConfig: true },
    ];
    let info = null;
    let lastError = null;

    for (const flags of attempts) {
      try {
        info = await json(url, flags);
        break;
      } catch (err) {
        lastError = err;
        if (isFormatUnavailableError(err) || isBotCheckError(err)) continue;
        throw new DisTubeError("YTDLP_ERROR", formatYtDlpError(err));
      }
    }

    if (!info) {
      if ((isFormatUnavailableError(lastError) || isBotCheckError(lastError)) && isYoutubeLikeUrl(url)) {
        const ytId = extractYoutubeId(url);
        if (isBotCheckError(lastError)) {
          console.warn(`[CustomYtDlp] resolve fallback ativado para bot-check: ${ytId || "id-desconhecido"}`);
        }
        const fallbackUrl = ytId ? `https://www.youtube.com/watch?v=${ytId}` : String(url || "").trim();
        return new CustomYtDlpSong(
          this,
          {
            extractor: "youtube",
            id: ytId || undefined,
            title: ytId ? `YouTube (${ytId})` : "YouTube",
            webpage_url: fallbackUrl,
            original_url: fallbackUrl,
          },
          options
        );
      }
      throw new DisTubeError("YTDLP_ERROR", formatYtDlpError(lastError));
    }

    if (isPlaylist(info)) {
      const entries = Array.isArray(info.entries) ? info.entries.filter(Boolean) : [];
      if (entries.length === 0) throw new DisTubeError("YTDLP_ERROR", "The playlist is empty");
      return new Playlist(
        {
          source: info.extractor,
          songs: entries.map((entry) => new CustomYtDlpSong(this, entry, options)),
          id: info.id?.toString?.() || String(info.id || ""),
          name: info.title,
          url: info.webpage_url,
          thumbnail: info.thumbnails?.[0]?.url,
        },
        options
      );
    }

    return new CustomYtDlpSong(this, info, options);
  }

  async getStreamURL(song) {
    if (!song.url) {
      throw new DisTubeError("YTDLP_PLUGIN_INVALID_SONG", "Cannot get stream url from invalid song.");
    }
    const base = buildBaseFlags();
    const noExtractorArgs = { ...base };
    delete noExtractorArgs.extractorArgs;
    const noPreferFree = { ...base, preferFreeFormats: false };
    const noCookies = withoutCookieFlags(base);
    const altClientTv = { ...base, extractorArgs: "youtube:player_client=tv_embedded,android,web" };
    const altClientIos = { ...base, extractorArgs: "youtube:player_client=ios,android,web" };
    const altClientTvNoCookies = withoutCookieFlags(altClientTv);
    const altClientIosNoCookies = withoutCookieFlags(altClientIos);
    const attempts = [
      { ...base, dumpSingleJson: true, format: "ba/ba*" },
      { ...base, dumpSingleJson: true, format: "bestaudio/best" },
      { ...base, dumpSingleJson: true, format: "best" },
      { ...altClientTv, dumpSingleJson: true, format: "bestaudio/best" },
      { ...altClientTv, dumpSingleJson: true, format: "best" },
      { ...altClientIos, dumpSingleJson: true, format: "bestaudio/best" },
      { ...altClientIos, dumpSingleJson: true, format: "best" },
      { ...noExtractorArgs, dumpSingleJson: true, format: "bestaudio/best" },
      { ...noExtractorArgs, dumpSingleJson: true, format: "best" },
      { ...noPreferFree, dumpSingleJson: true, format: "bestaudio/best" },
      { ...noPreferFree, dumpSingleJson: true, format: "best" },
      { ...noCookies, dumpSingleJson: true, format: "bestaudio/best" },
      { ...noCookies, dumpSingleJson: true, format: "best" },
      { ...altClientTvNoCookies, dumpSingleJson: true, format: "bestaudio/best" },
      { ...altClientTvNoCookies, dumpSingleJson: true, format: "best" },
      { ...altClientIosNoCookies, dumpSingleJson: true, format: "bestaudio/best" },
      { ...altClientIosNoCookies, dumpSingleJson: true, format: "best" },
      { dumpSingleJson: true, noWarnings: true, ignoreConfig: true, format: "best" },
      { ...base, dumpSingleJson: true },
    ];
    let info = null;
    let lastError = null;

    for (const flags of attempts) {
      try {
        info = await json(song.url, flags);
        break;
      } catch (err) {
        lastError = err;
        if (isFormatUnavailableError(err) || isBotCheckError(err)) continue;
        throw new DisTubeError("YTDLP_ERROR", formatYtDlpError(err));
      }
    }

    if (!info) {
      if (isYoutubeLikeUrl(song.url)) {
        const ytjsUrl = await getYoutubeiAudioUrl(song.url);
        if (ytjsUrl) {
          console.warn("[CustomYtDlp] getStreamURL fallback com youtubei.js ativado.");
          return ytjsUrl;
        }
      }
      if (isBotCheckError(lastError) && isYoutubeLikeUrl(song.url)) {
        const fallbackAudioUrl = await getPlayDlAudioUrl(song.url);
        if (fallbackAudioUrl) {
          console.warn("[CustomYtDlp] getStreamURL fallback com play-dl ativado.");
          return fallbackAudioUrl;
        }
      }
      throw new DisTubeError("YTDLP_ERROR", formatYtDlpError(lastError));
    }

    if (isPlaylist(info)) throw new DisTubeError("YTDLP_ERROR", "Cannot get stream URL of a entire playlist");
    const streamUrl =
      info.url ||
      (Array.isArray(info.formats)
        ? info.formats.find((entry) => entry?.url && /audio/i.test(String(entry?.vcodec || "")))?.url ||
          info.formats.find((entry) => entry?.url)?.url
        : "");
    if (!streamUrl) {
      if (isYoutubeLikeUrl(song.url)) {
        const ytjsUrl = await getYoutubeiAudioUrl(song.url);
        if (ytjsUrl) {
          console.warn("[CustomYtDlp] streamUrl vazio no yt-dlp, fallback com youtubei.js.");
          return ytjsUrl;
        }
        const fallbackAudioUrl = await getPlayDlAudioUrl(song.url);
        if (fallbackAudioUrl) {
          console.warn("[CustomYtDlp] streamUrl vazio no yt-dlp, fallback com play-dl.");
          return fallbackAudioUrl;
        }
      }
      throw new DisTubeError("YTDLP_ERROR", "Nao foi possivel obter URL de stream para essa musica.");
    }
    return streamUrl;
  }

  getRelatedSongs() {
    return [];
  }
}

class CustomYtDlpSong extends Song {
  constructor(plugin, info, options = {}) {
    const rawSource = String(info.extractor || info.ie_key || "");
    const source = rawSource.toLowerCase();
    const inferredYoutubeUrl =
      info.id && source.includes("youtube")
        ? `https://www.youtube.com/watch?v=${info.id}`
        : undefined;
    const resolvedUrl =
      info.webpage_url ||
      info.original_url ||
      (typeof info.url === "string" && /^https?:\/\//i.test(info.url) ? info.url : undefined) ||
      inferredYoutubeUrl;

    super(
      {
        plugin,
        source: rawSource || "unknown",
        playFromSource: true,
        id: info.id,
        name: info.title || info.fulltitle,
        url: resolvedUrl,
        isLive: Boolean(info.is_live || info.live_status === "is_live"),
        thumbnail: info.thumbnail || info.thumbnails?.[0]?.url,
        duration: info.is_live ? 0 : Number(info.duration || 0),
        uploader: {
          name: info.uploader,
          url: info.uploader_url,
        },
        views: info.view_count,
        likes: info.like_count,
        dislikes: info.dislike_count,
        reposts: info.repost_count,
        ageRestricted: Boolean(info.age_limit) && info.age_limit >= 18,
      },
      options
    );
  }
}

module.exports = { CustomYtDlpPlugin };
