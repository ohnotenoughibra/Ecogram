import { create } from 'zustand';
import { CLAGame, GameCategory } from '@/types';
import { SEED_GAMES } from '@/lib/seed-games';

const STORAGE_KEY = 'cla-games-library';

function loadGames(): CLAGame[] {
  if (typeof window === 'undefined') return [...SEED_GAMES];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as CLAGame[];
      const customGames = parsed.filter((g) => g.isCustom);
      return [...SEED_GAMES, ...customGames];
    }
  } catch {}
  return [...SEED_GAMES];
}

function saveCustomGames(games: CLAGame[]) {
  if (typeof window === 'undefined') return;
  const custom = games.filter((g) => g.isCustom);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...SEED_GAMES, ...custom]));
}

interface Filters {
  search: string;
  category: GameCategory | 'all';
  subcategory: string;
  source: string;
}

interface GameStore {
  games: CLAGame[];
  filters: Filters;
  selectedGame: CLAGame | null;
  setFilters: (filters: Partial<Filters>) => void;
  resetFilters: () => void;
  selectGame: (game: CLAGame | null) => void;
  addGame: (game: CLAGame) => void;
  updateGame: (id: string, updates: Partial<CLAGame>) => void;
  deleteGame: (id: string) => void;
  filteredGames: () => CLAGame[];
  getGameById: (id: string) => CLAGame | undefined;
  getSources: () => string[];
  getSubcategories: (category: GameCategory) => string[];
}

const defaultFilters: Filters = {
  search: '',
  category: 'all',
  subcategory: '',
  source: '',
};

export const useGameStore = create<GameStore>((set, get) => ({
  games: loadGames(),
  filters: { ...defaultFilters },
  selectedGame: null,

  setFilters: (updates) =>
    set((state) => ({ filters: { ...state.filters, ...updates } })),

  resetFilters: () => set({ filters: { ...defaultFilters } }),

  selectGame: (game) => set({ selectedGame: game }),

  addGame: (game) =>
    set((state) => {
      const games = [...state.games, game];
      saveCustomGames(games);
      return { games };
    }),

  updateGame: (id, updates) =>
    set((state) => {
      const games = state.games.map((g) =>
        g.id === id ? { ...g, ...updates } : g
      );
      saveCustomGames(games);
      return { games };
    }),

  deleteGame: (id) =>
    set((state) => {
      const games = state.games.filter((g) => g.id !== id);
      saveCustomGames(games);
      return { games };
    }),

  filteredGames: () => {
    const { games, filters } = get();
    let result = games;

    if (filters.category !== 'all') {
      result = result.filter((g) => g.category === filters.category);
    }

    if (filters.subcategory) {
      result = result.filter((g) => g.subcategory === filters.subcategory);
    }

    if (filters.source) {
      result = result.filter((g) => g.source === filters.source);
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (g) =>
          g.name.toLowerCase().includes(q) ||
          g.tags.some((t) => t.toLowerCase().includes(q)) ||
          g.playerA.objective.toLowerCase().includes(q) ||
          g.playerB.objective.toLowerCase().includes(q) ||
          g.startingPosition.toLowerCase().includes(q) ||
          (g.coachingNotes && g.coachingNotes.toLowerCase().includes(q))
      );
    }

    return result;
  },

  getGameById: (id) => get().games.find((g) => g.id === id),

  getSources: () => {
    const sources = new Set(get().games.map((g) => g.source).filter(Boolean));
    return Array.from(sources) as string[];
  },

  getSubcategories: (category) => {
    const subs = new Set(
      get()
        .games.filter((g) => g.category === category && g.subcategory)
        .map((g) => g.subcategory)
    );
    return Array.from(subs) as string[];
  },
}));
