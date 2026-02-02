'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ClassPrep, ClassPrepFilters, ClassPrepFormData, SmartBuilderConstraints, Game } from '@/types/database'
import { getSupabase } from '@/lib/supabase'

interface ClassPrepState {
  classPreps: ClassPrep[]
  isLoading: boolean
  error: string | null
  filters: ClassPrepFilters

  // Actions
  fetchClassPreps: () => Promise<void>
  addClassPrep: (prep: ClassPrepFormData) => Promise<ClassPrep | null>
  updateClassPrep: (id: string, prep: Partial<ClassPrepFormData>) => Promise<void>
  deleteClassPrep: (id: string) => Promise<void>
  setFilters: (filters: Partial<ClassPrepFilters>) => void
  resetFilters: () => void

  // Smart builder
  generateSmartSession: (constraints: SmartBuilderConstraints, games: Game[]) => { warmup: Game[]; main: Game[]; cooldown: Game[] }
}

const defaultFilters: ClassPrepFilters = {
  search: '',
  date_from: '',
  date_to: '',
  focus: '',
}

export const useClassPrepStore = create<ClassPrepState>()(
  persist(
    (set, get) => ({
      classPreps: [],
      isLoading: false,
      error: null,
      filters: defaultFilters,

      fetchClassPreps: async () => {
        set({ isLoading: true, error: null })
        try {
          const supabase = getSupabase()
          const { data, error } = await supabase
            .from('class_preps')
            .select('*')
            .order('date', { ascending: false })

          if (error) throw error
          set({ classPreps: data || [], isLoading: false })
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false })
        }
      },

      addClassPrep: async (prepData) => {
        set({ isLoading: true, error: null })
        try {
          const supabase = getSupabase()
          const { data, error } = await supabase
            .from('class_preps')
            .insert([prepData])
            .select()
            .single()

          if (error) throw error
          set((state) => ({
            classPreps: [data, ...state.classPreps],
            isLoading: false,
          }))
          return data
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false })
          return null
        }
      },

      updateClassPrep: async (id, prepData) => {
        set({ isLoading: true, error: null })
        try {
          const supabase = getSupabase()
          const { error } = await supabase
            .from('class_preps')
            .update(prepData)
            .eq('id', id)

          if (error) throw error
          set((state) => ({
            classPreps: state.classPreps.map((p) =>
              p.id === id ? { ...p, ...prepData } : p
            ),
            isLoading: false,
          }))
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false })
        }
      },

      deleteClassPrep: async (id) => {
        set({ isLoading: true, error: null })
        try {
          const supabase = getSupabase()
          const { error } = await supabase.from('class_preps').delete().eq('id', id)

          if (error) throw error
          set((state) => ({
            classPreps: state.classPreps.filter((p) => p.id !== id),
            isLoading: false,
          }))
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false })
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

      generateSmartSession: (constraints, games) => {
        let filtered = [...games]

        // Apply position filter
        if (constraints.position) {
          filtered = filtered.filter((g) => g.position === constraints.position)
        }

        // Apply difficulty filter
        if (constraints.difficulty) {
          filtered = filtered.filter((g) => g.difficulty === constraints.difficulty)
        }

        // Apply topic filter
        if (constraints.topic) {
          filtered = filtered.filter((g) =>
            g.topic.toLowerCase().includes(constraints.topic!.toLowerCase())
          )
        }

        // Separate by category
        const warmups = filtered.filter((g) => g.category === 'warmup')
        const mains = filtered.filter((g) => g.category === 'main' || g.category === 'drill' || g.category === 'positional')
        const cooldowns = filtered.filter((g) => g.category === 'cooldown')

        // Calculate game counts
        let warmupCount = 1
        let mainCount = 3
        let cooldownCount = 1

        if (constraints.game_count) {
          const total = constraints.game_count
          warmupCount = Math.max(1, Math.floor(total * 0.2))
          cooldownCount = Math.max(1, Math.floor(total * 0.2))
          mainCount = total - warmupCount - cooldownCount
        } else if (constraints.duration_minutes) {
          const totalGames = Math.floor(constraints.duration_minutes / 8)
          warmupCount = Math.max(1, Math.floor(totalGames * 0.2))
          cooldownCount = Math.max(1, Math.floor(totalGames * 0.2))
          mainCount = Math.max(1, totalGames - warmupCount - cooldownCount)
        }

        // Shuffle and select
        const shuffle = <T>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5)

        return {
          warmup: shuffle(warmups).slice(0, warmupCount),
          main: shuffle(mains).slice(0, mainCount),
          cooldown: shuffle(cooldowns).slice(0, cooldownCount),
        }
      },
    }),
    {
      name: 'ecogram-class-preps',
      partialize: (state) => ({ filters: state.filters }),
    }
  )
)
