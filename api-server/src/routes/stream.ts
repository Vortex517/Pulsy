import { Router, type IRouter } from "express";
import { searchYoutube, getAudioStreamUrl, prewarmAudioUrl } from "../lib/youtube";
import { logger } from "../lib/logger";
import { Readable } from "node:stream";

const router: IRouter = Router();

router.get("/youtube/search", async (req, res): Promise<void> => {
  const q = req.query.q;
  if (!q || typeof q !== "string") {
    res.status(400).json({ error: "Query parameter q is required" });
    return;
  }

  const videoId = await searchYoutube(q);
  if (!videoId) {
    res.status(404).json({ error: "No video found for query" });
    return;
  }

  // Pre-warm the format URL while client is receiving this response
  prewarmAudioUrl(videoId);

  res.json({ videoId, streamUrl: `/api/stream/${videoId}` });
});

router.get("/stream/:videoId", async (req, res): Promise<void> => {
  const { videoId } = req.params;
  if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    res.status(400).json({ error: "Invalid video ID" });
    return;
  }

  try {
    const format = await getAudioStreamUrl(videoId);
    if (!format) {
      res.status(404).json({ error: "Audio not available for this video" });
      return;
    }

    // Proxy the audio stream with range request support (enables seeking)
    const proxyHeaders: Record<string, string> = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Accept": "*/*",
    };

    if (req.headers.range) {
      proxyHeaders["range"] = req.headers.range;
    }

    const ytRes = await fetch(format.url, { headers: proxyHeaders });

    res.setHeader("Content-Type", format.mimeType);
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Expose-Headers", "Content-Length, Content-Range, Content-Type");

    const contentLength = ytRes.headers.get("content-length");
    if (contentLength) res.setHeader("Content-Length", contentLength);

    const contentRange = ytRes.headers.get("content-range");
    if (contentRange) res.setHeader("Content-Range", contentRange);

    res.status(ytRes.status);

    if (!ytRes.body) {
      res.end();
      return;
    }

    const nodeStream = Readable.fromWeb(ytRes.body as Parameters<typeof Readable.fromWeb>[0]);
    nodeStream.pipe(res);

    req.on("close", () => nodeStream.destroy());
    nodeStream.on("error", (err) => {
      logger.error({ err, videoId }, "Stream piping error");
      if (!res.headersSent) res.status(500).end();
    });
  } catch (err) {
    logger.error({ err, videoId }, "Stream route error");
    if (!res.headersSent) {
      res.status(500).json({ error: "Streaming failed" });
    }
  }
});

export default router;
