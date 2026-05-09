import { Router, type IRouter } from "express";
import { db, likedTracksTable, playHistoryTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { extractUserId } from "../lib/auth";
import {
  LikeTrackBody,
  LikeTrackParams,
  UnlikeTrackParams,
  GetRecentlyPlayedQueryParams,
  AddToHistoryBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/library/liked-tracks", async (req, res): Promise<void> => {
  const userId = extractUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const liked = await db
    .select()
    .from(likedTracksTable)
    .where(eq(likedTracksTable.userId, userId))
    .orderBy(desc(likedTracksTable.likedAt));

  res.json(
    liked.map((t) => ({
      id: t.id,
      trackId: t.trackId,
      trackName: t.trackName,
      artistName: t.artistName,
      albumName: t.albumName,
      coverUrl: t.coverUrl,
      durationMs: t.durationMs,
      previewUrl: t.previewUrl,
      likedAt: t.likedAt.toISOString(),
    }))
  );
});

router.post("/library/liked-tracks/:trackId", async (req, res): Promise<void> => {
  const userId = extractUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = LikeTrackParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid track ID" });
    return;
  }

  const body = LikeTrackBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const trackId = params.data.trackId;

  // Check if already liked
  const [existing] = await db
    .select()
    .from(likedTracksTable)
    .where(and(eq(likedTracksTable.userId, userId), eq(likedTracksTable.trackId, trackId)));

  if (existing) {
    res.status(200).json({ message: "Already liked" });
    return;
  }

  await db.insert(likedTracksTable).values({
    userId,
    trackId,
    trackName: body.data.trackName,
    artistName: body.data.artistName,
    albumName: body.data.albumName,
    coverUrl: body.data.coverUrl,
    durationMs: body.data.durationMs,
    previewUrl: body.data.previewUrl ?? null,
  });

  res.status(201).json({ success: true });
});

router.delete("/library/liked-tracks/:trackId", async (req, res): Promise<void> => {
  const userId = extractUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = UnlikeTrackParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid track ID" });
    return;
  }

  await db
    .delete(likedTracksTable)
    .where(and(eq(likedTracksTable.userId, userId), eq(likedTracksTable.trackId, params.data.trackId)));

  res.sendStatus(204);
});

router.get("/library/history", async (req, res): Promise<void> => {
  const userId = extractUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = GetRecentlyPlayedQueryParams.safeParse(req.query);
  const limit = parsed.success ? (parsed.data.limit ?? 50) : 50;

  const history = await db
    .select()
    .from(playHistoryTable)
    .where(eq(playHistoryTable.userId, userId))
    .orderBy(desc(playHistoryTable.playedAt))
    .limit(limit);

  res.json(
    history.map((h) => ({
      id: h.id,
      trackId: h.trackId,
      trackName: h.trackName,
      artistName: h.artistName,
      albumName: h.albumName,
      coverUrl: h.coverUrl,
      durationMs: h.durationMs,
      previewUrl: h.previewUrl,
      playedAt: h.playedAt.toISOString(),
    }))
  );
});

router.post("/library/history", async (req, res): Promise<void> => {
  const userId = extractUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = AddToHistoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  await db.insert(playHistoryTable).values({
    userId,
    trackId: parsed.data.trackId,
    trackName: parsed.data.trackName,
    artistName: parsed.data.artistName,
    albumName: parsed.data.albumName,
    coverUrl: parsed.data.coverUrl,
    durationMs: parsed.data.durationMs,
    previewUrl: parsed.data.previewUrl ?? null,
  });

  res.status(201).json({ success: true });
});

export default router;
