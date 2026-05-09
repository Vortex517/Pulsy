import { Router, type IRouter } from "express";
import { db, likedTracksTable, playHistoryTable, playlistsTable } from "@workspace/db";
import { eq, count, sum } from "drizzle-orm";
import { extractUserId } from "../lib/auth";
import { getFeaturedTracks, getNewReleases, getCategories, getMoodPlaylists } from "../lib/spotify";

const router: IRouter = Router();

router.get("/stats/home", async (_req, res): Promise<void> => {
  const [featuredTracks, newReleases, categories, moodPlaylists] = await Promise.all([
    getFeaturedTracks(),
    getNewReleases(),
    getCategories(),
    getMoodPlaylists(),
  ]);

  res.json({ featuredTracks, newReleases, categories, moodPlaylists });
});

router.get("/stats/library-summary", async (req, res): Promise<void> => {
  const userId = extractUserId(req);
  if (!userId) {
    res.json({ likedCount: 0, playlistCount: 0, recentCount: 0, totalListenMinutes: 0 });
    return;
  }

  const [likedResult, playlistResult, recentResult, durationResult] = await Promise.all([
    db.select({ count: count() }).from(likedTracksTable).where(eq(likedTracksTable.userId, userId)),
    db.select({ count: count() }).from(playlistsTable).where(eq(playlistsTable.userId, userId)),
    db.select({ count: count() }).from(playHistoryTable).where(eq(playHistoryTable.userId, userId)),
    db.select({ total: sum(playHistoryTable.durationMs) }).from(playHistoryTable).where(eq(playHistoryTable.userId, userId)),
  ]);

  const totalMs = Number(durationResult[0]?.total ?? 0);

  res.json({
    likedCount: Number(likedResult[0]?.count ?? 0),
    playlistCount: Number(playlistResult[0]?.count ?? 0),
    recentCount: Number(recentResult[0]?.count ?? 0),
    totalListenMinutes: Math.round(totalMs / 60000),
  });
});

export default router;
