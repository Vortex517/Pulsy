import { useState } from "react";
import { useLocation } from "wouter";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useGetHomeStats, useGetFeaturedTracks } from "@workspace/api-client-react";
import { TrackCard } from "@/components/music/track-card";
import { AlbumCard } from "@/components/music/album-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";

export default function Home() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  
  const { data: stats, isLoading: statsLoading } = useGetHomeStats({
    query: { queryKey: ["/api/spotify/home-stats"] }
  });
  
  const { data: featured, isLoading: featuredLoading } = useGetFeaturedTracks({
    query: { queryKey: ["/api/spotify/featured-tracks"] }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="flex flex-col gap-8 pb-12 relative z-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sticky top-0 bg-background/80 backdrop-blur-xl z-20 py-4 -mx-4 px-4 md:-mx-8 md:px-8 border-b border-white/5">
        <h1 className="text-3xl font-bold font-display text-glow-primary">
          {greeting()}{user ? `, ${user.displayName}` : ""}
        </h1>
        
        <form onSubmit={handleSearch} className="relative w-full md:w-72 lg:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="What do you want to listen to?" 
            className="pl-10 bg-black/40 border-white/10 focus-visible:ring-primary h-10 rounded-full"
          />
        </form>
      </header>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Featured Tracks</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {featuredLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton className="aspect-square rounded-lg bg-white/5" />
                <Skeleton className="h-4 w-3/4 bg-white/5" />
                <Skeleton className="h-3 w-1/2 bg-white/5" />
              </div>
            ))
          ) : (
            featured?.slice(0, 6).map((track, i) => (
              <TrackCard key={track.id} track={track} index={i} />
            ))
          )}
        </div>
      </section>

      {stats?.newReleases && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-glow-secondary">New Releases</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {stats.newReleases.slice(0, 6).map((album, i) => (
              <AlbumCard key={album.id} album={album} index={i} />
            ))}
          </div>
        </section>
      )}

      {stats?.moodPlaylists && (
        <section>
          <h2 className="text-2xl font-bold mb-4 text-glow-accent">Moods</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.moodPlaylists.map((mood, i) => (
              <div 
                key={mood.mood} 
                className="relative overflow-hidden rounded-xl aspect-[2/1] p-4 cursor-pointer hover:scale-[1.02] transition-transform group"
                style={{ backgroundColor: mood.color }}
              >
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                <h3 className="relative z-10 text-xl font-bold text-white drop-shadow-md">{mood.label}</h3>
                {mood.tracks[0] && (
                  <img 
                    src={mood.tracks[0].coverUrl} 
                    className="absolute -right-4 -bottom-4 w-24 h-24 rotate-[25deg] shadow-2xl rounded-md"
                    alt="" 
                  />
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}