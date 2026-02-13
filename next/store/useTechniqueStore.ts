'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Technique, TechniqueFilters, TechniqueFormData } from '@/types/database'
import { getSupabase } from '@/lib/supabase'

interface TechniqueState {
  techniques: Technique[]
  isLoading: boolean
  error: string | null
  filters: TechniqueFilters

  fetchTechniques: () => Promise<void>
  addTechnique: (data: TechniqueFormData) => Promise<Technique | null>
  updateTechnique: (id: string, data: Partial<TechniqueFormData>) => Promise<void>
  deleteTechnique: (id: string) => Promise<void>
  setFilters: (filters: Partial<TechniqueFilters>) => void
  resetFilters: () => void
  filteredTechniques: () => Technique[]
  getPrerequisites: (techniqueId: string) => Technique[]
  getTechniquesByPosition: (position: string) => Technique[]
}

const defaultFilters: TechniqueFilters = {
  search: '',
  position: '',
  category: '',
  gi_nogi: '',
  belt_level: '',
}

export const useTechniqueStore = create<TechniqueState>()(
  persist(
    (set, get) => ({
      techniques: [],
      isLoading: false,
      error: null,
      filters: defaultFilters,

      fetchTechniques: async () => {
        const existing = get().techniques
        set({ isLoading: true, error: null })
        try {
          const supabase = getSupabase()
          const { data, error } = await supabase
            .from('techniques')
            .select('*')
            .order('name', { ascending: true })

          if (error) throw error
          set({ techniques: data || [], isLoading: false })
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false, techniques: existing })
        }
      },

      addTechnique: async (techData) => {
        set({ isLoading: true, error: null })
        try {
          const supabase = getSupabase()
          const { data, error } = await supabase
            .from('techniques')
            .insert([techData])
            .select()
            .single()

          if (error) throw error
          set((state) => ({
            techniques: [data, ...state.techniques],
            isLoading: false,
          }))
          return data
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false })
          return null
        }
      },

      updateTechnique: async (id, techData) => {
        set({ isLoading: true, error: null })
        try {
          const supabase = getSupabase()
          const { error } = await supabase
            .from('techniques')
            .update(techData)
            .eq('id', id)

          if (error) throw error
          set((state) => ({
            techniques: state.techniques.map((t) =>
              t.id === id ? { ...t, ...techData } : t
            ),
            isLoading: false,
          }))
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false })
        }
      },

      deleteTechnique: async (id) => {
        set({ isLoading: true, error: null })
        try {
          const supabase = getSupabase()
          const { error } = await supabase.from('techniques').delete().eq('id', id)

          if (error) throw error
          set((state) => ({
            techniques: state.techniques.filter((t) => t.id !== id),
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

      filteredTechniques: () => {
        const { techniques, filters } = get()
        return techniques.filter((tech) => {
          if (filters.search) {
            const search = filters.search.toLowerCase()
            const matchesSearch =
              tech.name.toLowerCase().includes(search) ||
              tech.description?.toLowerCase().includes(search) ||
              tech.tags.some((t) => t.toLowerCase().includes(search))
            if (!matchesSearch) return false
          }
          if (filters.position && tech.position !== filters.position) return false
          if (filters.category && tech.category !== filters.category) return false
          if (filters.gi_nogi && tech.gi_nogi !== filters.gi_nogi && tech.gi_nogi !== 'both') return false
          if (filters.belt_level) {
            const beltOrder = ['white', 'blue', 'purple', 'brown', 'black']
            const filterIdx = beltOrder.indexOf(filters.belt_level)
            const minIdx = beltOrder.indexOf(tech.belt_level_min)
            const maxIdx = beltOrder.indexOf(tech.belt_level_max)
            if (filterIdx < minIdx || filterIdx > maxIdx) return false
          }
          return true
        })
      },

      getPrerequisites: (techniqueId) => {
        const { techniques } = get()
        const tech = techniques.find((t) => t.id === techniqueId)
        if (!tech) return []
        return techniques.filter((t) => tech.prerequisite_ids.includes(t.id))
      },

      getTechniquesByPosition: (position) => {
        return get().techniques.filter((t) => t.position === position)
      },
    }),
    {
      name: 'ecogram-techniques',
      partialize: (state) => ({ techniques: state.techniques, filters: state.filters }),
    }
  )
)
