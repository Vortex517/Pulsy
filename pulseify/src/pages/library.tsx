import { useGetLibrarySummary, useGetUserPlaylists } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { Heart, Clock, ListMusic, Plus, Play } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";

export default function Library() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  if (!user) {
    setLocation("/login");
    return null;
  }

  const { data: summary, isLoading: summaryLoading } = useGetLibrarySummary({
    query: { queryKey: ["/api/spotify/library/summary"] }
  });

  const { data: playlists, isLoading: playlistsLoading } = useGetUserPlaylists({
    query: { queryKey: ["/api/spotify/playlists"] }
  });

  return (
    <div className="flex flex-col gap-8 pb-12 relative z-10">
      <header className="sticky top-0 bg-background/80 backdrop-blur-xl z-20 py-4 -mx-4 px-4 md:-mx-8 md:px-8 border-b border-white/5 flex items-center justify-between">
        <h1 className="text-3xl font-bold font-display text-glow-primary">Your Library</h1>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {summaryLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl bg-white/5" />
          ))
        ) : (
          <>
            <Link href="/liked" className="group relative overflow-hidden rounded-xl p-6 glass-card hover:bg-card hover:scale-[1.02] hover:box-glow-accent transition-all cursor-pointer flex flex-col justify-end min-h-[160px]">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-transparent opacity-50" />
              <Heart className="w-8 h-8 mb-4 text-accent drop-shadow-[0_0_10px_rgba(255,0,150,0.5)]" />
              <h3 className="text-xl font-bold relative z-10">Liked Songs</h3>
              <p className="text-sm text-muted-foreground relative z-10 mt-1">{summary?.likedCount || 0} tracks</p>
            </Link>

            <Link href="/recent" className="group relative overflow-hidden rounded-xl p-6 glass-card hover:bg-card hover:scale-[1.02] hover:box-glow-primary transition-all cursor-pointer flex flex-col justify-end min-h-[160px]">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-50" />
              <Clock className="w-8 h-8 mb-4 text-primary drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]" />
              <h3 className="text-xl font-bold relative z-10">Recently Played</h3>
              <p className="text-sm text-muted-foreground relative z-10 mt-1">{summary?.recentCount || 0} tracks</p>
            </Link>

            <div className="group relative overflow-hidden rounded-xl p-6 glass-card flex flex-col justify-end min-h-[160px]">
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/20 to-transparent opacity-50" />
              <h3 className="text-xl font-bold relative z-10">Listening Time</h3>
              <p className="text-sm text-muted-foreground relative z-10 mt-1">{summary?.totalListenMinutes || 0} minutes</p>
              <div className="absolute top-6 right-6 text-3xl font-bold text-secondary/30">
                {Math.round((summary?.totalListenMinutes || 0) / 60)}h
              </div>
            </div>
          </>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Your Playlists</h2>
          <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors">
            <Plus className="w-4 h-4" /> Create Playlist
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {playlistsLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton className="aspect-square rounded-lg bg-white/5" />
                <Skeleton className="h-4 w-3/4 bg-white/5" />
                <Skeleton className="h-3 w-1/2 bg-white/5" />
              </div>
            ))
          ) : (
            playlists?.map((playlist) => (
              <Link 
                key={playlist.id} 
                href={`/playlist/${playlist.id}`}
                className="group relative flex flex-col gap-3 rounded-xl p-3 glass-card hover:bg-card transition-all duration-300 hover:scale-[1.02] hover:box-glow-primary cursor-pointer"
              >
                <div className="relative aspect-square overflow-hidden rounded-lg bg-white/5 flex items-center justify-center shadow-lg">
                  {playlist.coverUrl ? (
                    <img
                      src={playlist.coverUrl}
                      alt={playlist.name}
                      className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <ListMusic className="w-12 h-12 text-muted-foreground/50" />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                    <button className="w-12 h-12 flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transform transition-transform hover:scale-110">
                      <Play className="w-6 h-6 ml-1" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-col px-1">
                  <span className="text-base font-semibold truncate group-hover:text-primary transition-colors text-glow-primary">{playlist.name}</span>
                  <span className="text-sm text-muted-foreground truncate">{playlist.trackCount} tracks</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  );
}