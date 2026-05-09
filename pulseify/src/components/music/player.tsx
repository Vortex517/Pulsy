import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1,
  Volume2, VolumeX, Heart, ChevronDown, ListMusic, Loader2,
  Plus, Radio
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { usePlayer } from "@/hooks/use-player";
import { useLikeTrack, useUnlikeTrack, useGetLikedTracks } from "@workspace/api-client-react";
import { Slider } from "@/components/ui/slider";

function formatTime(seconds: number) {
  if (!seconds || isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function RepeatIcon({ mode }: { mode: "off" | "one" | "all" }) {
  if (mode === "one") return <Repeat1 className="w-4 h-4" />;
  return <Repeat className="w-4 h-4" />;
}

export function Player() {
  const {
    currentTrack, queue, isPlaying, isLoading, progress, duration,
    volume, isMuted, shuffle, repeatMode,
    pause, resume, next, previous, seek, setVolume, toggleMute,
    toggleShuffle, cycleRepeat, addToQueue, removeFromQueue, playFromQueue,
  } = usePlayer();

  const [showQueue, setShowQueue] = useState(false);
  const [location] = useLocation();
  const isNowPlaying = location === "/now-playing";

  const { data: likedTracks } = useGetLikedTracks({ query: { queryKey: ["/api/library/liked"] } });
  const isLiked = currentTrack ? (likedTracks?.some((t) => t.trackId === currentTrack.id) ?? false) : false;

  const likeMutation = useLikeTrack();
  const unlikeMutation = useUnlikeTrack();

  const handleLike = () => {
    if (!currentTrack) return;
    if (isLiked) {
      unlikeMutation.mutate({ trackId: currentTrack.id });
    } else {
      likeMutation.mutate({
        trackId: currentTrack.id,
        data: {
          trackName: currentTrack.name,
          artistName: currentTrack.artistName,
          albumName: currentTrack.albumName,
          coverUrl: currentTrack.coverUrl,
          durationMs: currentTrack.durationMs,
          previewUrl: currentTrack.previewUrl,
        },
      });
    }
  };

  if (!currentTrack) return null;

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <>
      {/* Mini Player Bar */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed bottom-0 left-0 right-0 z-50 select-none"
      >
        {/* Slim progress bar at very top of player */}
        <div className="h-0.5 bg-white/5 w-full">
          <div
            className="h-full bg-primary transition-all duration-1000"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="glass border-t border-white/10 backdrop-blur-2xl px-4 py-2 flex items-center gap-4">
          {/* Track info */}
          <Link href="/now-playing" className="flex items-center gap-3 w-[30%] min-w-0 group cursor-pointer">
            <div className="relative flex-shrink-0">
              <motion.img
                src={currentTrack.coverUrl}
                alt={currentTrack.name}
                className="w-12 h-12 rounded-md object-cover shadow-lg"
                animate={{ rotate: isPlaying ? 360 : 0 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear", repeatType: "loop" }}
                style={{ borderRadius: "6px" }}
              />
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-md">
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                </div>
              )}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                {currentTrack.name}
              </span>
              <span className="text-xs text-muted-foreground truncate">{currentTrack.artistName}</span>
            </div>
            <button
              onClick={(e) => { e.preventDefault(); handleLike(); }}
              className={`flex-shrink-0 transition-colors ${isLiked ? "text-primary" : "text-muted-foreground hover:text-white"}`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
            </button>
          </Link>

          {/* Center controls */}
          <div className="flex-1 flex flex-col items-center gap-1 max-w-xl">
            <div className="flex items-center gap-5">
              <button
                onClick={toggleShuffle}
                className={`transition-colors ${shuffle ? "text-primary" : "text-muted-foreground hover:text-white"}`}
              >
                <Shuffle className="w-4 h-4" />
              </button>
              <button onClick={previous} className="text-muted-foreground hover:text-white transition-colors">
                <SkipBack className="w-5 h-5 fill-current" />
              </button>
              <button
                onClick={isPlaying ? pause : resume}
                disabled={isLoading}
                className="w-9 h-9 flex items-center justify-center bg-white text-black rounded-full hover:scale-105 transition-transform disabled:opacity-60 shadow-lg"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                )}
              </button>
              <button onClick={next} className="text-muted-foreground hover:text-white transition-colors">
                <SkipForward className="w-5 h-5 fill-current" />
              </button>
              <button
                onClick={cycleRepeat}
                className={`transition-colors ${repeatMode !== "off" ? "text-primary" : "text-muted-foreground hover:text-white"}`}
              >
                <RepeatIcon mode={repeatMode} />
              </button>
            </div>

            <div className="flex items-center w-full gap-2 text-[11px] font-mono text-muted-foreground">
              <span className="w-8 text-right">{formatTime(progress)}</span>
              <Slider
                value={[progress]}
                max={duration || 100}
                step={1}
                onValueChange={([val]) => seek(val)}
                className="flex-1 cursor-pointer h-1 [&_[role=slider]]:w-3 [&_[role=slider]]:h-3 [&_[role=slider]]:bg-primary [&_[role=slider]]:opacity-0 hover:[&_[role=slider]]:opacity-100 [&_.bg-primary]:bg-primary"
              />
              <span className="w-8">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right controls */}
          <div className="hidden md:flex items-center gap-3 w-[30%] justify-end">
            <button
              onClick={() => setShowQueue((v) => !v)}
              className={`transition-colors ${showQueue ? "text-primary" : "text-muted-foreground hover:text-white"}`}
            >
              <ListMusic className="w-4 h-4" />
            </button>
            <button onClick={toggleMute} className="text-muted-foreground hover:text-white transition-colors">
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <div className="w-24">
              <Slider
                value={[isMuted ? 0 : volume * 100]}
                max={100}
                step={1}
                onValueChange={([val]) => setVolume(val / 100)}
                className="cursor-pointer [&_[role=slider]]:bg-white [&_[role=slider]]:w-3 [&_[role=slider]]:h-3"
              />
            </div>
            {!isNowPlaying && (
              <Link href="/now-playing" className="text-muted-foreground hover:text-white transition-colors">
                <Radio className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </motion.div>

      {/* Queue Panel */}
      <AnimatePresence>
        {showQueue && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed right-4 bottom-20 z-40 w-80 max-h-[60vh] glass border border-white/10 rounded-xl overflow-hidden flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="font-semibold text-sm">Queue</h3>
              <span className="text-xs text-muted-foreground">{queue.length} tracks</span>
            </div>
            <div className="flex-1 overflow-y-auto">
              {queue.map((track, i) => (
                <div
                  key={`${track.id}-${i}`}
                  className={`flex items-center gap-3 px-4 py-2 hover:bg-white/5 group cursor-pointer ${track.id === currentTrack.id ? "bg-primary/10" : ""}`}
                  onClick={() => playFromQueue(i)}
                >
                  <img src={track.coverUrl} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium truncate ${track.id === currentTrack.id ? "text-primary" : ""}`}>
                      {track.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{track.artistName}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFromQueue(i); }}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-white transition-all"
                  >
                    ×
                  </button>
                </div>
              ))}
              {queue.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">Queue is empty</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
