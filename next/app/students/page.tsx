'use client'

import { useEffect, useState } from 'react'
import { useStudentStore } from '@/store'
import { Button, Card, Badge, Input, Select, Modal, ModalFooter, Textarea } from '@/components/ui'
import { Plus, Search, Edit, Trash2, Loader2, Users, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { capitalizeFirst } from '@/lib/utils'
import type { Student, StudentFormData, BeltLevel, EnvironmentTag } from '@/types/database'

const beltOptions = [
  { value: '', label: 'All Belts' },
  { value: 'white', label: 'White' },
  { value: 'blue', label: 'Blue' },
  { value: 'purple', label: 'Purple' },
  { value: 'brown', label: 'Brown' },
  { value: 'black', label: 'Black' },
]

const beltColors: Record<string, string> = {
  white: 'bg-gray-200 text-gray-800',
  blue: 'bg-blue-500 text-white',
  purple: 'bg-purple-500 text-white',
  brown: 'bg-amber-800 text-white',
  black: 'bg-gray-900 text-white',
}

const envOptions = [
  { value: '', label: 'No preference' },
  { value: 'gi', label: 'Gi' },
  { value: 'nogi', label: 'No-Gi' },
  { value: 'wrestling', label: 'Wrestling' },
  { value: 'judo', label: 'Judo' },
  { value: 'mma', label: 'MMA' },
]

export default function StudentsPage() {
  const { students, isLoading, fetchStudents, addStudent, updateStudent, deleteStudent, filteredStudents, setFilters } = useStudentStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [searchValue, setSearchValue] = useState('')

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  const handleSearch = (value: string) => {
    setSearchValue(value)
    setFilters({ search: value })
  }

  const handleEdit = (student: Student) => {
    setEditingStudent(student)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Remove this student?')) {
      await deleteStudent(id)
    }
  }

  const handleClose = () => {
    setIsModalOpen(false)
    setEditingStudent(null)
  }

  const handleSave = async (data: StudentFormData) => {
    if (editingStudent) {
      await updateStudent(editingStudent.id, data)
    } else {
      await addStudent(data)
    }
    handleClose()
  }

  const filtered = filteredStudents()

  return (
    <div className="content-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            <span className="gradient-text">Student Roster</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            {students.length} athletes &middot; {filtered.length} shown
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-5 h-5 sm:mr-2" />
          <span className="hidden sm:inline">Add Student</span>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search students..."
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-secondary/50 border border-border/50 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <select
          onChange={(e) => setFilters({ belt_rank: e.target.value as BeltLevel | '' })}
          className="bg-secondary/50 border border-border/50 rounded-xl px-3 py-2.5 text-sm text-foreground"
        >
          {beltOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Loading */}
      {isLoading && students.length === 0 && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filtered.length === 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
          <div className="w-16 h-16 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">No students found</h3>
          <p className="text-muted-foreground mb-6">
            {students.length === 0 ? 'Add your first student to start tracking' : 'Try adjusting your filters'}
          </p>
          {students.length === 0 && (
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Student
            </Button>
          )}
        </motion.div>
      )}

      {/* Grid */}
      {filtered.length > 0 && (
        <div className="card-grid">
          {filtered.map((student, i) => (
            <motion.div
              key={student.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.05, 0.3) }}
            >
              <Card className="group relative">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{student.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${beltColors[student.belt_rank] || ''}`}>
                        {capitalizeFirst(student.belt_rank)} {student.stripes > 0 ? `${'●'.repeat(student.stripes)}` : ''}
                      </span>
                    </div>
                  </div>
                  {student.environment_preference && (
                    <Badge variant="outline" className="text-primary border-primary/30">
                      {student.environment_preference === 'nogi' ? 'No-Gi' : capitalizeFirst(student.environment_preference)}
                    </Badge>
                  )}
                </div>

                {student.competition_goals && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{student.competition_goals}</p>
                )}

                <div className="flex flex-wrap gap-2 mb-3">
                  {student.strengths.slice(0, 2).map((s) => (
                    <span key={s} className="px-2 py-0.5 bg-success/10 border border-success/20 rounded-full text-xs text-success">
                      {s}
                    </span>
                  ))}
                  {student.weaknesses.slice(0, 2).map((w) => (
                    <span key={w} className="px-2 py-0.5 bg-error/10 border border-error/20 rounded-full text-xs text-error">
                      {w}
                    </span>
                  ))}
                </div>

                {student.injury_notes && (
                  <div className="flex items-center gap-1.5 text-xs text-warning mb-3">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span className="truncate">{student.injury_notes}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(student)}>
                    <Edit className="w-4 h-4 mr-1" /> Edit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(student.id)}>
                    <Trash2 className="w-4 h-4 mr-1" /> Remove
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      <StudentModal
        isOpen={isModalOpen}
        onClose={handleClose}
        student={editingStudent}
        onSave={handleSave}
      />
    </div>
  )
}

function StudentModal({ isOpen, onClose, student, onSave }: {
  isOpen: boolean
  onClose: () => void
  student: Student | null
  onSave: (data: StudentFormData) => void
}) {
  const [form, setForm] = useState<StudentFormData>({
    name: '',
    belt_rank: 'white',
    stripes: 0,
    start_date: new Date().toISOString().split('T')[0],
    strengths: [],
    weaknesses: [],
  })
  const [strengthsInput, setStrengthsInput] = useState('')
  const [weaknessesInput, setWeaknessesInput] = useState('')

  useEffect(() => {
    if (student) {
      setForm({
        name: student.name,
        belt_rank: student.belt_rank,
        stripes: student.stripes,
        start_date: student.start_date,
        competition_goals: student.competition_goals || '',
        strengths: student.strengths,
        weaknesses: student.weaknesses,
        injury_notes: student.injury_notes || '',
        notes: student.notes || '',
        environment_preference: student.environment_preference || undefined,
      })
      setStrengthsInput(student.strengths.join(', '))
      setWeaknessesInput(student.weaknesses.join(', '))
    } else {
      setForm({
        name: '',
        belt_rank: 'white',
        stripes: 0,
        start_date: new Date().toISOString().split('T')[0],
        strengths: [],
        weaknesses: [],
      })
      setStrengthsInput('')
      setWeaknessesInput('')
    }
  }, [student, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    onSave(form)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={student ? 'Edit Student' : 'Add Student'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Name" placeholder="Student name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />

        <div className="grid grid-cols-3 gap-4">
          <Select label="Belt" options={beltOptions.filter((o) => o.value !== '')} value={form.belt_rank} onChange={(e) => setForm((f) => ({ ...f, belt_rank: e.target.value as BeltLevel }))} />
          <Input label="Stripes" type="number" min={0} max={4} value={form.stripes} onChange={(e) => setForm((f) => ({ ...f, stripes: parseInt(e.target.value) || 0 }))} />
          <Input label="Start Date" type="date" value={form.start_date} onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))} />
        </div>

        <Select label="Environment Preference" options={envOptions} value={form.environment_preference || ''} onChange={(e) => setForm((f) => ({ ...f, environment_preference: (e.target.value || undefined) as EnvironmentTag | undefined }))} />

        <Textarea label="Competition Goals" placeholder="What are they training for?" rows={2} value={form.competition_goals || ''} onChange={(e) => setForm((f) => ({ ...f, competition_goals: e.target.value }))} />

        <Input
          label="Strengths"
          placeholder="guard, sweeps, submissions (comma separated)"
          value={strengthsInput}
          onChange={(e) => {
            setStrengthsInput(e.target.value)
            setForm((f) => ({ ...f, strengths: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) }))
          }}
          hint={`${form.strengths?.length || 0} strengths`}
        />

        <Input
          label="Weaknesses"
          placeholder="passing, takedowns, back defense (comma separated)"
          value={weaknessesInput}
          onChange={(e) => {
            setWeaknessesInput(e.target.value)
            setForm((f) => ({ ...f, weaknesses: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) }))
          }}
          hint={`${form.weaknesses?.length || 0} weaknesses`}
        />

        <Textarea label="Injury Notes" placeholder="Any current injuries or limitations..." rows={2} value={form.injury_notes || ''} onChange={(e) => setForm((f) => ({ ...f, injury_notes: e.target.value }))} />

        <Textarea label="Notes" placeholder="Additional notes..." rows={2} value={form.notes || ''} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />

        <ModalFooter>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit">{student ? 'Update' : 'Add Student'}</Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
