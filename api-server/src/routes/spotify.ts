import { Router, type IRouter } from "express";
import {
  getFeaturedTracks,
  getNewReleases,
  getCategories,
  getRecommendations,
  getArtist,
  getArtistTopTracks,
  getArtistAlbums,
  getAlbum,
  getTrack,
  searchSpotify,
  getTrendingTracks,
  getMoodPlaylists,
} from "../lib/spotify";
import {
  GetRecommendationsQueryParams,
  SearchSpotifyQueryParams,
  GetTrendingTracksQueryParams,
  GetArtistParams,
  GetArtistTopTracksParams,
  GetArtistAlbumsParams,
  GetAlbumParams,
  GetTrackParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/spotify/featured-tracks", async (req, res): Promise<void> => {
  const tracks = await getFeaturedTracks();
  res.json(tracks);
});

router.get("/spotify/new-releases", async (req, res): Promise<void> => {
  const albums = await getNewReleases();
  res.json(albums);
});

router.get("/spotify/categories", async (req, res): Promise<void> => {
  const categories = await getCategories();
  res.json(categories);
});

router.get("/spotify/recommendations", async (req, res): Promise<void> => {
  const parsed = GetRecommendationsQueryParams.safeParse(req.query);
  const params = parsed.success ? parsed.data : {};
  const tracks = await getRecommendations(params);
  res.json(tracks);
});

router.get("/spotify/artist/:id", async (req, res): Promise<void> => {
  const params = GetArtistParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid artist ID" });
    return;
  }
  const artist = await getArtist(params.data.id);
  res.json(artist);
});

router.get("/spotify/artist/:id/top-tracks", async (req, res): Promise<void> => {
  const params = GetArtistTopTracksParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid artist ID" });
    return;
  }
  const tracks = await getArtistTopTracks(params.data.id);
  res.json(tracks);
});

router.get("/spotify/artist/:id/albums", async (req, res): Promise<void> => {
  const params = GetArtistAlbumsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid artist ID" });
    return;
  }
  const albums = await getArtistAlbums(params.data.id);
  res.json(albums);
});

router.get("/spotify/album/:id", async (req, res): Promise<void> => {
  const params = GetAlbumParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid album ID" });
    return;
  }
  const album = await getAlbum(params.data.id);
  res.json(album);
});

router.get("/spotify/track/:id", async (req, res): Promise<void> => {
  const params = GetTrackParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid track ID" });
    return;
  }
  const track = await getTrack(params.data.id);
  res.json(track);
});

router.get("/spotify/search", async (req, res): Promise<void> => {
  const parsed = SearchSpotifyQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Query parameter 'q' is required" });
    return;
  }
  const { q, type, limit } = parsed.data;
  const results = await searchSpotify(q, type ?? "track,artist,album", limit ?? 20);
  res.json(results);
});

router.get("/spotify/trending", async (req, res): Promise<void> => {
  const parsed = GetTrendingTracksQueryParams.safeParse(req.query);
  const genre = parsed.success ? parsed.data.genre : undefined;
  const tracks = await getTrendingTracks(genre);
  res.json(tracks);
});

router.get("/spotify/mood-playlists", async (req, res): Promise<void> => {
  const playlists = await getMoodPlaylists();
  res.json(playlists);
});

export default router;
