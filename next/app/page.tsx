'use client';

import { useGameStore } from '@/store';
import Navigation from '@/components/Navigation';
import GameFilters from '@/components/GameFilters';
import GameCard from '@/components/GameCard';
import GameDetail from '@/components/GameDetail';

export default function LibraryPage() {
  const filteredGames = useGameStore((s) => s.filteredGames);
  const games = filteredGames();

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
