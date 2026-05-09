import { useGetCategories, useGetRecommendations } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { TrackCard } from "@/components/music/track-card";
import { useState } from "react";

export default function Explore() {
  const { data: categories, isLoading: categoriesLoading } = useGetCategories({
    query: { queryKey: ["/api/spotify/categories"] }
  });

  const [selectedGenre, setSelectedGenre] = useState<string>("pop");

  const { data: recommendations, isLoading: recommendationsLoading } = useGetRecommendations(
    { seed_genres: selectedGenre },
    { query: { queryKey: ["/api/spotify/recommendations", { seed_genres: selectedGenre }] } }
  );

  return (
    <div className="flex flex-col gap-8 pb-12 relative z-10">
      <header className="sticky top-0 bg-background/80 backdrop-blur-xl z-20 py-4 -mx-4 px-4 md:-mx-8 md:px-8 border-b border-white/5">
        <h1 className="text-3xl font-bold font-display text-glow-primary">Explore</h1>
      </header>

      <section>
        <h2 className="text-2xl font-bold mb-4">Genres & Moods</h2>
        <div className="flex overflow-x-auto pb-4 gap-3 snap-x scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
          {categoriesLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="min-w-[120px] h-12 rounded-full bg-white/5" />
            ))
          ) : (
            categories?.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedGenre(category.id)}
                className={`snap-start whitespace-nowrap px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedGenre === category.id 
                    ? "bg-primary text-primary-foreground box-glow-primary scale-105" 
                    : "glass hover:bg-white/10"
                }`}
              >
                {category.name}
              </button>
            ))
          )}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-glow-secondary capitalize">Discover {selectedGenre.replace('-', ' ')}</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {recommendationsLoading ? (
            Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton className="aspect-square rounded-lg bg-white/5" />
                <Skeleton className="h-4 w-3/4 bg-white/5" />
                <Skeleton className="h-3 w-1/2 bg-white/5" />
              </div>
            ))
          ) : (
            recommendations?.map((track, i) => (
              <TrackCard key={track.id} track={track} index={i} />
            ))
          )}
        </div>
      </section>
    </div>
  );
}