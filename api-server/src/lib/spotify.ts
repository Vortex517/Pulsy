import { logger } from "./logger";

let accessToken: string | null = null;
let tokenExpiry = 0;

// Spotify development/quota mode restricts search to max 10 results
const MAX_SEARCH_LIMIT = 10;

async function getAccessToken(): Promise<string> {
  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be set");
  }

  const creds = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${creds}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    throw new Error(`Spotify token error: ${res.status}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  accessToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return accessToken;
}

async function spotifyFetch(path: string): Promise<unknown> {
  const token = await getAccessToken();
  const res = await fetch(`https://api.spotify.com/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    logger.warn({ status: res.status, path }, "Spotify API error");
    throw new Error(`Spotify API error: ${res.status} for ${path}`);
  }

  return res.json();
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ id: string; name: string }>;
  album: { id: string; name: string; images: Array<{ url: string }> };
  preview_url: string | null;
  duration_ms: number;
  popularity: number;
  explicit: boolean;
  external_urls: { spotify: string };
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  artists: Array<{ id: string; name: string }>;
  images: Array<{ url: string }>;
  release_date: string;
  total_tracks: number;
  album_type: string;
  external_urls: { spotify: string };
}

export interface SpotifyArtist {
  id: string;
  name: string;
  images: Array<{ url: string }>;
  genres: string[];
  followers: { total: number };
  popularity: number;
  external_urls: { spotify: string };
}

function mapTrack(t: SpotifyTrack) {
  return {
    id: t.id,
    name: t.name,
    artistName: t.artists[0]?.name ?? "Unknown",
    artistId: t.artists[0]?.id ?? "",
    albumName: t.album?.name ?? "",
    albumId: t.album?.id ?? "",
    coverUrl: t.album?.images?.[0]?.url ?? "",
    previewUrl: t.preview_url,
    durationMs: t.duration_ms,
    popularity: t.popularity,
    explicit: t.explicit,
    externalUrl: t.external_urls?.spotify ?? "",
  };
}

function mapAlbum(a: SpotifyAlbum) {
  return {
    id: a.id,
    name: a.name,
    artistName: a.artists[0]?.name ?? "Unknown",
    artistId: a.artists[0]?.id ?? "",
    coverUrl: a.images?.[0]?.url ?? "",
    releaseDate: a.release_date,
    totalTracks: a.total_tracks,
    albumType: a.album_type,
    externalUrl: a.external_urls?.spotify ?? "",
  };
}

function mapArtist(a: SpotifyArtist) {
  return {
    id: a.id,
    name: a.name,
    imageUrl: a.images?.[0]?.url ?? null,
    genres: a.genres,
    followers: a.followers?.total ?? 0,
    popularity: a.popularity,
    externalUrl: a.external_urls?.spotify ?? "",
  };
}

function clampLimit(limit: number): number {
  return Math.min(limit, MAX_SEARCH_LIMIT);
}

async function searchTracks(query: string, limit = 10): Promise<ReturnType<typeof mapTrack>[]> {
  const params = new URLSearchParams({ q: query, type: "track", limit: String(clampLimit(limit)) });
  const data = (await spotifyFetch(`/search?${params.toString()}`)) as {
    tracks?: { items: SpotifyTrack[] };
  };
  return (data.tracks?.items ?? []).map(mapTrack);
}

async function searchAlbums(query: string, limit = 10): Promise<ReturnType<typeof mapAlbum>[]> {
  const params = new URLSearchParams({ q: query, type: "album", limit: String(clampLimit(limit)) });
  const data = (await spotifyFetch(`/search?${params.toString()}`)) as {
    albums?: { items: SpotifyAlbum[] };
  };
  return (data.albums?.items ?? []).map(mapAlbum);
}

export async function getFeaturedTracks() {
  return searchTracks("pop", 10);
}

export async function getNewReleases() {
  return searchAlbums("2025", 10);
}

export async function getCategories() {
  const genres = [
    { id: "pop", name: "Pop" },
    { id: "hip-hop", name: "Hip Hop" },
    { id: "rock", name: "Rock" },
    { id: "electronic", name: "Electronic" },
    { id: "r%26b", name: "R&B" },
    { id: "jazz", name: "Jazz" },
    { id: "classical", name: "Classical" },
    { id: "latin", name: "Latin" },
    { id: "country", name: "Country" },
    { id: "indie", name: "Indie" },
    { id: "metal", name: "Metal" },
    { id: "soul", name: "Soul" },
  ];
  return genres.map((g) => ({ id: g.id, name: g.name, iconUrl: null }));
}

export async function getRecommendations(params: {
  seed_genres?: string;
  seed_tracks?: string;
  seed_artists?: string;
}) {
  // Spotify deprecated the recommendations API in Nov 2024, use search instead
  const genre = params.seed_genres?.split(",")[0] ?? "pop";
  return searchTracks(genre, 10);
}

export async function getArtist(id: string) {
  const data = (await spotifyFetch(`/artists/${id}`)) as SpotifyArtist;
  return mapArtist(data);
}

export async function getArtistTopTracks(id: string) {
  const data = (await spotifyFetch(
    `/artists/${id}/top-tracks?market=US`
  )) as { tracks: SpotifyTrack[] };
  return data.tracks.map(mapTrack);
}

export async function getArtistAlbums(id: string) {
  const data = (await spotifyFetch(
    `/artists/${id}/albums?market=US&limit=10`
  )) as { items: SpotifyAlbum[] };
  return data.items.map(mapAlbum);
}

export async function getAlbum(id: string) {
  const data = (await spotifyFetch(`/albums/${id}`)) as SpotifyAlbum & {
    tracks: { items: SpotifyTrack[] };
    label?: string;
    copyrights?: Array<{ text: string }>;
  };
  const tracks = data.tracks.items.map((t) =>
    mapTrack({
      ...t,
      album: { id: data.id, name: data.name, images: data.images },
      popularity: 0,
    } as SpotifyTrack)
  );
  return {
    ...mapAlbum(data),
    tracks,
    label: data.label ?? null,
    copyright: data.copyrights?.[0]?.text ?? null,
  };
}

export async function getTrack(id: string) {
  const data = (await spotifyFetch(`/tracks/${id}`)) as SpotifyTrack;
  return mapTrack(data);
}

export async function searchSpotify(q: string, type: string, limit: number) {
  const params = new URLSearchParams({ q, type, limit: String(clampLimit(limit)) });
  const data = (await spotifyFetch(`/search?${params.toString()}`)) as {
    tracks?: { items: SpotifyTrack[] };
    artists?: { items: SpotifyArtist[] };
    albums?: { items: SpotifyAlbum[] };
  };
  return {
    tracks: (data.tracks?.items ?? []).map(mapTrack),
    artists: (data.artists?.items ?? []).map(mapArtist),
    albums: (data.albums?.items ?? []).map(mapAlbum),
  };
}

export async function getTrendingTracks(genre?: string) {
  if (genre) {
    return searchTracks(genre, 10);
  }
  return searchTracks("trending", 10);
}

const MOODS = [
  { mood: "energetic", label: "Energy Boost", color: "#ff6b35", query: "dance" },
  { mood: "chill", label: "Chill Vibes", color: "#4ecdc4", query: "chill" },
  { mood: "focus", label: "Deep Focus", color: "#6c63ff", query: "instrumental" },
  { mood: "happy", label: "Happy Hits", color: "#ffe66d", query: "happy" },
  { mood: "melancholy", label: "Rainy Day", color: "#a8dadc", query: "acoustic" },
  { mood: "hype", label: "Hype Beast", color: "#e63946", query: "rap" },
];

export async function getMoodPlaylists() {
  const results = await Promise.allSettled(
    MOODS.map(async (m) => {
      const tracks = await searchTracks(m.query, 6);
      return { mood: m.mood, label: m.label, color: m.color, tracks };
    })
  );
  return results
    .filter((r): r is PromiseFulfilledResult<{ mood: string; label: string; color: string; tracks: ReturnType<typeof mapTrack>[] }> => r.status === "fulfilled")
    .map((r) => r.value);
}
