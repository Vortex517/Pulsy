import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
  useRef,
  useCallback,
} from "react";
import type { Track } from "@workspace/api-client-react";

export type RepeatMode = "off" | "one" | "all";

interface PlayerContextType {
  currentTrack: Track | null;
  queue: Track[];
  isPlaying: boolean;
  isLoading: boolean;
  progress: number;
  volume: number;
  isMuted: boolean;
  shuffle: boolean;
  repeatMode: RepeatMode;
  duration: number;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  play: (track: Track, queue?: Track[]) => void;
  pause: () => void;
  resume: () => void;
  next: () => void;
  previous: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  playFromQueue: (index: number) => void;
  clearQueue: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

const videoIdCache = new Map<string, string>();

async function resolveStreamUrl(track: Track): Promise<string> {
  const cacheKey = `${track.name}__${track.artistName}`;
  const cachedId = videoIdCache.get(cacheKey);
  if (cachedId) return `/api/stream/${cachedId}`;

  const query = `${track.name} ${track.artistName}`;
  const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error("YouTube search failed");
  const { videoId } = (await res.json()) as { videoId: string };
  videoIdCache.set(cacheKey, videoId);
  return `/api/stream/${videoId}`;
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");
  const [duration, setDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentTrackRef = useRef<Track | null>(null);
  const queueRef = useRef<Track[]>([]);
  const repeatModeRef = useRef<RepeatMode>("off");
  const shuffleRef = useRef(false);

  currentTrackRef.current = currentTrack;
  queueRef.current = queue;
  repeatModeRef.current = repeatMode;
  shuffleRef.current = shuffle;

  useEffect(() => {
    const audio = new Audio();
    audio.volume = volume;
    audio.preload = "auto";
    audioRef.current = audio;

    const handleTimeUpdate = () => setProgress(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration || 0);
    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      const mode = repeatModeRef.current;
      if (mode === "one") {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else {
        nextTrack();
      }
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.pause();
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const nextTrack = useCallback(() => {
    const q = queueRef.current;
    const track = currentTrackRef.current;
    if (!track || q.length === 0) return;

    let currentIndex = q.findIndex((t) => t.id === track.id);
    if (currentIndex === -1) currentIndex = 0;

    if (repeatModeRef.current === "all" && currentIndex === q.length - 1) {
      setCurrentTrack(q[0]);
    } else if (shuffleRef.current) {
      const randomIndex = Math.floor(Math.random() * q.length);
      setCurrentTrack(q[randomIndex]);
    } else if (currentIndex < q.length - 1) {
      setCurrentTrack(q[currentIndex + 1]);
    }
  }, []);

  useEffect(() => {
    if (!currentTrack) return;

    let cancelled = false;
    setIsLoading(true);
    setProgress(0);
    setDuration(0);

    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    audio.src = "";

    (async () => {
      try {
        const streamUrl = await resolveStreamUrl(currentTrack);
        if (cancelled) return;

        audio.src = streamUrl;
        audio.load();
        await audio.play();
        if (!cancelled) setIsPlaying(true);
      } catch (err) {
        if (cancelled) return;
        console.error("Stream failed, trying preview:", err);
        if (currentTrack.previewUrl) {
          try {
            audio.src = currentTrack.previewUrl;
            audio.load();
            await audio.play();
            if (!cancelled) setIsPlaying(true);
          } catch (e2) {
            console.error("Preview also failed:", e2);
            setIsPlaying(false);
          }
        } else {
          setIsPlaying(false);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentTrack]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.code === "Space") {
        e.preventDefault();
        if (audioRef.current?.paused) {
          audioRef.current.play().catch(() => {});
        } else {
          audioRef.current?.pause();
        }
      } else if (e.code === "ArrowRight" && e.altKey) {
        e.preventDefault();
        nextTrack();
      } else if (e.code === "ArrowLeft" && e.altKey) {
        e.preventDefault();
        previous();
      } else if (e.code === "KeyM") {
        setIsMuted((m) => !m);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextTrack]);

  const play = useCallback((track: Track, newQueue?: Track[]) => {
    if (newQueue) setQueue(newQueue);
    setCurrentTrack(track);
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const resume = useCallback(() => {
    audioRef.current?.play().catch(() => {});
  }, []);

  const next = useCallback(() => {
    nextTrack();
  }, [nextTrack]);

  const previous = useCallback(() => {
    const audio = audioRef.current;
    const q = queueRef.current;
    const track = currentTrackRef.current;

    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }

    if (!track || q.length === 0) return;
    let currentIndex = q.findIndex((t) => t.id === track.id);
    if (currentIndex === -1) currentIndex = 0;
    const prevIndex = currentIndex === 0 ? q.length - 1 : currentIndex - 1;
    setCurrentTrack(q[prevIndex]);
  }, []);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setProgress(time);
    }
  }, []);

  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    setIsMuted(false);
  }, []);

  const toggleMute = useCallback(() => setIsMuted((m) => !m), []);
  const toggleShuffle = useCallback(() => setShuffle((s) => !s), []);

  const cycleRepeat = useCallback(() => {
    setRepeatMode((r) => (r === "off" ? "all" : r === "all" ? "one" : "off"));
  }, []);

  const addToQueue = useCallback((track: Track) => {
    setQueue((prev) => [...prev, track]);
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const playFromQueue = useCallback(
    (index: number) => {
      const q = queueRef.current;
      if (q[index]) play(q[index]);
    },
    [play]
  );

  const clearQueue = useCallback(() => setQueue([]), []);

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        queue,
        isPlaying,
        isLoading,
        progress,
        volume,
        isMuted,
        shuffle,
        repeatMode,
        duration,
        audioRef,
        play,
        pause,
        resume,
        next,
        previous,
        seek,
        setVolume,
        toggleMute,
        toggleShuffle,
        cycleRepeat,
        addToQueue,
        removeFromQueue,
        playFromQueue,
        clearQueue,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return context;
}
