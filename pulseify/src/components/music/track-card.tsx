import { motion } from "framer-motion";
import { Play, Heart } from "lucide-react";
import type { Track } from "@workspace/api-client-react";
import { usePlayer } from "@/hooks/use-player";
import { useLikeTrack, useUnlikeTrack, useGetLikedTracks } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface TrackCardProps {
  track: Track;
  index?: number;
}

export function TrackCard({ track, index = 0 }: TrackCardProps) {
  const { play, currentTrack, isPlaying, pause } = usePlayer();
  const { toast } = useToast();
  
  const { data: likedTracks } = useGetLikedTracks({ query: { queryKey: ["/api/spotify/liked-tracks"] } });
  const isLiked = likedTracks?.some(t => t.trackId === track.id) || false;

  const likeMutation = useLikeTrack();
  const unlikeMutation = useUnlikeTrack();

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    if (currentTrack?.id === track.id && isPlaying) {
      pause();
    } else {
      play(track);
    }
  };

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLiked) {
      unlikeMutation.mutate(
        { trackId: track.id },
        {
          onSuccess: () => {
            toast({ description: "Removed from Liked Songs" });
          }
        }
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
        {
          onSuccess: () => {
            toast({ description: "Added to Liked Songs" });
          }
        }
      );
    }
  };

  const isCurrent = currentTrack?.id === track.id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="group relative flex flex-col gap-3 rounded-xl p-3 glass-card hover:bg-card transition-all duration-300 hover:scale-[1.02] hover:box-glow-primary cursor-pointer"
    >
      <div className="relative aspect-square overflow-hidden rounded-lg">
        <img
          src={track.coverUrl}
          alt={track.name}
          className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
        />
        <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 ${isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <button
            onClick={handlePlay}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transform transition-transform hover:scale-110"
          >
            {isCurrent && isPlaying ? <div className="w-4 h-4 bg-primary-foreground" /> : <Play className="w-6 h-6 ml-1" />}
          </button>
        </div>
      </div>
      <div className="flex flex-col px-1">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/album/${track.albumId}`} className="text-base font-semibold truncate hover:text-primary transition-colors text-glow-primary">
            {track.name}
          </Link>
          <button onClick={handleLike} className={`mt-1 transition-colors ${isLiked ? 'text-primary' : 'text-muted-foreground hover:text-white'}`}>
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
          </button>
        </div>
        <Link href={`/artist/${track.artistId}`} className="text-sm text-muted-foreground truncate hover:text-white transition-colors">
          {track.artistName}
        </Link>
      </div>
    </motion.div>
  );
}