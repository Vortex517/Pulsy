import { useGetLikedTracks } from "@workspace/api-client-react";
import { TrackRow } from "@/components/music/track-row";
import { Skeleton } from "@/components/ui/skeleton";
import { Play, Heart } from "lucide-react";
import { usePlayer } from "@/hooks/use-player";

export default function LikedSongs() {
  const { data: tracks, isLoading } = useGetLikedTracks({
    query: { queryKey: ["/api/spotify/liked-tracks"] }
  });

  const { play } = usePlayer();

  const handlePlayAll = () => {
    if (tracks && tracks.length > 0) {
      // Map LikedTrack to Track for the player
      const playerTracks = tracks.map(t => ({
        id: t.trackId,
        name: t.trackName,
        artistName: t.artistName,
        artistId: "", // Missing from LikedTrack
        albumName: t.albumName,
        albumId: "", // Missing from LikedTrack
        coverUrl: t.coverUrl,
        previewUrl: t.previewUrl,
        durationMs: t.durationMs,
        popularity: 0,
        explicit: false,
        externalUrl: ""
      }));
      play(playerTracks[0], playerTracks);
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-12 relative z-10">
      <header className="flex flex-col md:flex-row items-end gap-6 pt-12 pb-6">
        <div className="w-48 h-48 md:w-64 md:h-64 shadow-2xl rounded-2xl flex items-center justify-center bg-gradient-to-br from-accent/80 to-accent/20 border border-white/20 box-glow-accent">
          <Heart className="w-24 h-24 text-white drop-shadow-lg" />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Playlist</span>
          <h1 className="text-5xl md:text-7xl font-bold font-display text-glow-accent">Liked Songs</h1>
          <p className="text-muted-foreground mt-2">{tracks?.length || 0} songs</p>
        </div>
      </header>

      <div className="flex items-center gap-4 py-4 sticky top-0 bg-background/90 backdrop-blur-xl z-20 border-b border-white/5 -mx-4 px-4 md:-mx-8 md:px-8">
        <button 
          onClick={handlePlayAll}
          disabled={!tracks || tracks.length === 0}
          className="w-14 h-14 flex items-center justify-center rounded-full bg-accent text-accent-foreground hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,0,150,0.5)] disabled:opacity-50 disabled:hover:scale-100"
        >
          <Play className="w-6 h-6 fill-current ml-1" />
        </button>
      </div>

      <section className="bg-black/20 rounded-xl border border-white/5 p-4">
        <div className="hidden md:flex items-center gap-4 p-2 text-sm text-muted-foreground border-b border-white/5 mb-2 px-4">
          <div className="w-8 text-right">#</div>
          <div className="flex-1">Title</div>
          <div className="flex-1">Album</div>
          <div className="flex-1">Date Added</div>
          <div className="w-24 flex justify-end pr-8">Duration</div>
        </div>

        <div className="flex flex-col">
          {isLoading ? (
            Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-2">
                <Skeleton className="w-8 h-4 bg-white/5" />
                <Skeleton className="w-10 h-10 rounded-sm bg-white/5" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3 bg-white/5" />
                  <Skeleton className="h-3 w-1/4 bg-white/5" />
                </div>
                <Skeleton className="w-1/4 h-4 bg-white/5 hidden md:block" />
                <Skeleton className="w-24 h-4 bg-white/5 hidden md:block" />
                <Skeleton className="w-12 h-4 bg-white/5" />
              </div>
            ))
          ) : tracks?.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground flex flex-col items-center">
              <Heart className="w-16 h-16 mb-4 opacity-20" />
              <p>Songs you like will appear here</p>
            </div>
          ) : (
            tracks?.map((track, i) => {
              const mappedTrack = {
                id: track.trackId,
                name: track.trackName,
                artistName: track.artistName,
                artistId: "",
                albumName: track.albumName,
                albumId: "",
                coverUrl: track.coverUrl,
                previewUrl: track.previewUrl,
                durationMs: track.durationMs,
                popularity: 0,
                explicit: false,
                externalUrl: ""
              };
              
              return (
                <div key={track.id} className="relative">
                  <TrackRow track={mappedTrack} index={i} queue={[mappedTrack]} />
                  <div className="hidden md:block absolute top-1/2 -translate-y-1/2 right-1/4 text-sm text-muted-foreground mr-12 pointer-events-none">
                    {new Date(track.likedAt).toLocaleDateString()}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}