import { motion } from "framer-motion";
import { Link } from "wouter";
import type { Artist } from "@workspace/api-client-react";

interface ArtistCardProps {
  artist: Artist;
  index?: number;
}

export function ArtistCard({ artist, index = 0 }: ArtistCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="group relative flex flex-col items-center gap-4 rounded-xl p-4 glass-card hover:bg-card transition-all duration-300 hover:scale-[1.05] hover:box-glow-accent cursor-pointer text-center"
    >
      <Link href={`/artist/${artist.id}`} className="w-full flex flex-col items-center">
        <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden mb-2 border-2 border-transparent group-hover:border-accent transition-colors duration-300 shadow-lg">
          {artist.imageUrl ? (
            <img
              src={artist.imageUrl}
              alt={artist.name}
              className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full bg-accent/20 flex items-center justify-center text-accent text-4xl font-bold">
              {artist.name.charAt(0)}
            </div>
          )}
        </div>
        <h3 className="text-lg font-bold truncate w-full group-hover:text-accent transition-colors text-glow-accent">{artist.name}</h3>
        <p className="text-xs text-muted-foreground capitalize truncate w-full mt-1">Artist</p>
      </Link>
    </motion.div>
  );
}
