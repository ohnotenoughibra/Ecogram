'use client'

import { useEffect, useState } from 'react'
import { useClassPrepStore, useGameStore } from '@/store'
import { ClassPrepCard } from '@/components/ClassPrepCard'
import { ClassPrepModal } from '@/components/ClassPrepModal'
import { Button, Input, Select } from '@/components/ui'
import type { ClassPrep } from '@/types/database'

export default function ClassPrepPage() {
  const { classPreps, isLoading, fetchClassPreps, filters, setFilters } = useClassPrepStore()
  const { games, fetchGames } = useGameStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPrep, setEditingPrep] = useState<ClassPrep | null>(null)

  useEffect(() => {
    fetchClassPreps()
    fetchGames()
  }, [fetchClassPreps, fetchGames])

  const handleEdit = (prep: ClassPrep) => {
    setEditingPrep(prep)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingPrep(null)
  }

  // Filter class preps
  const filtered = classPreps.filter((prep) => {
    if (filters.search) {
      const search = filters.search.toLowerCase()
      if (!prep.name.toLowerCase().includes(search)) return false
    }
    if (filters.focus && prep.focus !== filters.focus) return false
    if (filters.date_from && prep.date < filters.date_from) return false
    if (filters.date_to && prep.date > filters.date_to) return false
    return true
  })

  // Get unique focus areas
  const focusAreas = [...new Set(classPreps.map((p) => p.focus).filter(Boolean))]
  const focusOptions = [
    { value: '', label: 'All Focus Areas' },
    ...focusAreas.map((f) => ({ value: f!, label: f! })),
  ]

  return (
    <div className="content-container">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Class Preparations</h1>
          <p className="text-gray-400 mt-1">
            {classPreps.length} sessions planned
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          New Session
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-[#0A0A0A] rounded-xl p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search sessions..."
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
            />
          </div>
          <Select
            options={focusOptions}
            value={filters.focus}
            onChange={(e) => setFilters({ focus: e.target.value })}
            className="w-40"
          />
          <Input
            type="date"
            value={filters.date_from}
            onChange={(e) => setFilters({ date_from: e.target.value })}
            className="w-40"
          />
          <Input
            type="date"
            value={filters.date_to}
            onChange={(e) => setFilters({ date_to: e.target.value })}
            className="w-40"
          />
        </div>
      </div>

      {/* Loading state */}
      {isLoading && classPreps.length === 0 && (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-[#1A1A1A] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No sessions found</h3>
          <p className="text-gray-400 mb-6">
            {classPreps.length === 0
              ? 'Plan your first class session'
              : 'Try adjusting your filters'}
          </p>
          {classPreps.length === 0 && (
            <Button onClick={() => setIsModalOpen(true)}>Plan Your First Session</Button>
          )}
        </div>
      )}

      {/* Session list */}
      {filtered.length > 0 && (
        <div className="space-y-4">
          {filtered.map((prep) => (
            <ClassPrepCard
              key={prep.id}
              prep={prep}
              games={games}
              onEdit={() => handleEdit(prep)}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <ClassPrepModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        prep={editingPrep}
        games={games}
      />
    </div>
  )
}
