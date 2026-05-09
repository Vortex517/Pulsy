import { Router, type IRouter } from "express";
import { db, playlistsTable, playlistTracksTable } from "@workspace/db";
import { eq, and, count, desc } from "drizzle-orm";
import { extractUserId } from "../lib/auth";
import {
  CreatePlaylistBody,
  UpdatePlaylistBody,
  UpdatePlaylistParams,
  DeletePlaylistParams,
  GetPlaylistParams,
  AddTrackToPlaylistParams,
  AddTrackToPlaylistBody,
  RemoveTrackFromPlaylistParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/playlists", async (req, res): Promise<void> => {
  const userId = extractUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const playlists = await db
    .select()
    .from(playlistsTable)
    .where(eq(playlistsTable.userId, userId))
    .orderBy(desc(playlistsTable.updatedAt));

  // Get track counts
  const withCounts = await Promise.all(
    playlists.map(async (p) => {
      const [{ count: trackCount }] = await db
        .select({ count: count() })
        .from(playlistTracksTable)
        .where(eq(playlistTracksTable.playlistId, p.id));
      return {
        id: p.id,
        name: p.name,
        description: p.description,
        coverUrl: p.coverUrl,
        isPublic: p.isPublic,
        trackCount: Number(trackCount),
        userId: p.userId,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      };
    })
  );

  res.json(withCounts);
});

router.post("/playlists", async (req, res): Promise<void> => {
  const userId = extractUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = CreatePlaylistBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [playlist] = await db
    .insert(playlistsTable)
    .values({
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      coverUrl: parsed.data.coverUrl ?? null,
      isPublic: parsed.data.isPublic ?? true,
      userId,
    })
    .returning();

  res.status(201).json({
    id: playlist.id,
    name: playlist.name,
    description: playlist.description,
    coverUrl: playlist.coverUrl,
    isPublic: playlist.isPublic,
    trackCount: 0,
    userId: playlist.userId,
    createdAt: playlist.createdAt.toISOString(),
    updatedAt: playlist.updatedAt.toISOString(),
  });
});

router.get("/playlists/:id", async (req, res): Promise<void> => {
  const params = GetPlaylistParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid playlist ID" });
    return;
  }

  const [playlist] = await db
    .select()
    .from(playlistsTable)
    .where(eq(playlistsTable.id, params.data.id));

  if (!playlist) {
    res.status(404).json({ error: "Playlist not found" });
    return;
  }

  const tracks = await db
    .select()
    .from(playlistTracksTable)
    .where(eq(playlistTracksTable.playlistId, params.data.id))
    .orderBy(playlistTracksTable.addedAt);

  res.json({
    id: playlist.id,
    name: playlist.name,
    description: playlist.description,
    coverUrl: playlist.coverUrl,
    isPublic: playlist.isPublic,
    trackCount: tracks.length,
    userId: playlist.userId,
    createdAt: playlist.createdAt.toISOString(),
    updatedAt: playlist.updatedAt.toISOString(),
    tracks: tracks.map((t) => ({
      id: t.id,
      trackId: t.trackId,
      trackName: t.trackName,
      artistName: t.artistName,
      albumName: t.albumName,
      coverUrl: t.coverUrl,
      durationMs: t.durationMs,
      previewUrl: t.previewUrl,
      addedAt: t.addedAt.toISOString(),
    })),
  });
});

router.patch("/playlists/:id", async (req, res): Promise<void> => {
  const userId = extractUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = UpdatePlaylistParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid playlist ID" });
    return;
  }

  const parsed = UpdatePlaylistBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [playlist] = await db
    .update(playlistsTable)
    .set(parsed.data)
    .where(and(eq(playlistsTable.id, params.data.id), eq(playlistsTable.userId, userId)))
    .returning();

  if (!playlist) {
    res.status(404).json({ error: "Playlist not found" });
    return;
  }

  const [{ count: trackCount }] = await db
    .select({ count: count() })
    .from(playlistTracksTable)
    .where(eq(playlistTracksTable.playlistId, playlist.id));

  res.json({
    id: playlist.id,
    name: playlist.name,
    description: playlist.description,
    coverUrl: playlist.coverUrl,
    isPublic: playlist.isPublic,
    trackCount: Number(trackCount),
    userId: playlist.userId,
    createdAt: playlist.createdAt.toISOString(),
    updatedAt: playlist.updatedAt.toISOString(),
  });
});

router.delete("/playlists/:id", async (req, res): Promise<void> => {
  const userId = extractUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = DeletePlaylistParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid playlist ID" });
    return;
  }

  // Delete tracks first
  await db
    .delete(playlistTracksTable)
    .where(eq(playlistTracksTable.playlistId, params.data.id));

  await db
    .delete(playlistsTable)
    .where(and(eq(playlistsTable.id, params.data.id), eq(playlistsTable.userId, userId)));

  res.sendStatus(204);
});

router.post("/playlists/:id/tracks", async (req, res): Promise<void> => {
  const userId = extractUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = AddTrackToPlaylistParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid playlist ID" });
    return;
  }

  const parsed = AddTrackToPlaylistBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Verify playlist ownership
  const [playlist] = await db
    .select()
    .from(playlistsTable)
    .where(and(eq(playlistsTable.id, params.data.id), eq(playlistsTable.userId, userId)));

  if (!playlist) {
    res.status(404).json({ error: "Playlist not found" });
    return;
  }

  await db.insert(playlistTracksTable).values({
    playlistId: params.data.id,
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

router.delete("/playlists/:id/tracks/:trackId", async (req, res): Promise<void> => {
  const userId = extractUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = RemoveTrackFromPlaylistParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid parameters" });
    return;
  }

  // Verify playlist ownership
  const [playlist] = await db
    .select()
    .from(playlistsTable)
    .where(and(eq(playlistsTable.id, params.data.id), eq(playlistsTable.userId, userId)));

  if (!playlist) {
    res.status(404).json({ error: "Playlist not found" });
    return;
  }

  await db
    .delete(playlistTracksTable)
    .where(
      and(
        eq(playlistTracksTable.playlistId, params.data.id),
        eq(playlistTracksTable.trackId, params.data.trackId)
      )
    );

  res.sendStatus(204);
});

export default router;
