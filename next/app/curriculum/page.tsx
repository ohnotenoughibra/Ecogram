'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useCurriculumStore, useClassPrepStore, useTechniqueStore, useStudentStore, useGameStore } from '@/store'
import { useToast } from '@/components/Toast'
import { Button, Card, Badge, Input, Select, Modal, ModalFooter, Textarea } from '@/components/ui'
import { Plus, Search, Edit, Trash2, Loader2, BookMarked, Calendar, ChevronRight, ArrowUp, ArrowDown, Sparkles, Zap, Users, CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { capitalizeFirst, formatDateISO } from '@/lib/utils'
import type { Curriculum, CurriculumFormData, BeltLevel, EnvironmentTag, Technique, Student, Game, Position, Difficulty, ClassArcResult } from '@/types/database'

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

const BELT_ORDER: BeltLevel[] = ['white', 'blue', 'purple', 'brown', 'black']

const CLA_ARC_RATIOS = {
  'movement-prep': 0.10,
  'technique-intro': 0.20,
  'guided-discovery': 0.30,
  'open-play': 0.25,
  'cool-down': 0.15,
}

const ARC_PHASE_LABELS: Record<string, string> = {
  'movement-prep': 'Movement Prep',
  'technique-intro': 'Technique Intro',
  'guided-discovery': 'Guided Discovery',
  'open-play': 'Open Play',
  'cool-down': 'Cool Down',
}

export default function CurriculumPage() {
  const { curricula, isLoading, fetchCurricula, addCurriculum, updateCurriculum, deleteCurriculum, reorderSessions } = useCurriculumStore()
  const { classPreps: sessions, fetchClassPreps, addClassPrep } = useClassPrepStore()
  const { techniques, fetchTechniques } = useTechniqueStore()
  const { students, fetchStudents } = useStudentStore()
  const { games, fetchGames } = useGameStore()
  const { confirm: confirmDialog, success: toastSuccess } = useToast()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCurriculum, setEditingCurriculum] = useState<Curriculum | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showAutoGen, setShowAutoGen] = useState(false)

  useEffect(() => {
    fetchCurricula()
    fetchClassPreps()
    fetchTechniques()
    fetchStudents()
    fetchGames()
  }, [fetchCurricula, fetchClassPreps, fetchTechniques, fetchStudents, fetchGames])

  const handleEdit = (curriculum: Curriculum) => {
    setEditingCurriculum(curriculum)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    const ok = await confirmDialog({
      title: 'Delete Curriculum',
      description: 'This curriculum plan will be permanently removed.',
      confirmLabel: 'Delete',
      variant: 'danger',
    })
    if (ok) {
      await deleteCurriculum(id)
      toastSuccess('Curriculum deleted')
    }
  }

  const handleClose = () => {
    setIsModalOpen(false)
    setEditingCurriculum(null)
  }

  const handleSave = async (data: CurriculumFormData) => {
    if (editingCurriculum) {
      await updateCurriculum(editingCurriculum.id, data)
      toastSuccess('Curriculum updated')
    } else {
      await addCurriculum(data)
      toastSuccess('Curriculum created')
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
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setShowAutoGen(!showAutoGen)}>
            <Sparkles className="w-5 h-5 sm:mr-2" />
            <span className="hidden sm:inline">Auto-Generate</span>
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-5 h-5 sm:mr-2" />
            <span className="hidden sm:inline">New Curriculum</span>
          </Button>
        </div>
      </div>

      {/* Phase 8: Auto-Generate Panel */}
      {showAutoGen && (
        <AutoGenerateCurriculum
          techniques={techniques}
          students={students}
          games={games}
          onGenerate={async (curriculum, generatedSessions) => {
            // Save generated sessions first, then create curriculum
            const sessionIds: string[] = []
            for (const sess of generatedSessions) {
              const result = await addClassPrep(sess)
              if (result) sessionIds.push(result.id)
            }
            await addCurriculum({
              ...curriculum,
              session_ids: sessionIds,
            })
            await fetchClassPreps()
            setShowAutoGen(false)
            toastSuccess('Curriculum generated', `${generatedSessions.length} sessions created.`)
          }}
          onClose={() => setShowAutoGen(false)}
        />
      )}

      {/* Loading */}
      {isLoading && curricula.length === 0 && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && curricula.length === 0 && !showAutoGen && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
          <div className="w-16 h-16 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookMarked className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">No curricula yet</h3>
          <p className="text-muted-foreground mb-6">Create a multi-week training plan or auto-generate one</p>
          <div className="flex items-center justify-center gap-3">
            <Button variant="secondary" onClick={() => setShowAutoGen(true)}>
              <Sparkles className="w-4 h-4 mr-2" />
              Auto-Generate
            </Button>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Manually
            </Button>
          </div>
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

// ─── Phase 8: Auto-Generate Curriculum ──────────────────────────────

interface GeneratedSession {
  name: string
  date: string
  duration_minutes: number
  focus?: string
  skill_level?: Difficulty
  game_ids: string[]
  notes?: string
}

function AutoGenerateCurriculum({
  techniques,
  students,
  games,
  onGenerate,
  onClose,
}: {
  techniques: Technique[]
  students: Student[]
  games: Game[]
  onGenerate: (curriculum: CurriculumFormData, sessions: GeneratedSession[]) => void
  onClose: () => void
}) {
  const [name, setName] = useState('')
  const [weeks, setWeeks] = useState(4)
  const [sessionsPerWeek, setSessionsPerWeek] = useState(3)
  const [sessionDuration, setSessionDuration] = useState(60)
  const [targetBelt, setTargetBelt] = useState<BeltLevel | ''>('')
  const [environment, setEnvironment] = useState<EnvironmentTag | ''>('')
  const [useClaArc, setUseClaArc] = useState(true)
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])
  const [focusWeaknesses, setFocusWeaknesses] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [preview, setPreview] = useState<{ sessions: GeneratedSession[]; techniquesByWeek: string[][] } | null>(null)

  // Auto-infer from selected students
  const studentInferences = useMemo(() => {
    if (selectedStudentIds.length === 0) return null
    const selected = students.filter((s) => selectedStudentIds.includes(s.id))
    if (selected.length === 0) return null

    const lowestBelt = selected.reduce((lowest, s) => {
      return BELT_ORDER.indexOf(s.belt_rank) < BELT_ORDER.indexOf(lowest) ? s.belt_rank : lowest
    }, selected[0].belt_rank)

    const envPrefs = selected.map((s) => s.environment_preference).filter(Boolean) as EnvironmentTag[]
    const commonEnv = envPrefs.length > 0 ? envPrefs.sort((a, b) =>
      envPrefs.filter((v) => v === a).length - envPrefs.filter((v) => v === b).length
    ).pop()! : null

    const allWeaknesses = selected.flatMap((s) => s.weaknesses || [])
    const weaknessFreq: Record<string, number> = {}
    allWeaknesses.forEach((w) => { weaknessFreq[w] = (weaknessFreq[w] || 0) + 1 })

    return { lowestBelt, commonEnv, weaknessFreq }
  }, [selectedStudentIds, students])

  const toggleStudent = (id: string) => {
    setSelectedStudentIds((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id])
  }

  const generatePlan = useCallback(() => {
    setIsGenerating(true)

    const belt = targetBelt || studentInferences?.lowestBelt || 'white'
    const beltIdx = BELT_ORDER.indexOf(belt as BeltLevel)
    const env = environment || studentInferences?.commonEnv || ''

    // Get eligible techniques sorted by prerequisite depth (BFS)
    const eligible = techniques.filter((t) => {
      const minIdx = BELT_ORDER.indexOf(t.belt_level_min)
      const maxIdx = BELT_ORDER.indexOf(t.belt_level_max)
      if (beltIdx < minIdx || beltIdx > maxIdx) return false
      if (env && t.gi_nogi !== 'both' && t.gi_nogi !== env) return false
      return true
    })

    // Topological sort: prerequisites first
    const depths: Record<string, number> = {}
    const getDepth = (techId: string, visited: Set<string> = new Set()): number => {
      if (depths[techId] !== undefined) return depths[techId]
      if (visited.has(techId)) return 0
      visited.add(techId)
      const tech = techniques.find((t) => t.id === techId)
      if (!tech || !tech.prerequisite_ids?.length) {
        depths[techId] = 0
        return 0
      }
      const maxParentDepth = Math.max(...tech.prerequisite_ids.map((pid) => getDepth(pid, visited)), 0)
      depths[techId] = maxParentDepth + 1
      return depths[techId]
    }
    eligible.forEach((t) => getDepth(t.id))

    const sorted = [...eligible].sort((a, b) => {
      const depthDiff = (depths[a.id] || 0) - (depths[b.id] || 0)
      if (depthDiff !== 0) return depthDiff
      // Within same depth, prioritize weaknesses if enabled
      if (focusWeaknesses && studentInferences?.weaknessFreq) {
        const aScore = a.tags.reduce((s, tag) => s + (studentInferences.weaknessFreq[tag.toLowerCase()] || 0), 0)
          + (studentInferences.weaknessFreq[a.category.toLowerCase()] || 0)
          + (studentInferences.weaknessFreq[a.position.toLowerCase()] || 0)
        const bScore = b.tags.reduce((s, tag) => s + (studentInferences.weaknessFreq[tag.toLowerCase()] || 0), 0)
          + (studentInferences.weaknessFreq[b.category.toLowerCase()] || 0)
          + (studentInferences.weaknessFreq[b.position.toLowerCase()] || 0)
        return bScore - aScore // higher weakness relevance first
      }
      return 0
    })

    // Distribute techniques across weeks
    const totalSessions = weeks * sessionsPerWeek
    const techsPerSession = Math.max(1, Math.ceil(sorted.length / totalSessions))
    const techniquesByWeek: string[][] = []
    const generatedSessions: GeneratedSession[] = []

    for (let w = 0; w < weeks; w++) {
      const weekTechs: string[] = []
      for (let s = 0; s < sessionsPerWeek; s++) {
        const sessionIdx = w * sessionsPerWeek + s
        const startTech = sessionIdx * techsPerSession
        const sessionTechs = sorted.slice(startTech, startTech + techsPerSession)
        const techNames = sessionTechs.map((t) => t.name)
        weekTechs.push(...techNames)

        // Build games for this session
        const sessionGames = selectGamesForSession(
          sessionTechs,
          games,
          sessionDuration,
          env as EnvironmentTag | '',
          belt as BeltLevel,
          useClaArc,
        )

        // Determine focus from the techniques
        const categories = sessionTechs.map((t) => t.category)
        const positions = sessionTechs.map((t) => t.position)
        const topCategory = mode(categories)
        const topPosition = mode(positions)
        const focus = `${capitalizeFirst(topCategory || 'general')} / ${capitalizeFirst(topPosition || 'mixed')}`

        const difficultyMap: Record<string, Difficulty> = {
          white: 'beginner', blue: 'beginner', purple: 'intermediate', brown: 'advanced', black: 'advanced',
        }

        const date = new Date()
        date.setDate(date.getDate() + w * 7 + s * 2) // space sessions 2 days apart

        generatedSessions.push({
          name: `Week ${w + 1} — Session ${s + 1}: ${focus}`,
          date: formatDateISO(date),
          duration_minutes: sessionDuration,
          focus,
          skill_level: difficultyMap[belt],
          game_ids: sessionGames.map((g) => g.id),
          notes: techNames.length > 0 ? `Techniques: ${techNames.join(', ')}` : undefined,
        })
      }
      techniquesByWeek.push(weekTechs)
    }

    setPreview({ sessions: generatedSessions, techniquesByWeek })
    setIsGenerating(false)
  }, [techniques, games, students, weeks, sessionsPerWeek, sessionDuration, targetBelt, environment, useClaArc, selectedStudentIds, focusWeaknesses, studentInferences])

  const handleConfirm = () => {
    if (!preview) return

    const belt = targetBelt || studentInferences?.lowestBelt || ''
    const env = environment || studentInferences?.commonEnv || ''

    const curriculum: CurriculumFormData = {
      name: name || `Auto-Generated ${weeks}-Week Plan`,
      description: `Auto-generated ${weeks}-week curriculum with ${sessionsPerWeek} sessions/week. ${useClaArc ? 'Uses CLA arc structure.' : ''} ${preview.sessions.length} total sessions.`,
      duration_weeks: weeks,
      goal: focusWeaknesses && studentInferences ? 'Address student weaknesses through progressive technique mastery' : 'Progressive technique mastery following prerequisite chain',
      target_belt_level: belt as BeltLevel || undefined,
      environment: env as EnvironmentTag || undefined,
      session_ids: [], // will be filled after sessions are created
      progression_notes: preview.techniquesByWeek.map((techs, i) => `Week ${i + 1}: ${techs.slice(0, 5).join(', ')}${techs.length > 5 ? ` (+${techs.length - 5} more)` : ''}`).join('\n'),
    }

    onGenerate(curriculum, preview.sessions)
  }

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-semibold text-foreground">Auto-Generate Curriculum</h2>
          </div>
          <Button size="sm" variant="ghost" onClick={onClose}>Cancel</Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Config */}
          <div className="space-y-4">
            <Input label="Curriculum Name" placeholder="e.g., Blue Belt Prep — Spring 2026" value={name} onChange={(e) => setName(e.target.value)} />

            <div className="grid grid-cols-3 gap-4">
              <Input label="Weeks" type="number" min={1} max={16} value={weeks} onChange={(e) => setWeeks(parseInt(e.target.value) || 4)} />
              <Input label="Sessions/Week" type="number" min={1} max={7} value={sessionsPerWeek} onChange={(e) => setSessionsPerWeek(parseInt(e.target.value) || 3)} />
              <Input label="Duration (min)" type="number" min={30} max={120} step={5} value={sessionDuration} onChange={(e) => setSessionDuration(parseInt(e.target.value) || 60)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select label="Target Belt" options={beltOptions} value={targetBelt} onChange={(e) => setTargetBelt(e.target.value as BeltLevel | '')} />
              <Select label="Environment" options={envOptions} value={environment} onChange={(e) => setEnvironment(e.target.value as EnvironmentTag | '')} />
            </div>

            {/* Toggles */}
            <div className="space-y-3 bg-background/50 rounded-xl p-4 border border-border/30">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={useClaArc} onChange={(e) => setUseClaArc(e.target.checked)}
                  className="w-4 h-4 rounded bg-input border-border/50 text-primary focus:ring-primary" />
                <div>
                  <span className="text-sm text-foreground">Use CLA Arc Structure</span>
                  <p className="text-xs text-muted-foreground">Each session follows Movement Prep → Technique Intro → Guided Discovery → Open Play → Cool Down</p>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={focusWeaknesses} onChange={(e) => setFocusWeaknesses(e.target.checked)}
                  className="w-4 h-4 rounded bg-input border-border/50 text-primary focus:ring-primary" />
                <div>
                  <span className="text-sm text-foreground">Prioritize Student Weaknesses</span>
                  <p className="text-xs text-muted-foreground">Order techniques to address common weaknesses first</p>
                </div>
              </label>
            </div>

            {/* Student Picker */}
            {students.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <label className="text-sm font-medium text-foreground">Students ({selectedStudentIds.length})</label>
                </div>
                <div className="max-h-28 overflow-y-auto space-y-1 border border-border/50 rounded-xl p-2">
                  {students.map((s) => {
                    const selected = selectedStudentIds.includes(s.id)
                    return (
                      <button key={s.id} type="button" onClick={() => toggleStudent(s.id)}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center justify-between ${
                          selected ? 'bg-primary/10 text-primary border border-primary/20' : 'text-foreground hover:bg-secondary/50'
                        }`}>
                        <span>{s.name}</span>
                        <span className="text-xs text-muted-foreground">{capitalizeFirst(s.belt_rank)}</span>
                      </button>
                    )
                  })}
                </div>
                {studentInferences && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Lowest belt: <span className="text-foreground">{capitalizeFirst(studentInferences.lowestBelt)}</span>
                    {studentInferences.commonEnv && <> &middot; Env: <span className="text-foreground">{studentInferences.commonEnv}</span></>}
                  </p>
                )}
              </div>
            )}

            {/* Preview stats */}
            <div className="bg-accent/5 rounded-xl p-4 border border-accent/20">
              <div className="grid grid-cols-3 text-center gap-4">
                <div>
                  <p className="text-2xl font-bold text-foreground">{weeks * sessionsPerWeek}</p>
                  <p className="text-xs text-muted-foreground">Sessions</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{techniques.length}</p>
                  <p className="text-xs text-muted-foreground">Techniques</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{games.length}</p>
                  <p className="text-xs text-muted-foreground">Games</p>
                </div>
              </div>
            </div>

            <Button onClick={generatePlan} className="w-full" size="lg" loading={isGenerating}>
              <Zap className="w-5 h-5 mr-2" />
              Generate {weeks}-Week Plan
            </Button>
          </div>

          {/* Preview */}
          <div>
            {!preview ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center py-12">
                  <Sparkles className="w-12 h-12 text-accent/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">Configure options and click Generate</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">Generated Plan Preview</h3>
                  <Badge variant="outline">{preview.sessions.length} sessions</Badge>
                </div>

                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {preview.techniquesByWeek.map((techs, weekIdx) => (
                    <div key={weekIdx} className="border border-border/30 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-foreground">Week {weekIdx + 1}</h4>
                        <span className="text-xs text-muted-foreground">{sessionsPerWeek} sessions</span>
                      </div>
                      <div className="space-y-1.5">
                        {preview.sessions.slice(weekIdx * sessionsPerWeek, (weekIdx + 1) * sessionsPerWeek).map((sess, sIdx) => (
                          <div key={sIdx} className="flex items-center gap-2 text-sm">
                            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] flex items-center justify-center font-medium flex-shrink-0">
                              {sIdx + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <span className="text-foreground text-xs">{sess.focus}</span>
                              <span className="text-[10px] text-muted-foreground ml-2">{sess.game_ids.length} games</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      {techs.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-border/20">
                          <p className="text-[10px] text-muted-foreground">
                            Techniques: {techs.slice(0, 4).join(', ')}{techs.length > 4 ? ` +${techs.length - 4} more` : ''}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <Button onClick={handleConfirm} className="w-full" size="lg">
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Save Curriculum & Sessions
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

// ─── Helpers ────────────────────────────────────────────────────────

function mode<T>(arr: T[]): T | undefined {
  if (arr.length === 0) return undefined
  const freq = new Map<T, number>()
  arr.forEach((v) => freq.set(v, (freq.get(v) || 0) + 1))
  let maxCount = 0
  let maxVal: T | undefined
  freq.forEach((count, val) => {
    if (count > maxCount) { maxCount = count; maxVal = val }
  })
  return maxVal
}

function selectGamesForSession(
  sessionTechs: Technique[],
  games: Game[],
  durationMinutes: number,
  env: EnvironmentTag | '',
  belt: BeltLevel,
  useClaArc: boolean,
): Game[] {
  const difficultyMap: Record<string, Difficulty> = {
    white: 'beginner', blue: 'beginner', purple: 'intermediate', brown: 'advanced', black: 'advanced',
  }
  const difficulty = difficultyMap[belt]

  let filtered = games.filter((g) => {
    if (env && g.environment_tags?.length > 0 && !g.environment_tags.includes(env as EnvironmentTag)) return false
    return true
  })

  // Score games by relevance to session techniques
  const techPositions = new Set(sessionTechs.map((t) => t.position))
  const techCategories = new Set(sessionTechs.map((t) => t.category))
  const techNames = new Set(sessionTechs.map((t) => t.name.toLowerCase()))

  const scored = filtered.map((g) => {
    let score = 0
    if (techPositions.has(g.position)) score += 3
    if (g.difficulty === difficulty) score += 2
    if (g.techniques?.some((t) => techNames.has(t.toLowerCase()))) score += 5
    if (g.topic && techCategories.has(g.topic as any)) score += 2
    return { game: g, score }
  }).sort((a, b) => b.score - a.score)

  if (useClaArc) {
    // Select games matching CLA arc phases
    const warmups = scored.filter((s) => s.game.category === 'warmup').slice(0, 1)
    const drills = scored.filter((s) => ['drill', 'main'].includes(s.game.category)).slice(0, 2)
    const positional = scored.filter((s) => s.game.category === 'positional').slice(0, 2)
    const cooldowns = scored.filter((s) => s.game.category === 'cooldown').slice(0, 1)

    const selected = [
      ...warmups.map((s) => s.game),
      ...drills.map((s) => s.game),
      ...positional.map((s) => s.game),
      ...cooldowns.map((s) => s.game),
    ]

    // Fill remaining time with top scored
    let totalDuration = selected.reduce((sum, g) => sum + g.duration_minutes, 0)
    const selectedIds = new Set(selected.map((g) => g.id))
    for (const { game } of scored) {
      if (totalDuration >= durationMinutes) break
      if (selectedIds.has(game.id)) continue
      selected.push(game)
      selectedIds.add(game.id)
      totalDuration += game.duration_minutes
    }

    return selected
  } else {
    // Simple: pick top scoring games within time budget
    const selected: Game[] = []
    let totalDuration = 0
    for (const { game } of scored) {
      if (totalDuration >= durationMinutes) break
      selected.push(game)
      totalDuration += game.duration_minutes
    }
    return selected
  }
}

// ─── Curriculum Modal ───────────────────────────────────────────────

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
