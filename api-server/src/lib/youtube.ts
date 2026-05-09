import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { logger } from "./logger";

const execFileAsync = promisify(execFile);

const YTDLP_BIN = path.join(process.cwd(), "bin", "yt-dlp");

const searchCache = new Map<string, { videoId: string; ts: number }>();
const formatUrlCache = new Map<string, { url: string; mimeType: string; ts: number }>();
const inFlight = new Map<string, Promise<{ url: string; mimeType: string } | null>>();

const SEARCH_TTL = 24 * 60 * 60 * 1000;
const FORMAT_TTL = 80 * 60 * 1000;

export async function searchYoutube(query: string): Promise<string | null> {
  const key = query.toLowerCase().trim();
  const cached = searchCache.get(key);
  if (cached && Date.now() - cached.ts < SEARCH_TTL) return cached.videoId;

  try {
    const { stdout } = await execFileAsync(YTDLP_BIN, [
      `ytsearch1:${query} official audio`,
      "--print", "id",
      "--no-download",
      "--quiet",
      "--no-warnings",
    ], { timeout: 15000 });

    const videoId = stdout.trim().split("\n")[0];
    if (videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      searchCache.set(key, { videoId, ts: Date.now() });
      logger.info({ query, videoId }, "yt-dlp search found video");
      return videoId;
    }
  } catch (err) {
    logger.warn({ err: (err as Error).message, query }, "yt-dlp search failed, HTML fallback");
  }

  try {
    const res = await fetch(
      `https://www.youtube.com/results?search_query=${encodeURIComponent(query + " official audio")}&sp=EgIQAQ%3D%3D`,
      { headers: { "User-Agent": "Mozilla/5.0", "Accept-Language": "en-US,en;q=0.9" } }
    );
    const html = await res.text();
    const m = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
    if (m?.[1]) {
      searchCache.set(key, { videoId: m[1], ts: Date.now() });
      logger.info({ query, videoId: m[1] }, "HTML fallback search found video");
      return m[1];
    }
  } catch (err) {
    logger.error({ err, query }, "HTML fallback search failed");
  }

  return null;
}

async function _fetchAudioStreamUrl(videoId: string): Promise<{ url: string; mimeType: string } | null> {
  const cached = formatUrlCache.get(videoId);
  if (cached && Date.now() - cached.ts < FORMAT_TTL) return cached;

  try {
    const { stdout } = await execFileAsync(YTDLP_BIN, [
      `https://www.youtube.com/watch?v=${videoId}`,
      "-f", "bestaudio[ext=webm]/bestaudio[ext=m4a]/bestaudio",
      "-g",
      "--quiet",
      "--no-warnings",
    ], { timeout: 20000 });

    const url = stdout.trim().split("\n")[0];
    if (!url?.startsWith("http")) {
      logger.warn({ videoId }, "yt-dlp returned no valid URL");
      return null;
    }

    // Determine mime type from URL (webm opus is most common)
    const mimeType = url.includes("mime=audio%2Fwebm") || url.includes("mime=audio/webm")
      ? "audio/webm"
      : url.includes("mime=audio%2Fmp4") || url.includes("mime=audio/mp4")
      ? "audio/mp4"
      : "audio/webm";

    const result = { url, mimeType, ts: Date.now() };
    formatUrlCache.set(videoId, result);
    logger.info({ videoId, mimeType }, "yt-dlp got audio URL");
    return result;
  } catch (err) {
    logger.error({ err: (err as Error).message, videoId }, "yt-dlp failed to get audio URL");
    return null;
  }
}

export function getAudioStreamUrl(videoId: string): Promise<{ url: string; mimeType: string } | null> {
  // Deduplicate concurrent requests for same videoId
  const existing = inFlight.get(videoId);
  if (existing) return existing;

  const promise = _fetchAudioStreamUrl(videoId).finally(() => inFlight.delete(videoId));
  inFlight.set(videoId, promise);
  return promise;
}

/** Pre-warm format URL cache in background — call after search resolves */
export function prewarmAudioUrl(videoId: string): void {
  getAudioStreamUrl(videoId).catch(() => {});
}
