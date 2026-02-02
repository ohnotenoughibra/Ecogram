'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Game, GameFilters, GameFormData } from '@/types/database'
import { getSupabase } from '@/lib/supabase'

interface GameState {
  games: Game[]
  isLoading: boolean
  error: string | null
  filters: GameFilters

  // Actions
  fetchGames: () => Promise<void>
  addGame: (game: GameFormData) => Promise<Game | null>
  updateGame: (id: string, game: Partial<GameFormData>) => Promise<void>
  deleteGame: (id: string) => Promise<void>
  toggleFavorite: (id: string) => Promise<void>
  incrementPlayCount: (id: string) => Promise<void>
  setFilters: (filters: Partial<GameFilters>) => void
  resetFilters: () => void

  // Computed
  filteredGames: () => Game[]
}

const defaultFilters: GameFilters = {
  search: '',
  position: '',
  difficulty: '',
  category: '',
  topic: '',
  favorites_only: false,
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      games: [],
      isLoading: false,
      error: null,
      filters: defaultFilters,

      fetchGames: async () => {
        set({ isLoading: true, error: null })
        try {
          const supabase = getSupabase()
          const { data, error } = await supabase
            .from('games')
            .select('*')
            .order('created_at', { ascending: false })

          if (error) throw error
          set({ games: data || [], isLoading: false })
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false })
        }
      },

      addGame: async (gameData) => {
        set({ isLoading: true, error: null })
        try {
          const supabase = getSupabase()
          const { data, error } = await supabase
            .from('games')
            .insert([gameData])
            .select()
            .single()

          if (error) throw error
          set((state) => ({
            games: [data, ...state.games],
            isLoading: false,
          }))
          return data
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false })
          return null
        }
      },

      updateGame: async (id, gameData) => {
        set({ isLoading: true, error: null })
        try {
          const supabase = getSupabase()
          const { error } = await supabase
            .from('games')
            .update(gameData)
            .eq('id', id)

          if (error) throw error
          set((state) => ({
            games: state.games.map((g) =>
              g.id === id ? { ...g, ...gameData } : g
            ),
            isLoading: false,
          }))
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false })
        }
      },

      deleteGame: async (id) => {
        set({ isLoading: true, error: null })
        try {
          const supabase = getSupabase()
          const { error } = await supabase.from('games').delete().eq('id', id)

          if (error) throw error
          set((state) => ({
            games: state.games.filter((g) => g.id !== id),
            isLoading: false,
          }))
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false })
        }
      },

      toggleFavorite: async (id) => {
        const game = get().games.find((g) => g.id === id)
        if (!game) return

        try {
          const supabase = getSupabase()
          const { error } = await supabase
            .from('games')
            .update({ is_favorite: !game.is_favorite })
            .eq('id', id)

          if (error) throw error
          set((state) => ({
            games: state.games.map((g) =>
              g.id === id ? { ...g, is_favorite: !g.is_favorite } : g
            ),
          }))
        } catch (error) {
          set({ error: (error as Error).message })
        }
      },

      incrementPlayCount: async (id) => {
        const game = get().games.find((g) => g.id === id)
        if (!game) return

        try {
          const supabase = getSupabase()
          const { error } = await supabase
            .from('games')
            .update({ play_count: game.play_count + 1 })
            .eq('id', id)

          if (error) throw error
          set((state) => ({
            games: state.games.map((g) =>
              g.id === id ? { ...g, play_count: g.play_count + 1 } : g
            ),
          }))
        } catch (error) {
          set({ error: (error as Error).message })
        }
      },

      setFilters: (newFilters) => {
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        }))
      },

      resetFilters: () => {
        set({ filters: defaultFilters })
      },

      filteredGames: () => {
        const { games, filters } = get()
        return games.filter((game) => {
          if (filters.search) {
            const search = filters.search.toLowerCase()
            const matchesSearch =
              game.name.toLowerCase().includes(search) ||
              game.description?.toLowerCase().includes(search) ||
              game.techniques.some((t) => t.toLowerCase().includes(search))
            if (!matchesSearch) return false
          }
          if (filters.position && game.position !== filters.position) return false
          if (filters.difficulty && game.difficulty !== filters.difficulty) return false
          if (filters.category && game.category !== filters.category) return false
          if (filters.topic && game.topic !== filters.topic) return false
          if (filters.favorites_only && !game.is_favorite) return false
          return true
        })
      },
    }),
    {
      name: 'ecogram-games',
      partialize: (state) => ({ filters: state.filters }),
    }
  )
)
