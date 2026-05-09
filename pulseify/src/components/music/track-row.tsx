import { Play, Heart, MoreHorizontal } from "lucide-react";
import type { Track } from "@workspace/api-client-react";
import { usePlayer } from "@/hooks/use-player";
import { useLikeTrack, useUnlikeTrack, useGetLikedTracks } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface TrackRowProps {
  track: Track;
  index: number;
  queue?: Track[];
}

function formatDuration(ms: number) {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function TrackRow({ track, index, queue }: TrackRowProps) {
  const { play, currentTrack, isPlaying, pause } = usePlayer();
  const { toast } = useToast();
  
  const { data: likedTracks } = useGetLikedTracks({ query: { queryKey: ["/api/spotify/liked-tracks"] } });
  const isLiked = likedTracks?.some(t => t.trackId === track.id) || false;

  const likeMutation = useLikeTrack();
  const unlikeMutation = useUnlikeTrack();

  const isCurrent = currentTrack?.id === track.id;

  const handlePlay = () => {
    if (isCurrent && isPlaying) {
      pause();
    } else {
      play(track, queue);
    }
  };

  const handleLike = () => {
    if (isLiked) {
      unlikeMutation.mutate(
        { trackId: track.id },
        { onSuccess: () => toast({ description: "Removed from Liked Songs" }) }
      );
    } else {
      likeMutation.mutate(
        {
          trackId: track.id,
          data: {
            trackName: track.name,
            artistName: track.artistName,
            albumName: track.albumName,
            coverUrl: track.coverUrl,
            durationMs: track.durationMs,
            previewUrl: track.previewUrl
          }
        },
        { onSuccess: () => toast({ description: "Added to Liked Songs" }) }
      );
    }
  };

  return (
    <div className={`group flex items-center gap-4 p-2 rounded-md hover:bg-white/10 transition-colors ${isCurrent ? 'bg-white/5' : ''}`}>
      <div className="w-8 flex justify-end items-center relative">
        <span className={`text-muted-foreground font-mono text-sm ${isCurrent ? 'hidden' : 'group-hover:hidden'}`}>
          {index + 1}
        </span>
        <button 
          onClick={handlePlay}
          className={`absolute right-0 text-white ${isCurrent ? 'block text-primary' : 'hidden group-hover:block'}`}
        >
          {isCurrent && isPlaying ? (
            <div className="flex gap-[2px] items-center h-4">
              <div className="w-1 bg-primary h-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-1 bg-primary h-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-1 bg-primary h-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          ) : (
            <Play className="w-4 h-4 fill-current" />
          )}
        </button>
      </div>

      <div className="flex items-center gap-3 flex-1 min-w-0">
        <img src={track.coverUrl} alt={track.name} className="w-10 h-10 rounded-sm object-cover" />
        <div className="flex flex-col min-w-0">
          <span className={`text-sm font-medium truncate ${isCurrent ? 'text-primary' : 'text-white'}`}>
            {track.name}
          </span>
          <Link href={`/artist/${track.artistId}`} className="text-xs text-muted-foreground hover:text-white hover:underline truncate">
            {track.artistName}
          </Link>
        </div>
      </div>

      <div className="hidden md:flex flex-1 min-w-0 items-center text-sm text-muted-foreground truncate hover:text-white">
        <Link href={`/album/${track.albumId}`} className="hover:underline truncate">
          {track.albumName}
        </Link>
      </div>

      <div className="flex items-center gap-4 text-muted-foreground text-sm font-mono pr-2">
        <button onClick={handleLike} className={`opacity-0 group-hover:opacity-100 transition-opacity ${isLiked ? 'opacity-100 text-primary' : 'hover:text-white'}`}>
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
        </button>
        <span>{formatDuration(track.durationMs)}</span>
        <button className="opacity-0 group-hover:opacity-100 hover:text-white transition-opacity">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}