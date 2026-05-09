import { useParams } from "wouter";
import { useGetArtist, useGetArtistTopTracks, useGetArtistAlbums } from "@workspace/api-client-react";
import { TrackRow } from "@/components/music/track-row";
import { AlbumCard } from "@/components/music/album-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Play } from "lucide-react";
import { usePlayer } from "@/hooks/use-player";

export default function ArtistDetail() {
  const { id } = useParams<{ id: string }>();
  
  const { data: artist, isLoading: artistLoading } = useGetArtist(
    id,
    { query: { enabled: !!id, queryKey: ["/api/spotify/artist", id] } }
  );

  const { data: topTracks, isLoading: tracksLoading } = useGetArtistTopTracks(
    id,
    { query: { enabled: !!id, queryKey: ["/api/spotify/artist", id, "top-tracks"] } }
  );

  const { data: albums, isLoading: albumsLoading } = useGetArtistAlbums(
    id,
    { query: { enabled: !!id, queryKey: ["/api/spotify/artist", id, "albums"] } }
  );

  const { play } = usePlayer();

  const handlePlayAll = () => {
    if (topTracks && topTracks.length > 0) {
      play(topTracks[0], topTracks);
    }
  };

  if (artistLoading) {
    return (
      <div className="flex flex-col gap-8 pb-12">
        <header className="flex flex-col items-center justify-center gap-6 pt-12 pb-6">
          <Skeleton className="w-48 h-48 md:w-64 md:h-64 rounded-full" />
          <Skeleton className="h-16 w-3/4 max-w-lg" />
        </header>
      </div>
    );
  }

  if (!artist) return null;

  return (
    <div className="flex flex-col gap-8 pb-12 relative z-10">
      <header className="relative flex flex-col items-center justify-center pt-24 pb-12 -mx-4 px-4 md:-mx-8 md:px-8 border-b border-white/5 overflow-hidden">
        {/* Background Blur */}
        <div 
          className="absolute inset-0 opacity-20 blur-[80px] pointer-events-none scale-110 transform-gpu z-[-1]"
          style={{ backgroundImage: `url(${artist.imageUrl})`, backgroundPosition: 'center', backgroundSize: 'cover' }}
        />
        
        <div className="w-48 h-48 md:w-64 md:h-64 shadow-2xl rounded-full overflow-hidden box-glow-accent mb-6 border-4 border-background">
          {artist.imageUrl ? (
            <img src={artist.imageUrl} alt={artist.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-accent/20 flex items-center justify-center text-accent text-6xl font-bold">
              {artist.name.charAt(0)}
            </div>
          )}
        </div>
        <h1 className="text-5xl md:text-7xl font-bold font-display text-glow-accent text-center">{artist.name}</h1>
        <p className="text-muted-foreground mt-4 text-lg">
          {new Intl.NumberFormat('en-US').format(artist.followers)} followers
        </p>
      </header>

      <div className="flex items-center justify-center gap-4 py-4">
        <button 
          onClick={handlePlayAll}
          disabled={!topTracks || topTracks.length === 0}
          className="w-16 h-16 flex items-center justify-center rounded-full bg-accent text-accent-foreground hover:scale-105 transition-transform shadow-[0_0_20px_hsla(var(--accent)/0.5)] disabled:opacity-50 disabled:hover:scale-100"
        >
          <Play className="w-8 h-8 fill-current ml-1" />
        </button>
        <button className="px-6 py-2 rounded-full border border-white/20 hover:border-white text-sm font-medium transition-colors">
          Follow
        </button>
      </div>

      <section>
        <h2 className="text-2xl font-bold mb-4">Popular Tracks</h2>
        <div className="bg-black/20 rounded-xl border border-white/5 p-4 flex flex-col">
          {tracksLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full mb-2 bg-white/5" />
            ))
          ) : (
            topTracks?.map((track, i) => (
              <TrackRow key={track.id} track={track} index={i} queue={topTracks} />
            ))
          )}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Discography</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {albumsLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton className="aspect-square rounded-lg bg-white/5" />
                <Skeleton className="h-4 w-3/4 bg-white/5" />
                <Skeleton className="h-3 w-1/2 bg-white/5" />
              </div>
            ))
          ) : (
            albums?.map((album, i) => (
              <AlbumCard key={album.id} album={album} index={i} />
            ))
          )}
        </div>
      </section>
    </div>
  );
}