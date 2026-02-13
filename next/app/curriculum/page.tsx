'use client'

import { useEffect, useState } from 'react'
import { useCurriculumStore, useClassPrepStore } from '@/store'
import { Button, Card, Badge, Input, Select, Modal, ModalFooter, Textarea } from '@/components/ui'
import { Plus, Search, Edit, Trash2, Loader2, BookMarked, Calendar, ChevronRight, ArrowUp, ArrowDown } from 'lucide-react'
import { motion } from 'framer-motion'
import { capitalizeFirst } from '@/lib/utils'
import type { Curriculum, CurriculumFormData, BeltLevel, EnvironmentTag } from '@/types/database'

const beltOptions = [
  { value: '', label: 'No target' },
  { value: 'white', label: 'White' },
  { value: 'blue', label: 'Blue' },
  { value: 'purple', label: 'Purple' },
  { value: 'brown', label: 'Brown' },
  { value: 'black', label: 'Black' },
]

const envOptions = [
  { value: '', label: 'All environments' },
  { value: 'gi', label: 'Gi' },
  { value: 'nogi', label: 'No-Gi' },
  { value: 'wrestling', label: 'Wrestling' },
  { value: 'judo', label: 'Judo' },
  { value: 'mma', label: 'MMA' },
]

const beltColors: Record<string, string> = {
  white: 'bg-gray-200 text-gray-800',
  blue: 'bg-blue-500 text-white',
  purple: 'bg-purple-500 text-white',
  brown: 'bg-amber-800 text-white',
  black: 'bg-gray-900 text-white',
}

export default function CurriculumPage() {
  const { curricula, isLoading, fetchCurricula, addCurriculum, updateCurriculum, deleteCurriculum, reorderSessions } = useCurriculumStore()
  const { classPreps: sessions, fetchClassPreps } = useClassPrepStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCurriculum, setEditingCurriculum] = useState<Curriculum | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    fetchCurricula()
    fetchClassPreps()
  }, [fetchCurricula, fetchClassPreps])

  const handleEdit = (curriculum: Curriculum) => {
    setEditingCurriculum(curriculum)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Delete this curriculum?')) {
      await deleteCurriculum(id)
    }
  }

  const handleClose = () => {
    setIsModalOpen(false)
    setEditingCurriculum(null)
  }

  const handleSave = async (data: CurriculumFormData) => {
    if (editingCurriculum) {
      await updateCurriculum(editingCurriculum.id, data)
    } else {
      await addCurriculum(data)
    }
    handleClose()
  }

  const handleMoveSession = async (curriculumId: string, sessionIds: string[], index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === sessionIds.length - 1) return
    const newIds = [...sessionIds]
    const swapIdx = direction === 'up' ? index - 1 : index + 1
    ;[newIds[index], newIds[swapIdx]] = [newIds[swapIdx], newIds[index]]
    await reorderSessions(curriculumId, newIds)
  }

  const getSessionName = (id: string) => {
    const session = sessions.find((s) => s.id === id)
    return session?.name || 'Unknown Session'
  }

  return (
    <div className="content-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            <span className="gradient-text">Curriculum Planner</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            {curricula.length} curriculum plans
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-5 h-5 sm:mr-2" />
          <span className="hidden sm:inline">New Curriculum</span>
        </Button>
      </div>

      {/* Loading */}
      {isLoading && curricula.length === 0 && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && curricula.length === 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
          <div className="w-16 h-16 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookMarked className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">No curricula yet</h3>
          <p className="text-muted-foreground mb-6">Create a multi-week training plan for your students</p>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create First Curriculum
          </Button>
        </motion.div>
      )}

      {/* List */}
      {curricula.length > 0 && (
        <div className="space-y-4">
          {curricula.map((curr, i) => (
            <motion.div
              key={curr.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.05, 0.3) }}
            >
              <Card className="group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-foreground truncate">{curr.name}</h3>
                      {curr.target_belt_level && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${beltColors[curr.target_belt_level] || ''}`}>
                          {capitalizeFirst(curr.target_belt_level)}
                        </span>
                      )}
                    </div>

                    {curr.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{curr.description}</p>
                    )}

                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge variant="outline">
                        <Calendar className="w-3 h-3 mr-1" />
                        {curr.duration_weeks} weeks
                      </Badge>
                      {curr.environment && (
                        <Badge variant="outline" className="text-primary border-primary/30">
                          {curr.environment === 'nogi' ? 'No-Gi' : capitalizeFirst(curr.environment)}
                        </Badge>
                      )}
                      <Badge variant="outline">
                        {curr.session_ids.length} session{curr.session_ids.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>

                    {curr.goal && (
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Goal:</span> {curr.goal}
                      </p>
                    )}

                    {/* Expanded sessions with reorder */}
                    {expandedId === curr.id && curr.session_ids.length > 0 && (
                      <div className="mt-4 space-y-2 border-t border-border/50 pt-4">
                        {curr.session_ids.map((sid, j) => (
                          <div key={sid} className="flex items-center gap-2 text-sm group/session">
                            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">{j + 1}</span>
                            <span className="text-foreground flex-1">{getSessionName(sid)}</span>
                            <div className="flex items-center gap-0.5 opacity-0 group-hover/session:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleMoveSession(curr.id, curr.session_ids, j, 'up')}
                                disabled={j === 0}
                                className="p-1 rounded hover:bg-secondary/50 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleMoveSession(curr.id, curr.session_ids, j, 'down')}
                                disabled={j === curr.session_ids.length - 1}
                                className="p-1 rounded hover:bg-secondary/50 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {curr.session_ids.length > 0 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setExpandedId(expandedId === curr.id ? null : curr.id)}
                      >
                        <ChevronRight className={`w-4 h-4 transition-transform ${expandedId === curr.id ? 'rotate-90' : ''}`} />
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(curr)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(curr.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      <CurriculumModal
        isOpen={isModalOpen}
        onClose={handleClose}
        curriculum={editingCurriculum}
        onSave={handleSave}
        sessions={sessions}
      />
    </div>
  )
}

function CurriculumModal({ isOpen, onClose, curriculum, onSave, sessions }: {
  isOpen: boolean
  onClose: () => void
  curriculum: Curriculum | null
  onSave: (data: CurriculumFormData) => void
  sessions: { id: string; name: string }[]
}) {
  const [form, setForm] = useState<CurriculumFormData>({
    name: '',
    duration_weeks: 4,
    session_ids: [],
  })

  useEffect(() => {
    if (curriculum) {
      setForm({
        name: curriculum.name,
        description: curriculum.description || '',
        duration_weeks: curriculum.duration_weeks,
        goal: curriculum.goal || '',
        target_belt_level: curriculum.target_belt_level || undefined,
        environment: curriculum.environment || undefined,
        session_ids: curriculum.session_ids,
        progression_notes: curriculum.progression_notes || '',
      })
    } else {
      setForm({
        name: '',
        duration_weeks: 4,
        session_ids: [],
      })
    }
  }, [curriculum, isOpen])

  const toggleSession = (id: string) => {
    setForm((f) => ({
      ...f,
      session_ids: (f.session_ids || []).includes(id)
        ? (f.session_ids || []).filter((s) => s !== id)
        : [...(f.session_ids || []), id],
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    onSave(form)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={curriculum ? 'Edit Curriculum' : 'New Curriculum'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Name" placeholder="e.g., Blue Belt Fundamentals" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />

        <Textarea label="Description" placeholder="What does this curriculum cover?" rows={2} value={form.description || ''} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />

        <div className="grid grid-cols-3 gap-4">
          <Input label="Duration (weeks)" type="number" min={1} max={52} value={form.duration_weeks} onChange={(e) => setForm((f) => ({ ...f, duration_weeks: parseInt(e.target.value) || 4 }))} />
          <Select label="Target Belt" options={beltOptions} value={form.target_belt_level || ''} onChange={(e) => setForm((f) => ({ ...f, target_belt_level: (e.target.value || undefined) as BeltLevel | undefined }))} />
          <Select label="Environment" options={envOptions} value={form.environment || ''} onChange={(e) => setForm((f) => ({ ...f, environment: (e.target.value || undefined) as EnvironmentTag | undefined }))} />
        </div>

        <Textarea label="Goal" placeholder="What should students achieve?" rows={2} value={form.goal || ''} onChange={(e) => setForm((f) => ({ ...f, goal: e.target.value }))} />

        {/* Session selector */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Sessions ({(form.session_ids || []).length} selected)
          </label>
          <div className="max-h-48 overflow-y-auto space-y-1 border border-border/50 rounded-xl p-2">
            {sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No sessions available. Create sessions in Class Prep first.</p>
            ) : (
              sessions.map((s) => {
                const selected = (form.session_ids || []).includes(s.id)
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleSession(s.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      selected
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'text-foreground hover:bg-secondary/50'
                    }`}
                  >
                    {s.name}
                  </button>
                )
              })
            )}
          </div>
        </div>

        <Textarea label="Progression Notes" placeholder="How should this curriculum progress over time?" rows={2} value={form.progression_notes || ''} onChange={(e) => setForm((f) => ({ ...f, progression_notes: e.target.value }))} />

        <ModalFooter>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit">{curriculum ? 'Update' : 'Create Curriculum'}</Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
