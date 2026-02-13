'use client'

import { useEffect, useState } from 'react'
import { useClassLogStore, useStudentStore, useClassPrepStore } from '@/store'
import { useToast } from '@/components/Toast'
import { Button, Card, Badge, Input, Select, Modal, ModalFooter, Textarea } from '@/components/ui'
import { Plus, Search, Edit, Trash2, Loader2, ClipboardList, Calendar, Zap, ChevronDown } from 'lucide-react'
import { motion } from 'framer-motion'
import { capitalizeFirst } from '@/lib/utils'
import type { ClassLog, ClassLogFormData, Intensity } from '@/types/database'

const intensityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

const intensityColors: Record<string, string> = {
  low: 'text-success',
  medium: 'text-warning',
  high: 'text-error',
}

export default function ClassLogPage() {
  const { classLogs, isLoading, fetchClassLogs, addClassLog, updateClassLog, deleteClassLog } = useClassLogStore()
  const { students, fetchStudents } = useStudentStore()
  const { classPreps: sessions, fetchClassPreps } = useClassPrepStore()
  const { confirm: confirmDialog, success: toastSuccess } = useToast()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingLog, setEditingLog] = useState<ClassLog | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    fetchClassLogs()
    fetchStudents()
    fetchClassPreps()
  }, [fetchClassLogs, fetchStudents, fetchClassPreps])

  const handleEdit = (log: ClassLog) => {
    setEditingLog(log)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    const ok = await confirmDialog({
      title: 'Delete Class Log',
      description: 'This class log entry will be permanently removed.',
      confirmLabel: 'Delete',
      variant: 'danger',
    })
    if (ok) {
      await deleteClassLog(id)
      toastSuccess('Class log deleted')
    }
  }

  const handleClose = () => {
    setIsModalOpen(false)
    setEditingLog(null)
  }

  const handleSave = async (data: ClassLogFormData) => {
    if (editingLog) {
      await updateClassLog(editingLog.id, data)
      toastSuccess('Class log updated')
    } else {
      await addClassLog(data)
      toastSuccess('Class logged')
    }
    handleClose()
  }

  const getSessionName = (id: string | null) => {
    if (!id) return null
    const session = sessions.find((s) => s.id === id)
    return session?.name || null
  }

  const getStudentNames = (ids: string[]) => {
    return ids.map((id) => {
      const student = students.find((s) => s.id === id)
      return student?.name || 'Unknown'
    })
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="content-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            <span className="gradient-text">Class Log</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            {classLogs.length} logged sessions
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-5 h-5 sm:mr-2" />
          <span className="hidden sm:inline">Log Class</span>
        </Button>
      </div>

      {/* Loading */}
      {isLoading && classLogs.length === 0 && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && classLogs.length === 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
          <div className="w-16 h-16 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">No class logs yet</h3>
          <p className="text-muted-foreground mb-6">Log your classes to track what worked and what to revisit</p>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Log Your First Class
          </Button>
        </motion.div>
      )}

      {/* List */}
      {classLogs.length > 0 && (
        <div className="space-y-3">
          {classLogs.map((log, i) => {
            const sessionName = getSessionName(log.session_id)
            const studentNames = getStudentNames(log.student_ids)
            const expanded = expandedId === log.id

            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.05, 0.3) }}
              >
                <Card className="group">
                  <div
                    className="flex items-start justify-between gap-3 cursor-pointer"
                    onClick={() => setExpandedId(expanded ? null : log.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-foreground">
                          {formatDate(log.date)}
                        </h3>
                        <span className={`flex items-center gap-1 text-sm ${intensityColors[log.intensity_level]}`}>
                          <Zap className="w-3.5 h-3.5" />
                          {capitalizeFirst(log.intensity_level)}
                        </span>
                      </div>

                      {sessionName && (
                        <p className="text-sm text-primary mb-1">{sessionName}</p>
                      )}

                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="outline">
                          {log.duration_minutes} min
                        </Badge>
                        {log.student_ids.length > 0 && (
                          <Badge variant="outline">
                            {log.student_ids.length} student{log.student_ids.length !== 1 ? 's' : ''}
                          </Badge>
                        )}
                        {log.techniques_drilled.length > 0 && (
                          <Badge variant="outline">
                            {log.techniques_drilled.length} technique{log.techniques_drilled.length !== 1 ? 's' : ''} drilled
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`} />
                    </div>
                  </div>

                  {/* Expanded details */}
                  {expanded && (
                    <div className="mt-4 pt-4 border-t border-border/50 space-y-3">
                      {studentNames.length > 0 && (
                        <div>
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Students</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {studentNames.map((name) => (
                              <span key={name} className="px-2 py-0.5 bg-secondary/50 rounded-full text-xs text-foreground">{name}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {log.techniques_drilled.length > 0 && (
                        <div>
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Techniques Drilled</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {log.techniques_drilled.map((t) => (
                              <span key={t} className="px-2 py-0.5 bg-primary/10 border border-primary/20 rounded-full text-xs text-primary">{t}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {log.what_worked && (
                        <div>
                          <span className="text-xs font-medium text-success uppercase tracking-wider">What Worked</span>
                          <p className="text-sm text-foreground mt-1">{log.what_worked}</p>
                        </div>
                      )}

                      {log.what_to_revisit && (
                        <div>
                          <span className="text-xs font-medium text-warning uppercase tracking-wider">To Revisit</span>
                          <p className="text-sm text-foreground mt-1">{log.what_to_revisit}</p>
                        </div>
                      )}

                      {log.coach_notes && (
                        <div>
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Coach Notes</span>
                          <p className="text-sm text-foreground mt-1">{log.coach_notes}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-2">
                        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleEdit(log) }}>
                          <Edit className="w-4 h-4 mr-1" /> Edit
                        </Button>
                        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleDelete(log.id) }}>
                          <Trash2 className="w-4 h-4 mr-1" /> Delete
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      <ClassLogModal
        isOpen={isModalOpen}
        onClose={handleClose}
        log={editingLog}
        onSave={handleSave}
        students={students}
        sessions={sessions}
      />
    </div>
  )
}

function ClassLogModal({ isOpen, onClose, log, onSave, students, sessions }: {
  isOpen: boolean
  onClose: () => void
  log: ClassLog | null
  onSave: (data: ClassLogFormData) => void
  students: { id: string; name: string }[]
  sessions: { id: string; name: string }[]
}) {
  const [form, setForm] = useState<ClassLogFormData>({
    date: new Date().toISOString().split('T')[0],
    intensity_level: 'medium',
    duration_minutes: 60,
    student_ids: [],
    techniques_drilled: [],
  })
  const [techniquesInput, setTechniquesInput] = useState('')

  useEffect(() => {
    if (log) {
      setForm({
        session_id: log.session_id || undefined,
        date: log.date.split('T')[0],
        student_ids: log.student_ids,
        coach_notes: log.coach_notes || '',
        techniques_drilled: log.techniques_drilled,
        intensity_level: log.intensity_level,
        what_worked: log.what_worked || '',
        what_to_revisit: log.what_to_revisit || '',
        duration_minutes: log.duration_minutes,
      })
      setTechniquesInput(log.techniques_drilled.join(', '))
    } else {
      setForm({
        date: new Date().toISOString().split('T')[0],
        intensity_level: 'medium',
        duration_minutes: 60,
        student_ids: [],
        techniques_drilled: [],
      })
      setTechniquesInput('')
    }
  }, [log, isOpen])

  const toggleStudent = (id: string) => {
    setForm((f) => ({
      ...f,
      student_ids: (f.student_ids || []).includes(id)
        ? (f.student_ids || []).filter((s) => s !== id)
        : [...(f.student_ids || []), id],
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(form)
  }

  const sessionOptions = [
    { value: '', label: 'No linked session' },
    ...sessions.map((s) => ({ value: s.id, label: s.name })),
  ]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={log ? 'Edit Class Log' : 'Log a Class'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Date" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
          <Input label="Duration (min)" type="number" min={1} max={300} value={form.duration_minutes} onChange={(e) => setForm((f) => ({ ...f, duration_minutes: parseInt(e.target.value) || 60 }))} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select label="Intensity" options={intensityOptions} value={form.intensity_level} onChange={(e) => setForm((f) => ({ ...f, intensity_level: e.target.value as Intensity }))} />
          <Select label="Linked Session" options={sessionOptions} value={form.session_id || ''} onChange={(e) => setForm((f) => ({ ...f, session_id: e.target.value || undefined }))} />
        </div>

        {/* Student attendance */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Students ({(form.student_ids || []).length} present)
          </label>
          <div className="max-h-36 overflow-y-auto space-y-1 border border-border/50 rounded-xl p-2">
            {students.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-3">No students yet. Add students in Student Roster.</p>
            ) : (
              students.map((s) => {
                const selected = (form.student_ids || []).includes(s.id)
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleStudent(s.id)}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
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

        <Input
          label="Techniques Drilled"
          placeholder="armbar, scissor sweep, collar choke (comma separated)"
          value={techniquesInput}
          onChange={(e) => {
            setTechniquesInput(e.target.value)
            setForm((f) => ({ ...f, techniques_drilled: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) }))
          }}
          hint={`${form.techniques_drilled?.length || 0} techniques`}
        />

        <Textarea label="What Worked" placeholder="What went well in this class?" rows={2} value={form.what_worked || ''} onChange={(e) => setForm((f) => ({ ...f, what_worked: e.target.value }))} />

        <Textarea label="What to Revisit" placeholder="What needs more work next time?" rows={2} value={form.what_to_revisit || ''} onChange={(e) => setForm((f) => ({ ...f, what_to_revisit: e.target.value }))} />

        <Textarea label="Coach Notes" placeholder="Any additional observations..." rows={2} value={form.coach_notes || ''} onChange={(e) => setForm((f) => ({ ...f, coach_notes: e.target.value }))} />

        <ModalFooter>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit">{log ? 'Update' : 'Log Class'}</Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
