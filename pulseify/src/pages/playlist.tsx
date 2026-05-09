import { useParams } from "wouter";
import { useGetPlaylist } from "@workspace/api-client-react";
import { TrackRow } from "@/components/music/track-row";
import { Skeleton } from "@/components/ui/skeleton";
import { Play, ListMusic } from "lucide-react";
import { usePlayer } from "@/hooks/use-player";

export default function PlaylistDetail() {
  const { id } = useParams<{ id: string }>();
  
  const { data: playlist, isLoading } = useGetPlaylist(
    Number(id),
    { query: { enabled: !!id && !isNaN(Number(id)), queryKey: ["/api/spotify/playlist", id] } }
  );

  const { play } = usePlayer();

  const handlePlayAll = () => {
    if (playlist && playlist.tracks && playlist.tracks.length > 0) {
      const playerTracks = playlist.tracks.map(t => ({
        id: t.trackId,
        name: t.trackName,
        artistName: t.artistName,
        artistId: "", 
        albumName: t.albumName,
        albumId: "", 
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

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8 pb-12">
        <header className="flex flex-col md:flex-row items-end gap-6 pt-12 pb-6">
          <Skeleton className="w-48 h-48 md:w-64 md:h-64 rounded-xl" />
          <div className="flex flex-col gap-4 flex-1 w-full">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-16 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
          </div>
        </header>
      </div>
    );
  }

  if (!playlist) return null;

  return (
    <div className="flex flex-col gap-8 pb-12 relative z-10">
      <header className="flex flex-col md:flex-row items-end gap-6 pt-12 pb-6">
        <div className="w-48 h-48 md:w-64 md:h-64 shadow-2xl rounded-xl overflow-hidden box-glow-primary bg-white/5 flex items-center justify-center">
          {playlist.coverUrl ? (
            <img src={playlist.coverUrl} alt={playlist.name} className="w-full h-full object-cover" />
          ) : (
            <ListMusic className="w-24 h-24 text-muted-foreground/50" />
          )}
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium uppercase tracking-wider text-muted-foreground">{playlist.isPublic ? "Public Playlist" : "Private Playlist"}</span>
          <h1 className="text-4xl md:text-6xl font-bold font-display text-glow-primary">{playlist.name}</h1>
          {playlist.description && (
            <p className="text-muted-foreground mt-2">{playlist.description}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-muted-foreground">{playlist.trackCount} songs</span>
          </div>
        </div>
      </header>

      <div className="flex items-center gap-4 py-4 sticky top-0 bg-background/90 backdrop-blur-xl z-20 border-b border-white/5 -mx-4 px-4 md:-mx-8 md:px-8">
        <button 
          onClick={handlePlayAll}
          disabled={!playlist.tracks || playlist.tracks.length === 0}
          className="w-14 h-14 flex items-center justify-center rounded-full bg-primary text-primary-foreground hover:scale-105 transition-transform shadow-[0_0_20px_hsla(var(--primary)/0.5)] disabled:opacity-50 disabled:hover:scale-100"
        >
          <Play className="w-6 h-6 fill-current ml-1" />
        </button>
      </div>

      <section className="bg-black/20 rounded-xl border border-white/5 p-4 mt-4">
        <div className="hidden md:flex items-center gap-4 p-2 text-sm text-muted-foreground border-b border-white/5 mb-2 px-4">
          <div className="w-8 text-right">#</div>
          <div className="flex-1">Title</div>
          <div className="flex-1">Album</div>
          <div className="flex-1">Added At</div>
          <div className="w-24 flex justify-end pr-8">Duration</div>
        </div>

        <div className="flex flex-col">
          {playlist.tracks?.map((track, i) => {
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
                  {new Date(track.addedAt).toLocaleDateString()}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}