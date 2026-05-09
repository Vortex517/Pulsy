import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Search as SearchIcon, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useSearchSpotify } from "@workspace/api-client-react";
import { TrackRow } from "@/components/music/track-row";
import { ArtistCard } from "@/components/music/artist-card";
import { AlbumCard } from "@/components/music/album-card";

export default function Search() {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialQuery = searchParams.get("q") || "";
  
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      if (query.trim()) {
        const newUrl = `/search?q=${encodeURIComponent(query)}`;
        if (location !== newUrl) {
          setLocation(newUrl, { replace: true });
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query, setLocation, location]);

  const { data: results, isLoading } = useSearchSpotify(
    { q: debouncedQuery, type: "track,artist,album", limit: 6 },
    { query: { enabled: debouncedQuery.trim().length > 0, queryKey: ["/api/spotify/search", debouncedQuery] } }
  );

  return (
    <div className="flex flex-col gap-8 pb-12 relative z-10">
      <header className="sticky top-0 bg-background/80 backdrop-blur-xl z-20 py-4 -mx-4 px-4 md:-mx-8 md:px-8 border-b border-white/5">
        <div className="relative w-full max-w-2xl mx-auto">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for tracks, artists, or albums..." 
            className="pl-12 bg-black/40 border-white/10 focus-visible:ring-primary h-14 rounded-full text-lg shadow-lg"
            autoFocus
          />
          {isLoading && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary animate-spin" />
          )}
        </div>
      </header>

      {!debouncedQuery ? (
        <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
          <SearchIcon className="w-16 h-16 mb-4 text-muted-foreground" />
          <h2 className="text-xl font-medium">Search Pulseify</h2>
          <p className="text-sm text-muted-foreground mt-2">Find your favorite songs, artists, and albums.</p>
        </div>
      ) : isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : results ? (
        <div className="flex flex-col gap-12">
          {results.tracks && results.tracks.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-4 text-glow-primary">Top Songs</h2>
              <div className="bg-black/20 rounded-xl border border-white/5 p-2 flex flex-col">
                {results.tracks.map((track, i) => (
                  <TrackRow key={track.id} track={track} index={i} queue={results.tracks} />
                ))}
              </div>
            </section>
          )}

          {results.artists && results.artists.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-4 text-glow-accent">Artists</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {results.artists.map((artist, i) => (
                  <ArtistCard key={artist.id} artist={artist} index={i} />
                ))}
              </div>
            </section>
          )}

          {results.albums && results.albums.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-4 text-glow-secondary">Albums</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {results.albums.map((album, i) => (
                  <AlbumCard key={album.id} album={album} index={i} />
                ))}
              </div>
            </section>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
          <p className="text-lg">No results found for "{debouncedQuery}"</p>
        </div>
      )}
    </div>
  );
}