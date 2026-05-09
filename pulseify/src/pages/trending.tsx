import { useGetTrendingTracks } from "@workspace/api-client-react";
import { TrackRow } from "@/components/music/track-row";
import { Skeleton } from "@/components/ui/skeleton";
import { Play } from "lucide-react";
import { usePlayer } from "@/hooks/use-player";

export default function Trending() {
  const { data: tracks, isLoading } = useGetTrendingTracks(
    {},
    { query: { queryKey: ["/api/spotify/trending-tracks"] } }
  );

  const { play } = usePlayer();

  const handlePlayAll = () => {
    if (tracks && tracks.length > 0) {
      play(tracks[0], tracks);
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-12 relative z-10">
      <header className="sticky top-0 bg-background/80 backdrop-blur-xl z-20 py-4 -mx-4 px-4 md:-mx-8 md:px-8 border-b border-white/5 flex items-center gap-6">
        <h1 className="text-3xl font-bold font-display text-glow-primary">Trending Now</h1>
        <button 
          onClick={handlePlayAll}
          disabled={!tracks || tracks.length === 0}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full font-medium box-glow-primary hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
        >
          <Play className="w-4 h-4 fill-current" />
          Play All
        </button>
      </header>

      <section className="bg-black/20 rounded-xl border border-white/5 p-4">
        <div className="hidden md:flex items-center gap-4 p-2 text-sm text-muted-foreground border-b border-white/5 mb-2 px-4">
          <div className="w-8 text-right">#</div>
          <div className="flex-1">Title</div>
          <div className="flex-1">Album</div>
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
                <Skeleton className="w-12 h-4 bg-white/5" />
              </div>
            ))
          ) : (
            tracks?.map((track, i) => (
              <TrackRow key={track.id} track={track} index={i} queue={tracks} />
            ))
          )}
        </div>
      </section>
    </div>
  );
}