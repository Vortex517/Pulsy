import { Link, useLocation } from "wouter";
import { Home, Compass, TrendingUp, Search, Library, Heart, Clock, Settings, Radio } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { usePlayer } from "@/hooks/use-player";
import { useGetUserPlaylists } from "@workspace/api-client-react";
import { motion } from "framer-motion";

export function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { currentTrack, isPlaying } = usePlayer();
  const { data: playlists } = useGetUserPlaylists({ query: { enabled: !!user, queryKey: ["/api/spotify/playlists"] } });

  const navLinks = [
    { icon: Home, label: "Home", href: "/" },
    { icon: Compass, label: "Explore", href: "/explore" },
    { icon: TrendingUp, label: "Trending", href: "/trending" },
    { icon: Search, label: "Search", href: "/search" },
  ];

  const libraryLinks = [
    { icon: Library, label: "Your Library", href: "/library" },
    { icon: Heart, label: "Liked Songs", href: "/liked" },
    { icon: Clock, label: "Recently Played", href: "/recent" },
  ];

  return (
    <aside className="w-64 flex-col hidden md:flex border-r border-white/5 glass bg-sidebar/50 pt-6 pb-24">
      <div className="px-6 mb-8">
        <Link href="/" className="flex items-center gap-2 font-display text-2xl font-bold tracking-tighter text-glow-primary">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center box-glow-primary">
            <div className="w-3 h-3 bg-background rounded-full" />
          </div>
          Pulseify
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-3">
        <div className="space-y-1 mb-8">
          {navLinks.map((link) => {
            const isActive = location === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                  isActive ? "bg-white/10 text-primary font-medium" : "text-muted-foreground hover:text-white hover:bg-white/5"
                }`}
              >
                <link.icon className={`w-5 h-5 ${isActive ? "text-primary" : ""}`} />
                {link.label}
              </Link>
            );
          })}
        </div>

        {currentTrack && (
          <div className="mb-6">
            <Link
              href="/now-playing"
              className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all ${
                location === "/now-playing"
                  ? "bg-primary/20 text-primary font-medium border border-primary/30"
                  : "text-muted-foreground hover:text-white hover:bg-white/5"
              }`}
            >
              <div className="relative flex-shrink-0">
                <img
                  src={currentTrack.coverUrl}
                  alt=""
                  className="w-5 h-5 rounded object-cover"
                />
                {isPlaying && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary animate-pulse" />
                )}
              </div>
              <span className="flex-1 truncate text-sm">Now Playing</span>
              {isPlaying && (
                <div className="flex items-end gap-0.5 h-4">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-0.5 bg-primary rounded-full"
                      animate={{ height: ["4px", "12px", "4px"] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
                    />
                  ))}
                </div>
              )}
            </Link>
          </div>
        )}

        {user && (
          <>
            <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-6">Library</h3>
            <div className="space-y-1 mb-6">
              {libraryLinks.map((link) => {
                const isActive = location === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                      isActive ? "bg-white/10 text-primary font-medium" : "text-muted-foreground hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <link.icon className={`w-5 h-5 ${isActive ? "text-primary" : ""}`} />
                    {link.label}
                  </Link>
                );
              })}
            </div>

            <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-6">Playlists</h3>
            <div className="space-y-1">
              {playlists?.map((playlist) => (
                <Link
                  key={playlist.id}
                  href={`/playlist/${playlist.id}`}
                  className={`block px-3 py-2 rounded-md truncate text-sm transition-colors ${
                    location === `/playlist/${playlist.id}` ? "bg-white/10 text-primary font-medium" : "text-muted-foreground hover:text-white hover:bg-white/5"
                  }`}
                >
                  {playlist.name}
                </Link>
              ))}
            </div>
          </>
        )}
      </div>

      {user && (
        <div className="p-4 mt-auto border-t border-white/5">
          <Link href="/profile" className="flex items-center gap-3 hover:bg-white/5 p-2 rounded-lg transition-colors">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.displayName} className="w-10 h-10 rounded-full border border-primary/50" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
                {user.displayName.charAt(0)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.displayName}</p>
              <p className="text-xs text-primary">{user.isPremium ? "Premium" : "Free"}</p>
            </div>
            <Settings className="w-4 h-4 text-muted-foreground" />
          </Link>
        </div>
      )}

      {!user && (
        <div className="p-4 mt-auto border-t border-white/5 space-y-2">
          <Link href="/login" className="block w-full py-2 text-center text-sm font-medium bg-white/5 hover:bg-white/10 rounded-md transition-colors">
            Log in
          </Link>
          <Link href="/register" className="block w-full py-2 text-center text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors box-glow-primary">
            Sign up
          </Link>
        </div>
      )}
    </aside>
  );
}
