'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Curriculum, CurriculumFormData } from '@/types/database'
import { getSupabase } from '@/lib/supabase'

interface CurriculumState {
  curricula: Curriculum[]
  isLoading: boolean
  error: string | null

  fetchCurricula: () => Promise<void>
  addCurriculum: (data: CurriculumFormData) => Promise<Curriculum | null>
  updateCurriculum: (id: string, data: Partial<CurriculumFormData>) => Promise<void>
  deleteCurriculum: (id: string) => Promise<void>
  addSessionToCurriculum: (curriculumId: string, sessionId: string) => Promise<void>
  removeSessionFromCurriculum: (curriculumId: string, sessionId: string) => Promise<void>
  reorderSessions: (curriculumId: string, sessionIds: string[]) => Promise<void>
}

export const useCurriculumStore = create<CurriculumState>()(
  persist(
    (set, get) => ({
      curricula: [],
      isLoading: false,
      error: null,

      fetchCurricula: async () => {
        set({ isLoading: true, error: null })
        try {
          const supabase = getSupabase()
          const { data, error } = await supabase
            .from('curricula')
            .select('*')
            .order('created_at', { ascending: false })

          if (error) throw error
          set({ curricula: data || [], isLoading: false })
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false })
        }
      },

      addCurriculum: async (curriculumData) => {
        set({ isLoading: true, error: null })
        try {
          const supabase = getSupabase()
          const { data, error } = await supabase
            .from('curricula')
            .insert([curriculumData])
            .select()
            .single()

          if (error) throw error
          set((state) => ({
            curricula: [data, ...state.curricula],
            isLoading: false,
          }))
          return data
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false })
          return null
        }
      },

      updateCurriculum: async (id, curriculumData) => {
        set({ isLoading: true, error: null })
        try {
          const supabase = getSupabase()
          const { error } = await supabase
            .from('curricula')
            .update(curriculumData)
            .eq('id', id)

          if (error) throw error
          set((state) => ({
            curricula: state.curricula.map((c) =>
              c.id === id ? { ...c, ...curriculumData } : c
            ),
            isLoading: false,
          }))
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false })
        }
      },

      deleteCurriculum: async (id) => {
        set({ isLoading: true, error: null })
        try {
          const supabase = getSupabase()
          const { error } = await supabase.from('curricula').delete().eq('id', id)

          if (error) throw error
          set((state) => ({
            curricula: state.curricula.filter((c) => c.id !== id),
            isLoading: false,
          }))
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false })
        }
      },

      addSessionToCurriculum: async (curriculumId, sessionId) => {
        const curriculum = get().curricula.find((c) => c.id === curriculumId)
        if (!curriculum) return

        const newSessionIds = [...curriculum.session_ids, sessionId]
        try {
          const supabase = getSupabase()
          const { error } = await supabase
            .from('curricula')
            .update({ session_ids: newSessionIds })
            .eq('id', curriculumId)

          if (error) throw error
          set((state) => ({
            curricula: state.curricula.map((c) =>
              c.id === curriculumId ? { ...c, session_ids: newSessionIds } : c
            ),
          }))
        } catch (error) {
          set({ error: (error as Error).message })
        }
      },

      removeSessionFromCurriculum: async (curriculumId, sessionId) => {
        const curriculum = get().curricula.find((c) => c.id === curriculumId)
        if (!curriculum) return

        const newSessionIds = curriculum.session_ids.filter((id) => id !== sessionId)
        try {
          const supabase = getSupabase()
          const { error } = await supabase
            .from('curricula')
            .update({ session_ids: newSessionIds })
            .eq('id', curriculumId)

          if (error) throw error
          set((state) => ({
            curricula: state.curricula.map((c) =>
              c.id === curriculumId ? { ...c, session_ids: newSessionIds } : c
            ),
          }))
        } catch (error) {
          set({ error: (error as Error).message })
        }
      },

      reorderSessions: async (curriculumId, sessionIds) => {
        try {
          const supabase = getSupabase()
          const { error } = await supabase
            .from('curricula')
            .update({ session_ids: sessionIds })
            .eq('id', curriculumId)

          if (error) throw error
          set((state) => ({
            curricula: state.curricula.map((c) =>
              c.id === curriculumId ? { ...c, session_ids: sessionIds } : c
            ),
          }))
        } catch (error) {
          set({ error: (error as Error).message })
        }
      },
    }),
    {
      name: 'ecogram-curricula',
      partialize: () => ({}),
    }
  )
)
