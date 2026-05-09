import { useParams } from "wouter";
import { useGetAlbum } from "@workspace/api-client-react";
import { TrackRow } from "@/components/music/track-row";
import { Skeleton } from "@/components/ui/skeleton";
import { Play } from "lucide-react";
import { usePlayer } from "@/hooks/use-player";

export default function AlbumDetail() {
  const { id } = useParams<{ id: string }>();
  
  const { data: album, isLoading } = useGetAlbum(
    id,
    { query: { enabled: !!id, queryKey: ["/api/spotify/album", id] } }
  );

  const { play } = usePlayer();

  const handlePlayAll = () => {
    if (album && album.tracks && album.tracks.length > 0) {
      play(album.tracks[0], album.tracks);
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

  if (!album) return null;

  return (
    <div className="flex flex-col gap-8 pb-12 relative z-10">
      <header className="flex flex-col md:flex-row items-end gap-6 pt-12 pb-6">
        <div className="w-48 h-48 md:w-64 md:h-64 shadow-2xl rounded-xl overflow-hidden box-glow-secondary">
          <img src={album.coverUrl} alt={album.name} className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium uppercase tracking-wider text-muted-foreground">{album.albumType}</span>
          <h1 className="text-4xl md:text-6xl font-bold font-display text-glow-secondary">{album.name}</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="font-bold hover:underline cursor-pointer">{album.artistName}</span>
            <span className="text-muted-foreground">• {new Date(album.releaseDate).getFullYear()}</span>
            <span className="text-muted-foreground">• {album.totalTracks} songs</span>
          </div>
        </div>
      </header>

      <div className="flex items-center gap-4 py-4 sticky top-0 bg-background/90 backdrop-blur-xl z-20 border-b border-white/5 -mx-4 px-4 md:-mx-8 md:px-8">
        <button 
          onClick={handlePlayAll}
          disabled={!album.tracks || album.tracks.length === 0}
          className="w-14 h-14 flex items-center justify-center rounded-full bg-secondary text-secondary-foreground hover:scale-105 transition-transform shadow-[0_0_20px_hsla(var(--secondary)/0.5)] disabled:opacity-50 disabled:hover:scale-100"
        >
          <Play className="w-6 h-6 fill-current ml-1" />
        </button>
      </div>

      <section className="bg-black/20 rounded-xl border border-white/5 p-4 mt-4">
        <div className="hidden md:flex items-center gap-4 p-2 text-sm text-muted-foreground border-b border-white/5 mb-2 px-4">
          <div className="w-8 text-right">#</div>
          <div className="flex-1">Title</div>
          <div className="w-24 flex justify-end pr-8">Duration</div>
        </div>

        <div className="flex flex-col">
          {album.tracks?.map((track, i) => (
            <TrackRow key={track.id} track={track} index={i} queue={album.tracks} />
          ))}
        </div>
        
        <div className="mt-8 text-sm text-muted-foreground/60 px-4">
          <p>{album.copyright}</p>
          <p>{album.label && `Released by ${album.label}`}</p>
        </div>
      </section>
    </div>
  );
}