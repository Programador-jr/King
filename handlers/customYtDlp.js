const path = require("path");
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
    if (update ?? true) download().catch(() => undefined);
  }

  validate() {
    return true;
  }

  async resolve(url, options) {
    const info = await json(url, {
      dumpSingleJson: true,
      flatPlaylist: true,
      noWarnings: true,
      preferFreeFormats: true,
      skipDownload: true,
      simulate: true,
    }).catch((err) => {
      throw new DisTubeError("YTDLP_ERROR", `${err?.stderr || err}`);
    });

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
    const info = await json(song.url, {
      dumpSingleJson: true,
      noWarnings: true,
      preferFreeFormats: true,
      skipDownload: true,
      simulate: true,
      format: "ba/ba*",
    }).catch((err) => {
      throw new DisTubeError("YTDLP_ERROR", `${err?.stderr || err}`);
    });

    if (isPlaylist(info)) throw new DisTubeError("YTDLP_ERROR", "Cannot get stream URL of a entire playlist");
    return info.url;
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
