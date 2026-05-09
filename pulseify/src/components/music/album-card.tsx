import { motion } from "framer-motion";
import { Link } from "wouter";
import type { Album } from "@workspace/api-client-react";

interface AlbumCardProps {
  album: Album;
  index?: number;
}

export function AlbumCard({ album, index = 0 }: AlbumCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="group relative flex flex-col gap-3 rounded-xl p-3 glass-card hover:bg-card transition-all duration-300 hover:scale-[1.02] hover:box-glow-secondary cursor-pointer"
    >
      <Link href={`/album/${album.id}`}>
        <div className="relative aspect-square overflow-hidden rounded-lg">
          <img
            src={album.coverUrl}
            alt={album.name}
            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <span className="text-white font-medium px-4 py-2 bg-black/50 backdrop-blur-md rounded-full text-sm">View Album</span>
          </div>
        </div>
      </Link>
      <div className="flex flex-col px-1">
        <Link href={`/album/${album.id}`} className="text-base font-semibold truncate hover:text-secondary transition-colors text-glow-secondary">
          {album.name}
        </Link>
        <Link href={`/artist/${album.artistId}`} className="text-sm text-muted-foreground truncate hover:text-white transition-colors">
          {album.artistName}
        </Link>
        <span className="text-xs text-muted-foreground/70 mt-1">{new Date(album.releaseDate).getFullYear()} • {album.albumType}</span>
      </div>
    </motion.div>
  );
}
