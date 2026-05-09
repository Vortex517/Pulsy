import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1,
  Volume2, VolumeX, Heart, ChevronDown, ListMusic, Plus,
  Loader2, Music2, ExternalLink, MicVocal
} from "lucide-react";
import { Link } from "wouter";
import { usePlayer, type RepeatMode } from "@/hooks/use-player";
import { useLikeTrack, useUnlikeTrack, useGetLikedTracks, useGetRecommendations } from "@workspace/api-client-react";
import { Slider } from "@/components/ui/slider";

function formatTime(seconds: number) {
  if (!seconds || isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function RepeatIcon({ mode }: { mode: RepeatMode }) {
  if (mode === "one") return <Repeat1 className="w-5 h-5" />;
  return <Repeat className="w-5 h-5" />;
}

function AudioVisualizer({ isPlaying, audioRef }: { isPlaying: boolean; audioRef: React.RefObject<HTMLAudioElement | null> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !canvasRef.current) return;

    const setupAnalyser = () => {
      if (analyserRef.current) return;
      try {
        const audioCtx = new AudioContext();
        ctxRef.current = audioCtx;
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 128;
        analyserRef.current = analyser;
        const source = audioCtx.createMediaElementSource(audio);
        sourceRef.current = source;
        source.connect(analyser);
        analyser.connect(audioCtx.destination);
      } catch {}
    };

    const draw = () => {
      const canvas = canvasRef.current;
      const analyser = analyserRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      ctx.clearRect(0, 0, W, H);

      if (analyser && isPlaying) {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        const barWidth = (W / bufferLength) * 2.5;
        let x = 0;
        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * H;
          const gradient = ctx.createLinearGradient(0, H - barHeight, 0, H);
          gradient.addColorStop(0, "rgba(0, 210, 200, 0.9)");
          gradient.addColorStop(1, "rgba(180, 0, 255, 0.3)");
          ctx.fillStyle = gradient;
          ctx.fillRect(x, H - barHeight, barWidth - 1, barHeight);
          x += barWidth;
        }
      } else {
        const bars = 32;
        const barWidth = W / bars - 1;
        for (let i = 0; i < bars; i++) {
          const barHeight = 4 + Math.sin(Date.now() / 1000 + i * 0.3) * 3;
          ctx.fillStyle = "rgba(0, 210, 200, 0.2)";
          ctx.fillRect(i * (barWidth + 1), H - barHeight, barWidth, barHeight);
        }
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    if (isPlaying) {
      setupAnalyser();
      if (ctxRef.current?.state === "suspended") {
        ctxRef.current.resume().catch(() => {});
      }
    }

    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isPlaying, audioRef]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ display: "block" }}
    />
  );
}

export default function NowPlaying() {
  const {
    currentTrack, queue, isPlaying, isLoading, progress, duration,
    volume, isMuted, shuffle, repeatMode, audioRef,
    pause, resume, next, previous, seek, setVolume, toggleMute,
    toggleShuffle, cycleRepeat, addToQueue, playFromQueue, removeFromQueue,
  } = usePlayer();

  const [activeTab, setActiveTab] = useState<"lyrics" | "queue" | "related">("queue");
  const [dominantColor, setDominantColor] = useState("#0a0a0f");

  const { data: likedTracks } = useGetLikedTracks({ query: { queryKey: ["/api/library/liked"] } });
  const isLiked = currentTrack ? (likedTracks?.some((t) => t.trackId === currentTrack.id) ?? false) : false;
  const likeMutation = useLikeTrack();
  const unlikeMutation = useUnlikeTrack();

  const { data: related } = useGetRecommendations(
    { seed_genres: "pop" },
    { query: { enabled: !!currentTrack, queryKey: ["/api/spotify/recommendations", "now-playing"] } }
  );

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

  if (!currentTrack) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 text-center py-24">
        <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center">
          <Music2 className="w-12 h-12 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-2">Nothing playing</h2>
          <p className="text-muted-foreground">Pick a song to start listening</p>
        </div>
        <Link href="/" className="px-6 py-2 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-colors">
          Browse Music
        </Link>
      </div>
    );
  }

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-full pb-8 relative z-10">
      {/* Blurred dynamic background */}
      <div
        className="fixed inset-0 opacity-20 pointer-events-none transition-all duration-2000"
        style={{
          backgroundImage: `url(${currentTrack.coverUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(80px) saturate(2)",
          transform: "scale(1.3)",
        }}
      />
      <div className="fixed inset-0 bg-background/70 pointer-events-none" />

      {/* Left panel — Album art + controls */}
      <div className="flex flex-col items-center gap-6 lg:w-[420px] flex-shrink-0 relative z-10">
        {/* Spinning album art */}
        <div className="relative w-full max-w-[340px] aspect-square">
          <div
            className="absolute inset-0 rounded-full opacity-40 blur-2xl scale-90"
            style={{ background: `radial-gradient(circle, ${dominantColor} 0%, transparent 70%)` }}
          />
          <motion.div
            className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl"
            style={{ boxShadow: `0 0 60px ${dominantColor}40, 0 0 120px ${dominantColor}20` }}
            animate={{ rotateY: isPlaying ? [0, 1, 0, -1, 0] : 0 }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <motion.img
              key={currentTrack.id}
              src={currentTrack.coverUrl}
              alt={currentTrack.name}
              className="w-full h-full object-cover"
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              onLoad={(e) => {
                const img = e.currentTarget;
                const canvas = document.createElement("canvas");
                canvas.width = 1; canvas.height = 1;
                const ctx = canvas.getContext("2d");
                if (ctx) {
                  ctx.drawImage(img, 0, 0, 1, 1);
                  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
                  setDominantColor(`rgb(${r},${g},${b})`);
                }
              }}
            />
          </motion.div>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
          )}
        </div>

        {/* Track metadata */}
        <div className="w-full max-w-[340px]">
          <div className="flex items-start justify-between gap-4 mb-1">
            <div className="min-w-0 flex-1">
              <motion.h1
                key={currentTrack.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl font-bold truncate text-glow-primary"
              >
                {currentTrack.name}
              </motion.h1>
              <Link
                href={`/artist/${currentTrack.artistId}`}
                className="text-muted-foreground hover:text-white transition-colors"
              >
                {currentTrack.artistName}
              </Link>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0 pt-1">
              <button onClick={handleLike} className={`transition-colors ${isLiked ? "text-primary" : "text-muted-foreground hover:text-white"}`}>
                <Heart className={`w-6 h-6 ${isLiked ? "fill-current" : ""}`} />
              </button>
              {currentTrack.albumId && (
                <Link href={`/album/${currentTrack.albumId}`} className="text-muted-foreground hover:text-white transition-colors">
                  <ExternalLink className="w-5 h-5" />
                </Link>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{currentTrack.albumName}</p>
        </div>

        {/* Visualizer */}
        <div className="w-full max-w-[340px] h-16 rounded-lg overflow-hidden bg-black/20">
          <AudioVisualizer isPlaying={isPlaying} audioRef={audioRef} />
        </div>

        {/* Progress */}
        <div className="w-full max-w-[340px] flex flex-col gap-2">
          <Slider
            value={[progress]}
            max={duration || 100}
            step={0.5}
            onValueChange={([val]) => seek(val)}
            className="cursor-pointer [&_[role=slider]]:bg-primary [&_[role=slider]]:w-4 [&_[role=slider]]:h-4 [&_.bg-primary]:bg-primary"
          />
          <div className="flex justify-between text-xs font-mono text-muted-foreground">
            <span>{formatTime(progress)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="w-full max-w-[340px] flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <button onClick={toggleShuffle} className={`transition-colors ${shuffle ? "text-primary" : "text-muted-foreground hover:text-white"}`}>
              <Shuffle className="w-5 h-5" />
            </button>
            <button onClick={previous} className="text-white hover:text-primary transition-colors">
              <SkipBack className="w-7 h-7 fill-current" />
            </button>
            <button
              onClick={isPlaying ? pause : resume}
              disabled={isLoading}
              className="w-16 h-16 flex items-center justify-center bg-white text-black rounded-full hover:scale-105 disabled:opacity-60 transition-transform shadow-xl"
              style={{ boxShadow: isPlaying ? `0 0 30px rgba(255,255,255,0.3)` : undefined }}
            >
              {isLoading ? (
                <Loader2 className="w-7 h-7 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-7 h-7 fill-current" />
              ) : (
                <Play className="w-7 h-7 fill-current ml-1" />
              )}
            </button>
            <button onClick={next} className="text-white hover:text-primary transition-colors">
              <SkipForward className="w-7 h-7 fill-current" />
            </button>
            <button onClick={cycleRepeat} className={`transition-colors ${repeatMode !== "off" ? "text-primary" : "text-muted-foreground hover:text-white"}`}>
              <RepeatIcon mode={repeatMode} />
            </button>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-3">
            <button onClick={toggleMute} className="text-muted-foreground hover:text-white transition-colors flex-shrink-0">
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <Slider
              value={[isMuted ? 0 : volume * 100]}
              max={100}
              step={1}
              onValueChange={([val]) => setVolume(val / 100)}
              className="flex-1 cursor-pointer [&_[role=slider]]:bg-white [&_[role=slider]]:w-3 [&_[role=slider]]:h-3"
            />
          </div>
        </div>
      </div>

      {/* Right panel — tabs */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Tab buttons */}
        <div className="flex gap-1 mb-6 bg-black/20 rounded-xl p-1">
          {(["queue", "lyrics", "related"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                activeTab === tab ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {activeTab === "queue" && (
              <motion.div
                key="queue"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-1"
              >
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-2">
                  Now in Queue — {queue.length} tracks
                </h3>
                {queue.map((track, i) => (
                  <motion.div
                    key={`${track.id}-${i}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 group cursor-pointer transition-colors ${
                      track.id === currentTrack.id ? "bg-primary/10 border border-primary/20" : ""
                    }`}
                    onClick={() => playFromQueue(i)}
                  >
                    <span className="w-5 text-xs text-muted-foreground text-right flex-shrink-0">
                      {track.id === currentTrack.id && isPlaying ? (
                        <span className="text-primary">♪</span>
                      ) : (
                        i + 1
                      )}
                    </span>
                    <img src={track.coverUrl} alt="" className="w-9 h-9 rounded object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${track.id === currentTrack.id ? "text-primary" : ""}`}>
                        {track.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{track.artistName}</p>
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {formatTime((track.durationMs || 0) / 1000)}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeFromQueue(i); }}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-white transition-all text-lg leading-none"
                    >
                      ×
                    </button>
                  </motion.div>
                ))}
                {queue.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <ListMusic className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Queue is empty</p>
                    <p className="text-sm mt-1">Add songs to start a queue</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "lyrics" && (
              <motion.div
                key="lyrics"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col items-center justify-center py-16 text-center gap-4"
              >
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                  <MicVocal className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">Lyrics Coming Soon</h3>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Real-time synchronized lyrics for "{currentTrack.name}" will appear here.
                  </p>
                </div>
              </motion.div>
            )}

            {activeTab === "related" && (
              <motion.div
                key="related"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-1"
              >
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-2">
                  Related Tracks
                </h3>
                {(related ?? []).map((track, i) => (
                  <motion.div
                    key={track.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 group cursor-pointer transition-colors"
                    onClick={() => { addToQueue(track); }}
                  >
                    <img src={track.coverUrl} alt="" className="w-9 h-9 rounded object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{track.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{track.artistName}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); addToQueue(track); }}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary transition-all"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
