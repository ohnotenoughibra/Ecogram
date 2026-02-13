'use client'

import { useEffect, useState } from 'react'
import { useClassPrepStore, useGameStore, useTechniqueStore, useClassLogStore } from '@/store'
import { ClassPrepCard } from '@/components/ClassPrepCard'
import { ClassPrepModal } from '@/components/ClassPrepModal'
import { Button, Input, Select } from '@/components/ui'
import { Plus, Calendar, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import type { ClassPrep } from '@/types/database'

export default function ClassPrepPage() {
  const { classPreps, isLoading, fetchClassPreps, filters, setFilters } = useClassPrepStore()
  const { games, fetchGames } = useGameStore()
  const { fetchTechniques } = useTechniqueStore()
  const { fetchClassLogs } = useClassLogStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPrep, setEditingPrep] = useState<ClassPrep | null>(null)

  useEffect(() => {
    fetchClassPreps()
    fetchGames()
    fetchTechniques()
    fetchClassLogs()
  }, [fetchClassPreps, fetchGames, fetchTechniques, fetchClassLogs])

  const handleEdit = (prep: ClassPrep) => {
    setEditingPrep(prep)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingPrep(null)
  }

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

  const focusAreas = [...new Set(classPreps.map((p) => p.focus).filter(Boolean))]
  const focusOptions = [
    { value: '', label: 'All Focus Areas' },
    ...focusAreas.map((f) => ({ value: f!, label: f! })),
  ]

  return (
    <div className="content-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            <span className="gradient-text">Class Preparations</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            {classPreps.length} sessions planned
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-5 h-5 sm:mr-2" />
          <span className="hidden sm:inline">New Session</span>
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-card/50 backdrop-blur-sm rounded-xl p-4 mb-6 border border-border/50">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search sessions..."
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
            />
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap gap-2">
            <Select
              options={focusOptions}
              value={filters.focus}
              onChange={(e) => setFilters({ focus: e.target.value })}
              className="w-full sm:w-36"
            />
            <Input
              type="date"
              value={filters.date_from}
              onChange={(e) => setFilters({ date_from: e.target.value })}
              className="w-full sm:w-36"
            />
            <Input
              type="date"
              value={filters.date_to}
              onChange={(e) => setFilters({ date_to: e.target.value })}
              className="w-full sm:w-36"
            />
          </div>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && classPreps.length === 0 && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16 sm:py-20"
        >
          <div className="w-16 h-16 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">No sessions found</h3>
          <p className="text-muted-foreground mb-6">
            {classPreps.length === 0
              ? 'Plan your first class session'
              : 'Try adjusting your filters'}
          </p>
          {classPreps.length === 0 && (
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Plan Your First Session
            </Button>
          )}
        </motion.div>
      )}

      {/* Session list */}
      {filtered.length > 0 && (
        <div className="space-y-4">
          {filtered.map((prep, i) => (
            <motion.div
              key={prep.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.05, 0.3) }}
            >
              <ClassPrepCard
                prep={prep}
                games={games}
                onEdit={() => handleEdit(prep)}
              />
            </motion.div>
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
