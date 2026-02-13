'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ClassLog, ClassLogFormData, Intensity } from '@/types/database'
import { getSupabase } from '@/lib/supabase'

interface ClassLogState {
  classLogs: ClassLog[]
  isLoading: boolean
  error: string | null

  fetchClassLogs: () => Promise<void>
  addClassLog: (data: ClassLogFormData) => Promise<ClassLog | null>
  updateClassLog: (id: string, data: Partial<ClassLogFormData>) => Promise<void>
  deleteClassLog: (id: string) => Promise<void>
  getLogsBySession: (sessionId: string) => ClassLog[]
  getLogsByStudent: (studentId: string) => ClassLog[]
  getLogsByDateRange: (from: string, to: string) => ClassLog[]
  getTechniqueFrequency: () => Record<string, number>
  getRecentLogs: (count: number) => ClassLog[]
}

export const useClassLogStore = create<ClassLogState>()(
  persist(
    (set, get) => ({
      classLogs: [],
      isLoading: false,
      error: null,

      fetchClassLogs: async () => {
        const existing = get().classLogs
        set({ isLoading: true, error: null })
        try {
          const supabase = getSupabase()
          const { data, error } = await supabase
            .from('class_logs')
            .select('*')
            .order('date', { ascending: false })

          if (error) throw error
          set({ classLogs: data || [], isLoading: false })
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false, classLogs: existing })
        }
      },

      addClassLog: async (logData) => {
        set({ isLoading: true, error: null })
        try {
          const supabase = getSupabase()
          const { data, error } = await supabase
            .from('class_logs')
            .insert([logData])
            .select()
            .single()

          if (error) throw error
          set((state) => ({
            classLogs: [data, ...state.classLogs],
            isLoading: false,
          }))
          return data
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false })
          return null
        }
      },

      updateClassLog: async (id, logData) => {
        set({ isLoading: true, error: null })
        try {
          const supabase = getSupabase()
          const { error } = await supabase
            .from('class_logs')
            .update(logData)
            .eq('id', id)

          if (error) throw error
          set((state) => ({
            classLogs: state.classLogs.map((l) =>
              l.id === id ? { ...l, ...logData } : l
            ),
            isLoading: false,
          }))
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false })
        }
      },

      deleteClassLog: async (id) => {
        set({ isLoading: true, error: null })
        try {
          const supabase = getSupabase()
          const { error } = await supabase.from('class_logs').delete().eq('id', id)

          if (error) throw error
          set((state) => ({
            classLogs: state.classLogs.filter((l) => l.id !== id),
            isLoading: false,
          }))
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false })
        }
      },

      getLogsBySession: (sessionId) => {
        return get().classLogs.filter((l) => l.session_id === sessionId)
      },

      getLogsByStudent: (studentId) => {
        return get().classLogs.filter((l) => l.student_ids.includes(studentId))
      },

      getLogsByDateRange: (from, to) => {
        return get().classLogs.filter((l) => l.date >= from && l.date <= to)
      },

      getTechniqueFrequency: () => {
        const freq: Record<string, number> = {}
        get().classLogs.forEach((log) => {
          log.techniques_drilled.forEach((techId) => {
            freq[techId] = (freq[techId] || 0) + 1
          })
        })
        return freq
      },

      getRecentLogs: (count) => {
        return get().classLogs.slice(0, count)
      },
    }),
    {
      name: 'ecogram-class-logs',
      partialize: (state) => ({ classLogs: state.classLogs }),
    }
  )
)
