'use client';

import { useGameStore } from '@/store';
import Navigation from '@/components/Navigation';
import GameFilters from '@/components/GameFilters';
import GameCard from '@/components/GameCard';
import GameDetail from '@/components/GameDetail';

function useFilteredGames() {
  const games = useGameStore((s) => s.games);
  const filters = useGameStore((s) => s.filters);

  return games.filter((g) => {
    if (filters.category !== 'all' && g.category !== filters.category) return false;
    if (filters.subcategory && g.subcategory !== filters.subcategory) return false;
    if (filters.source && g.source !== filters.source) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (
        !g.name.toLowerCase().includes(q) &&
        !g.tags.some((t) => t.toLowerCase().includes(q)) &&
        !g.playerA.objective.toLowerCase().includes(q) &&
        !g.playerB.objective.toLowerCase().includes(q) &&
        !g.startingPosition.toLowerCase().includes(q) &&
        !(g.coachingNotes && g.coachingNotes.toLowerCase().includes(q))
      )
        return false;
    }
    return true;
  });
}

export default function LibraryPage() {
  const games = useFilteredGames();

  return (
    <>
      <Navigation />
      <main className="pt-4 sm:pt-6 pb-24 sm:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold mb-1">
              <span className="gradient-text">CLA Games</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              Constraints-Led Approach game library for nogi grappling
            </p>
          </div>

          {/* Filters */}
          <div className="mb-6">
            <GameFilters />
          </div>

          {/* Games Grid */}
          {games.length > 0 ? (
            <div className="card-grid">
              {games.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-sm">No games match your filters</p>
              <button
                onClick={() => useGameStore.getState().resetFilters()}
                className="mt-2 text-xs text-primary hover:underline"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Game Detail Modal */}
      <GameDetail />
    </>
  );
}
