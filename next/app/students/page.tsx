'use client'

import { useEffect, useState, useMemo } from 'react'
import { useStudentStore, useClassLogStore, useTechniqueStore } from '@/store'
import { Button, Card, Badge, Input, Select, Modal, ModalFooter, Textarea } from '@/components/ui'
import { Plus, Search, Edit, Trash2, Loader2, Users, AlertCircle, ChevronRight, TrendingUp, CheckCircle2, Circle, Award, Calendar, BarChart3, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import { capitalizeFirst, formatDate } from '@/lib/utils'
import type { Student, StudentFormData, BeltLevel, EnvironmentTag, Technique, ClassLog, Intensity } from '@/types/database'

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

const BELT_ORDER: BeltLevel[] = ['white', 'blue', 'purple', 'brown', 'black']

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
  const { classLogs, fetchClassLogs } = useClassLogStore()
  const { techniques, fetchTechniques } = useTechniqueStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [searchValue, setSearchValue] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)

  useEffect(() => {
    fetchStudents()
    fetchClassLogs()
    fetchTechniques()
  }, [fetchStudents, fetchClassLogs, fetchTechniques])

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
  const selectedStudent = selectedStudentId ? students.find((s) => s.id === selectedStudentId) : null

  if (selectedStudent) {
    return (
      <StudentProgressView
        student={selectedStudent}
        classLogs={classLogs}
        techniques={techniques}
        onBack={() => setSelectedStudentId(null)}
        onEdit={() => handleEdit(selectedStudent)}
      />
    )
  }

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
              <Card className="group relative cursor-pointer" onClick={() => setSelectedStudentId(student.id)}>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{student.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${beltColors[student.belt_rank] || ''}`}>
                        {capitalizeFirst(student.belt_rank)} {student.stripes > 0 ? `${'●'.repeat(student.stripes)}` : ''}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {student.environment_preference && (
                      <Badge variant="outline" className="text-primary border-primary/30">
                        {student.environment_preference === 'nogi' ? 'No-Gi' : capitalizeFirst(student.environment_preference)}
                      </Badge>
                    )}
                    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
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

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
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

// ─── Phase 7: Student Progress View ─────────────────────────────────

function StudentProgressView({
  student,
  classLogs,
  techniques,
  onBack,
  onEdit,
}: {
  student: Student
  classLogs: ClassLog[]
  techniques: Technique[]
  onBack: () => void
  onEdit: () => void
}) {
  const [techFilter, setTechFilter] = useState<'all' | 'learned' | 'unlearned'>('all')

  const progress = useMemo(() => {
    const studentLogs = classLogs
      .filter((l) => l.student_ids.includes(student.id))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    const drilledSet = new Set<string>()
    studentLogs.forEach((l) => {
      l.techniques_drilled.forEach((t) => drilledSet.add(t))
    })

    const drillFreq: Record<string, number> = {}
    studentLogs.forEach((l) => {
      l.techniques_drilled.forEach((t) => {
        drillFreq[t] = (drillFreq[t] || 0) + 1
      })
    })

    const beltIdx = BELT_ORDER.indexOf(student.belt_rank)
    const eligibleTechniques = techniques.filter((t) => {
      const minIdx = BELT_ORDER.indexOf(t.belt_level_min)
      const maxIdx = BELT_ORDER.indexOf(t.belt_level_max)
      return beltIdx >= minIdx && beltIdx <= maxIdx
    })

    const techniqueProgress = eligibleTechniques.map((tech) => {
      const drillCount = drillFreq[tech.name] || 0
      const isLearned = drillCount > 0
      const prereqsMet = (tech.prerequisite_ids || []).every((pid) => {
        const prereq = techniques.find((t) => t.id === pid)
        return prereq ? (drillFreq[prereq.name] || 0) > 0 : false
      })
      return { technique: tech, drillCount, isLearned, prereqsMet }
    })

    const learnedCount = techniqueProgress.filter((tp) => tp.isLearned).length
    const totalEligible = eligibleTechniques.length
    const completionPct = totalEligible > 0 ? Math.round((learnedCount / totalEligible) * 100) : 0

    const totalClasses = studentLogs.length
    const last30Days = studentLogs.filter(
      (l) => (Date.now() - new Date(l.date).getTime()) / 86400000 <= 30
    ).length

    const intensityDist: Record<Intensity, number> = { low: 0, medium: 0, high: 0 }
    studentLogs.forEach((l) => { intensityDist[l.intensity_level]++ })

    const weaknessProgress = student.weaknesses.map((weakness) => {
      const lower = weakness.toLowerCase()
      const relatedTechs = eligibleTechniques.filter((t) =>
        t.tags.some((tag) => tag.toLowerCase().includes(lower)) ||
        t.name.toLowerCase().includes(lower) ||
        t.category.toLowerCase().includes(lower) ||
        t.position.toLowerCase().includes(lower)
      )
      const drilled = relatedTechs.filter((t) => (drillFreq[t.name] || 0) > 0).length
      return {
        weakness,
        relatedCount: relatedTechs.length,
        drilledCount: drilled,
        pct: relatedTechs.length > 0 ? Math.round((drilled / relatedTechs.length) * 100) : 0,
      }
    })

    const nextBeltIdx = Math.min(beltIdx + 1, BELT_ORDER.length - 1)
    const nextBelt = BELT_ORDER[nextBeltIdx]
    const nextBeltTechs = techniques.filter((t) => {
      const minIdx = BELT_ORDER.indexOf(t.belt_level_min)
      return minIdx <= nextBeltIdx
    })
    const nextBeltLearned = nextBeltTechs.filter((t) => (drillFreq[t.name] || 0) > 0).length
    const beltReadinessPct = nextBeltTechs.length > 0
      ? Math.round((nextBeltLearned / nextBeltTechs.length) * 100) : 0

    const recentNotes = studentLogs
      .filter((l) => l.what_worked || l.what_to_revisit || l.coach_notes)
      .slice(0, 5)

    return {
      studentLogs, techniqueProgress, learnedCount, totalEligible, completionPct,
      totalClasses, last30Days, intensityDist, weaknessProgress,
      nextBelt, beltReadinessPct, nextBeltLearned, nextBeltTotal: nextBeltTechs.length, recentNotes,
    }
  }, [student, classLogs, techniques])

  const displayedTechniques = useMemo(() => {
    switch (techFilter) {
      case 'learned': return progress.techniqueProgress.filter((tp) => tp.isLearned)
      case 'unlearned': return progress.techniqueProgress.filter((tp) => !tp.isLearned)
      default: return progress.techniqueProgress
    }
  }, [progress.techniqueProgress, techFilter])

  return (
    <div className="content-container">
      {/* Header */}
      <div className="mb-6">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Roster
        </button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{student.name}</h1>
            <div className="flex items-center gap-3 mt-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${beltColors[student.belt_rank] || ''}`}>
                {capitalizeFirst(student.belt_rank)} {student.stripes > 0 ? `${'●'.repeat(student.stripes)}` : ''}
              </span>
              {student.environment_preference && (
                <Badge variant="outline">{student.environment_preference === 'nogi' ? 'No-Gi' : capitalizeFirst(student.environment_preference)}</Badge>
              )}
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={onEdit}>
            <Edit className="w-4 h-4 mr-1" /> Edit
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Classes', value: progress.totalClasses, icon: Calendar, color: 'text-primary' },
          { label: 'Last 30 Days', value: progress.last30Days, icon: TrendingUp, color: 'text-success' },
          { label: 'Techniques', value: `${progress.learnedCount}/${progress.totalEligible}`, icon: CheckCircle2, color: 'text-accent' },
          { label: 'Belt Readiness', value: `${progress.beltReadinessPct}%`, icon: Award, color: 'text-warning' },
        ].map((stat, i) => {
          const Icon = stat.icon
          return (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="text-center">
                <Icon className={`w-5 h-5 ${stat.color} mx-auto mb-2`} />
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Belt Readiness + Weakness Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-warning" />
            <h2 className="text-lg font-semibold text-foreground">{capitalizeFirst(progress.nextBelt)} Belt Readiness</h2>
          </div>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-foreground">Overall Progress</span>
              <span className="text-sm font-medium text-foreground">{progress.beltReadinessPct}%</span>
            </div>
            <div className="h-4 bg-secondary rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress.beltReadinessPct}%` }}
                transition={{ duration: 1 }}
                className={`h-full rounded-full ${
                  progress.beltReadinessPct >= 80 ? 'bg-success' : progress.beltReadinessPct >= 50 ? 'bg-warning' : 'bg-error'
                }`}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {progress.nextBeltLearned} of {progress.nextBeltTotal} techniques for {progress.nextBelt} belt mastered
            </p>
          </div>
          <div className="border-t border-border/50 pt-4">
            <h3 className="text-sm font-medium text-foreground mb-3">Training Intensity Profile</h3>
            <div className="flex gap-3">
              {(['low', 'medium', 'high'] as Intensity[]).map((level) => {
                const count = progress.intensityDist[level]
                const pct = progress.totalClasses > 0 ? Math.round((count / progress.totalClasses) * 100) : 0
                const color = level === 'high' ? 'bg-error' : level === 'medium' ? 'bg-warning' : 'bg-success'
                return (
                  <div key={level} className="flex-1 text-center">
                    <div className="h-16 bg-secondary rounded-lg overflow-hidden flex items-end">
                      <motion.div initial={{ height: 0 }} animate={{ height: `${Math.max(pct, 5)}%` }} transition={{ duration: 0.6 }} className={`w-full ${color} rounded-t-sm`} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 capitalize">{level}</p>
                    <p className="text-xs text-foreground font-medium">{count}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-success" />
            <h2 className="text-lg font-semibold text-foreground">Weakness Progress</h2>
          </div>
          {progress.weaknessProgress.length === 0 ? (
            <p className="text-sm text-muted-foreground">No weaknesses listed. Edit the student to add areas to track.</p>
          ) : (
            <div className="space-y-4">
              {progress.weaknessProgress.map((wp) => (
                <div key={wp.weakness}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-foreground capitalize">{wp.weakness}</span>
                    <span className="text-xs text-muted-foreground">{wp.drilledCount}/{wp.relatedCount} ({wp.pct}%)</span>
                  </div>
                  <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${wp.pct}%` }} transition={{ duration: 0.8 }}
                      className={`h-full rounded-full ${wp.pct >= 75 ? 'bg-success' : wp.pct >= 40 ? 'bg-warning' : 'bg-error'}`} />
                  </div>
                </div>
              ))}
            </div>
          )}
          {student.strengths.length > 0 && (
            <div className="border-t border-border/50 pt-4 mt-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Strengths</p>
              <div className="flex flex-wrap gap-1.5">
                {student.strengths.map((s) => (
                  <span key={s} className="px-2 py-0.5 bg-success/10 border border-success/20 rounded-full text-xs text-success">{s}</span>
                ))}
              </div>
            </div>
          )}
          {student.injury_notes && (
            <div className="border-t border-border/50 pt-4 mt-4">
              <div className="flex items-center gap-1.5 text-xs text-warning">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{student.injury_notes}</span>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Technique Checklist */}
      <Card className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Technique Checklist ({progress.learnedCount}/{progress.totalEligible})</h2>
          </div>
          <div className="flex items-center gap-1 p-0.5 bg-secondary/50 rounded-lg">
            {([
              { key: 'all' as const, label: 'All' },
              { key: 'learned' as const, label: 'Learned' },
              { key: 'unlearned' as const, label: 'To Learn' },
            ]).map((f) => (
              <button key={f.key} onClick={() => setTechFilter(f.key)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  techFilter === f.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden mb-4">
          <motion.div initial={{ width: 0 }} animate={{ width: `${progress.completionPct}%` }} transition={{ duration: 1 }} className="h-full bg-gradient-to-r from-primary to-accent rounded-full" />
        </div>
        {displayedTechniques.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            {techFilter === 'learned' ? 'No techniques learned yet.' : techFilter === 'unlearned' ? 'All eligible techniques drilled!' : 'No eligible techniques for this belt level.'}
          </p>
        ) : (
          <div className="space-y-1.5 max-h-96 overflow-y-auto">
            {displayedTechniques.map((tp) => (
              <div key={tp.technique.id}
                className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                  tp.isLearned ? 'bg-success/5 border border-success/10' : 'bg-background/50 border border-border/30'
                }`}>
                <div className="flex items-center gap-3">
                  {tp.isLearned
                    ? <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                    : <Circle className={`w-4 h-4 flex-shrink-0 ${tp.prereqsMet ? 'text-muted-foreground/40' : 'text-error/40'}`} />}
                  <div>
                    <span className="text-sm text-foreground">{tp.technique.name}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-muted-foreground capitalize">{tp.technique.category}</span>
                      <span className="text-[10px] text-muted-foreground">{capitalizeFirst(tp.technique.position)}</span>
                      {!tp.prereqsMet && !tp.isLearned && <span className="text-[10px] text-error">Missing prereqs</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {tp.drillCount > 0 && <span className="text-xs text-muted-foreground">{tp.drillCount}x</span>}
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${beltColors[tp.technique.belt_level_min] || ''}`}>
                    {capitalizeFirst(tp.technique.belt_level_min)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Recent Coaching Notes */}
      {progress.recentNotes.length > 0 && (
        <Card className="mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Recent Coaching Notes</h2>
          <div className="space-y-4">
            {progress.recentNotes.map((log) => (
              <div key={log.id} className="border-b border-border/30 pb-3 last:border-0 last:pb-0">
                <p className="text-xs text-muted-foreground mb-1">{formatDate(log.date)}</p>
                {log.coach_notes && <p className="text-sm text-foreground mb-1">{log.coach_notes}</p>}
                {log.what_worked && <p className="text-sm text-foreground"><span className="text-success font-medium">Worked: </span>{log.what_worked}</p>}
                {log.what_to_revisit && <p className="text-sm text-foreground mt-0.5"><span className="text-warning font-medium">Revisit: </span>{log.what_to_revisit}</p>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Attendance History */}
      {progress.studentLogs.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold text-foreground mb-4">Attendance History</h2>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {progress.studentLogs.slice(0, 20).map((log) => (
              <div key={log.id} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
                <div>
                  <span className="text-sm text-foreground">{formatDate(log.date)}</span>
                  {log.techniques_drilled.length > 0 && (
                    <span className="text-xs text-muted-foreground ml-2">{log.techniques_drilled.length} technique{log.techniques_drilled.length !== 1 ? 's' : ''}</span>
                  )}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  log.intensity_level === 'high' ? 'bg-error/10 text-error' :
                  log.intensity_level === 'medium' ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'
                }`}>{log.intensity_level}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
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

        <Input label="Strengths" placeholder="guard, sweeps, submissions (comma separated)" value={strengthsInput}
          onChange={(e) => { setStrengthsInput(e.target.value); setForm((f) => ({ ...f, strengths: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })) }}
          hint={`${form.strengths?.length || 0} strengths`} />

        <Input label="Weaknesses" placeholder="passing, takedowns, back defense (comma separated)" value={weaknessesInput}
          onChange={(e) => { setWeaknessesInput(e.target.value); setForm((f) => ({ ...f, weaknesses: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })) }}
          hint={`${form.weaknesses?.length || 0} weaknesses`} />

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
