'use client';

import { useGameStore } from '@/store';
import { CATEGORIES, GameCategory } from '@/types';
import { X, Search } from 'lucide-react';
import { useMemo } from 'react';

export default function GameFilters() {
  const games = useGameStore((s) => s.games);
  const filters = useGameStore((s) => s.filters);
  const setFilters = useGameStore((s) => s.setFilters);
  const resetFilters = useGameStore((s) => s.resetFilters);

  const subcategories = useMemo(() => {
    if (filters.category === 'all') return [];
    const subs = new Set(
      games
        .filter((g) => g.category === filters.category && g.subcategory)
        .map((g) => g.subcategory)
    );
    return Array.from(subs) as string[];
  }, [games, filters.category]);

  const count = games.length;
  const hasFilters =
    filters.category !== 'all' || filters.subcategory || filters.source;

  return (
    <div className="space-y-3">
      {/* Mobile search */}
      <div className="sm:hidden relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search games..."
          value={filters.search}
          onChange={(e) => setFilters({ search: e.target.value })}
          className="w-full pl-10 pr-4 py-2.5 bg-secondary/50 border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
        />
      </div>

      {/* Category pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setFilters({ category: 'all', subcategory: '' })}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            filters.category === 'all'
              ? 'bg-primary/20 text-primary border-primary/30'
              : 'bg-secondary/50 text-muted-foreground border-border/50 hover:text-foreground'
          }`}
        >
          All ({count})
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() =>
              setFilters({
                category:
                  filters.category === cat.value ? 'all' : cat.value,
                subcategory: '',
              })
            }
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              filters.category === cat.value
                ? 'bg-primary/20 text-primary border-primary/30'
                : 'bg-secondary/50 text-muted-foreground border-border/50 hover:text-foreground'
            }`}
          >
            {cat.label}
          </button>
        ))}

        {hasFilters && (
          <button
            onClick={resetFilters}
            className="shrink-0 px-2 py-1.5 rounded-full text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Subcategory pills */}
      {subcategories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {subcategories.map((sub) => (
            <button
              key={sub}
              onClick={() =>
                setFilters({
                  subcategory: filters.subcategory === sub ? '' : sub,
                })
              }
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition-colors capitalize ${
                filters.subcategory === sub
                  ? 'bg-accent/20 text-accent border-accent/30'
                  : 'bg-secondary/30 text-muted-foreground border-border/30 hover:text-foreground'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
