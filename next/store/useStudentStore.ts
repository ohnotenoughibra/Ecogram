'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Student, StudentFilters, StudentFormData, BeltLevel } from '@/types/database'
import { getSupabase } from '@/lib/supabase'

interface StudentState {
  students: Student[]
  isLoading: boolean
  error: string | null
  filters: StudentFilters

  fetchStudents: () => Promise<void>
  addStudent: (data: StudentFormData) => Promise<Student | null>
  updateStudent: (id: string, data: Partial<StudentFormData>) => Promise<void>
  deleteStudent: (id: string) => Promise<void>
  setFilters: (filters: Partial<StudentFilters>) => void
  resetFilters: () => void
  filteredStudents: () => Student[]
  getStudentsByBelt: (belt: BeltLevel) => Student[]
}

const defaultFilters: StudentFilters = {
  search: '',
  belt_rank: '',
}

export const useStudentStore = create<StudentState>()(
  persist(
    (set, get) => ({
      students: [],
      isLoading: false,
      error: null,
      filters: defaultFilters,

      fetchStudents: async () => {
        set({ isLoading: true, error: null })
        try {
          const supabase = getSupabase()
          const { data, error } = await supabase
            .from('students')
            .select('*')
            .order('name', { ascending: true })

          if (error) throw error
          set({ students: data || [], isLoading: false })
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false })
        }
      },

      addStudent: async (studentData) => {
        set({ isLoading: true, error: null })
        try {
          const supabase = getSupabase()
          const { data, error } = await supabase
            .from('students')
            .insert([studentData])
            .select()
            .single()

          if (error) throw error
          set((state) => ({
            students: [data, ...state.students],
            isLoading: false,
          }))
          return data
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false })
          return null
        }
      },

      updateStudent: async (id, studentData) => {
        set({ isLoading: true, error: null })
        try {
          const supabase = getSupabase()
          const { error } = await supabase
            .from('students')
            .update(studentData)
            .eq('id', id)

          if (error) throw error
          set((state) => ({
            students: state.students.map((s) =>
              s.id === id ? { ...s, ...studentData } : s
            ),
            isLoading: false,
          }))
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false })
        }
      },

      deleteStudent: async (id) => {
        set({ isLoading: true, error: null })
        try {
          const supabase = getSupabase()
          const { error } = await supabase.from('students').delete().eq('id', id)

          if (error) throw error
          set((state) => ({
            students: state.students.filter((s) => s.id !== id),
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

      filteredStudents: () => {
        const { students, filters } = get()
        return students.filter((student) => {
          if (filters.search) {
            const search = filters.search.toLowerCase()
            if (!student.name.toLowerCase().includes(search)) return false
          }
          if (filters.belt_rank && student.belt_rank !== filters.belt_rank) return false
          return true
        })
      },

      getStudentsByBelt: (belt) => {
        return get().students.filter((s) => s.belt_rank === belt)
      },
    }),
    {
      name: 'ecogram-students',
      partialize: (state) => ({ filters: state.filters }),
    }
  )
)
