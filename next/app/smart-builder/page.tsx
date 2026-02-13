'use client'

import { useEffect, useState, useMemo } from 'react'
import { useGameStore, useClassPrepStore, useStudentStore, useTechniqueStore } from '@/store'
import { Card, Button, Input, Select, Badge } from '@/components/ui'
import { formatDuration, formatDateISO } from '@/lib/utils'
import { Zap, Sparkles, Save, RefreshCw, Users } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Game, Position, Difficulty, SmartBuilderConstraints, EnvironmentTag, Intensity, ClassArcResult } from '@/types/database'

const positionOptions = [
  { value: '', label: 'Any Position' },
  { value: 'guard', label: 'Guard' },
  { value: 'half-guard', label: 'Half Guard' },
  { value: 'mount', label: 'Mount' },
  { value: 'side-control', label: 'Side Control' },
  { value: 'back', label: 'Back' },
  { value: 'turtle', label: 'Turtle' },
  { value: 'standing', label: 'Standing' },
]

const difficultyOptions = [
  { value: '', label: 'Any Level' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]

const environmentOptions = [
  { value: '', label: 'Any Environment' },
  { value: 'gi', label: 'Gi' },
  { value: 'nogi', label: 'No-Gi' },
  { value: 'wrestling', label: 'Wrestling' },
  { value: 'judo', label: 'Judo' },
  { value: 'mma', label: 'MMA' },
]

const intensityOptions = [
  { value: '', label: 'Any Intensity' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

const ARC_PHASE_LABELS: Record<string, { label: string; color: string }> = {
  movement_prep: { label: 'Movement Prep', color: 'text-success' },
  technique_intro: { label: 'Technique Intro', color: 'text-primary' },
  guided_discovery: { label: 'Guided Discovery', color: 'text-accent' },
  open_play: { label: 'Open Play', color: 'text-warning' },
  cool_down: { label: 'Cool Down', color: 'text-muted-foreground' },
}

export default function SmartBuilderPage() {
  const { games, fetchGames } = useGameStore()
  const { generateSmartSession, generateClassArc, addClassPrep } = useClassPrepStore()
  const { students, fetchStudents } = useStudentStore()
  const { fetchTechniques } = useTechniqueStore()

  const [sessionName, setSessionName] = useState('')
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [useExactGameCount, setUseExactGameCount] = useState(false)
  const [gameCount, setGameCount] = useState(5)
  const [position, setPosition] = useState<Position | ''>('')
  const [difficulty, setDifficulty] = useState<Difficulty | ''>('')
  const [topic, setTopic] = useState('')
  const [environment, setEnvironment] = useState<EnvironmentTag | ''>('')
  const [intensityTarget, setIntensityTarget] = useState<Intensity | ''>('')
  const [positionalFlow, setPositionalFlow] = useState(false)
  const [avoidRecentDays, setAvoidRecentDays] = useState(0)
  const [useClassArc, setUseClassArc] = useState(false)
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])

  const [generatedSession, setGeneratedSession] = useState<{
    warmup: Game[]
    main: Game[]
    cooldown: Game[]
  } | null>(null)
  const [generatedArc, setGeneratedArc] = useState<ClassArcResult | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchGames()
    fetchStudents()
    fetchTechniques()
  }, [fetchGames, fetchStudents, fetchTechniques])

  // Auto-infer constraints from selected students
  const studentInferences = useMemo(() => {
    if (selectedStudentIds.length === 0) return null
    const selected = students.filter((s) => selectedStudentIds.includes(s.id))
    if (selected.length === 0) return null

    const beltOrder = ['white', 'blue', 'purple', 'brown', 'black']
    const lowestBelt = selected.reduce((lowest, s) => {
      const idx = beltOrder.indexOf(s.belt_rank)
      const lowestIdx = beltOrder.indexOf(lowest)
      return idx < lowestIdx ? s.belt_rank : lowest
    }, selected[0].belt_rank)

    const difficultyMap: Record<string, Difficulty> = {
      white: 'beginner',
      blue: 'beginner',
      purple: 'intermediate',
      brown: 'advanced',
      black: 'advanced',
    }

    const envPrefs = selected
      .map((s) => s.environment_preference)
      .filter(Boolean) as EnvironmentTag[]
    const commonEnv = envPrefs.length > 0
      ? envPrefs.sort((a, b) =>
          envPrefs.filter((v) => v === a).length - envPrefs.filter((v) => v === b).length
        ).pop()!
      : null

    const allWeaknesses = selected.flatMap((s) => s.weaknesses || [])
    const weaknessFreq: Record<string, number> = {}
    allWeaknesses.forEach((w) => { weaknessFreq[w] = (weaknessFreq[w] || 0) + 1 })
    const topWeaknesses = Object.entries(weaknessFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([w]) => w)

    return {
      suggestedDifficulty: difficultyMap[lowestBelt],
      suggestedEnvironment: commonEnv,
      topWeaknesses,
      lowestBelt,
    }
  }, [selectedStudentIds, students])

  const applyStudentInferences = () => {
    if (!studentInferences) return
    if (studentInferences.suggestedDifficulty) setDifficulty(studentInferences.suggestedDifficulty)
    if (studentInferences.suggestedEnvironment) setEnvironment(studentInferences.suggestedEnvironment)
    if (studentInferences.topWeaknesses.length > 0) setTopic(studentInferences.topWeaknesses[0])
  }

  const topics = useMemo(() => {
    return [...new Set(games.map((g) => g.topic))].sort()
  }, [games])

  const buildConstraints = (): SmartBuilderConstraints => {
    const constraints: SmartBuilderConstraints = {
      position: position || undefined,
      difficulty: difficulty || undefined,
      topic: topic || undefined,
      environment: environment || undefined,
      intensity_target: intensityTarget || undefined,
      positional_flow: positionalFlow,
      avoid_recent_days: avoidRecentDays,
      class_arc: useClassArc,
    }
    if (useExactGameCount) {
      constraints.game_count = gameCount
    } else {
      constraints.duration_minutes = durationMinutes
    }
    return constraints
  }

  const preview = useMemo(() => {
    let filtered = [...games]
    if (position) filtered = filtered.filter((g) => g.position === position)
    if (difficulty) filtered = filtered.filter((g) => g.difficulty === difficulty)
    if (topic) filtered = filtered.filter((g) => g.topic.toLowerCase().includes(topic.toLowerCase()))
    if (environment) filtered = filtered.filter((g) => g.environment_tags?.includes(environment))
    if (intensityTarget) {
      const ranks: Record<string, number> = { low: 1, medium: 2, high: 3 }
      const target = ranks[intensityTarget]
      filtered = filtered.filter((g) => Math.abs(ranks[g.intensity || 'medium'] - target) <= 1)
    }

    const warmups = filtered.filter((g) => g.category === 'warmup')
    const mains = filtered.filter((g) => ['main', 'drill', 'positional'].includes(g.category))
    const cooldowns = filtered.filter((g) => g.category === 'cooldown')

    let warmupCount = 1
    let mainCount = 3
    let cooldownCount = 1

    if (useExactGameCount) {
      warmupCount = Math.max(1, Math.floor(gameCount * 0.2))
      cooldownCount = Math.max(1, Math.floor(gameCount * 0.2))
      mainCount = gameCount - warmupCount - cooldownCount
    } else {
      const totalGames = Math.floor(durationMinutes / 8)
      warmupCount = Math.max(1, Math.floor(totalGames * 0.2))
      cooldownCount = Math.max(1, Math.floor(totalGames * 0.2))
      mainCount = Math.max(1, totalGames - warmupCount - cooldownCount)
    }

    return {
      matchingGames: filtered.length,
      warmupCount,
      mainCount,
      cooldownCount,
      total: warmupCount + mainCount + cooldownCount,
      estimatedDuration: (warmupCount + mainCount + cooldownCount) * 8,
      hasEnoughWarmups: warmups.length >= warmupCount,
      hasEnoughMains: mains.length >= mainCount,
      hasEnoughCooldowns: cooldowns.length >= cooldownCount,
    }
  }, [games, position, difficulty, topic, environment, intensityTarget, useExactGameCount, gameCount, durationMinutes])

  const handleGenerate = () => {
    const constraints = buildConstraints()

    if (useClassArc) {
      const result = generateClassArc(constraints, games)
      setGeneratedArc(result)
      setGeneratedSession(null)
    } else {
      const result = generateSmartSession(constraints, games)
      setGeneratedSession(result)
      setGeneratedArc(null)
    }
  }

  const handleSaveSession = async () => {
    setIsSaving(true)
    let allGames: Game[] = []

    if (generatedArc) {
      allGames = [
        ...generatedArc.movement_prep,
        ...generatedArc.technique_intro,
        ...generatedArc.guided_discovery,
        ...generatedArc.open_play,
        ...generatedArc.cool_down,
      ]
    } else if (generatedSession) {
      allGames = [
        ...generatedSession.warmup,
        ...generatedSession.main,
        ...generatedSession.cooldown,
      ]
    }

    if (allGames.length === 0) {
      setIsSaving(false)
      return
    }

    await addClassPrep({
      name: sessionName || `Session - ${formatDateISO(new Date())}`,
      date: formatDateISO(new Date()),
      duration_minutes: allGames.reduce((sum, g) => sum + g.duration_minutes, 0),
      focus: topic || position || 'General',
      skill_level: difficulty || undefined,
      game_ids: allGames.map((g) => g.id),
    })

    setIsSaving(false)
    setGeneratedSession(null)
    setGeneratedArc(null)
    setSessionName('')
  }

  const toggleStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  const renderGameList = (title: string, gamesInSection: Game[], colorClass: string) => (
    <div className="mb-6">
      <h4 className={`text-sm font-medium ${colorClass} mb-3`}>{title}</h4>
      {gamesInSection.length === 0 ? (
        <p className="text-muted-foreground text-sm">No games selected</p>
      ) : (
        <div className="space-y-2">
          {gamesInSection.map((game, index) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border/30"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs text-primary font-medium">
                  {index + 1}
                </span>
                <div>
                  <p className="text-foreground font-medium">{game.name}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{game.position} &middot; {formatDuration(game.duration_minutes)}</span>
                    {game.environment_tags?.length > 0 && (
                      <span className="text-xs px-1.5 py-0.5 bg-secondary/50 rounded">
                        {game.environment_tags.join(', ')}
                      </span>
                    )}
                    {game.rule_constraints?.length > 0 && (
                      <span className="text-xs text-accent">
                        {game.rule_constraints.length} constraint{game.rule_constraints.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {game.intensity && (
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    game.intensity === 'high' ? 'bg-error/10 text-error' :
                    game.intensity === 'medium' ? 'bg-warning/10 text-warning' :
                    'bg-success/10 text-success'
                  }`}>
                    {game.intensity}
                  </span>
                )}
                <Badge variant="outline">{game.difficulty}</Badge>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )

  const hasResult = generatedSession || generatedArc

  return (
    <div className="content-container">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">
          <span className="gradient-text">Smart Session Builder</span>
        </h1>
        <p className="text-muted-foreground mt-1">
          Generate an optimized training session based on your constraints
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Constraints */}
        <Card>
          <div className="flex items-center gap-2 mb-6">
            <Zap className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Session Constraints</h3>
          </div>

          {/* Mode toggle: Standard vs Class Arc */}
          <div className="flex items-center gap-2 mb-6 p-1 bg-secondary/50 rounded-lg">
            <button
              onClick={() => setUseClassArc(false)}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                !useClassArc
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Standard
            </button>
            <button
              onClick={() => setUseClassArc(true)}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                useClassArc
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              CLA Class Arc
            </button>
          </div>

          {useClassArc && (
            <p className="text-xs text-muted-foreground mb-4 bg-accent/10 rounded-lg px-3 py-2 border border-accent/20">
              CLA arc: Movement Prep (10%) → Technique Intro (20%) → Guided Discovery (30%) → Open Play (25%) → Cool Down (15%)
            </p>
          )}

          {/* Duration/Game count toggle */}
          <div className="flex items-center gap-2 mb-6 p-1 bg-secondary/50 rounded-lg">
            <button
              onClick={() => setUseExactGameCount(false)}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                !useExactGameCount
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              By Duration
            </button>
            <button
              onClick={() => setUseExactGameCount(true)}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                useExactGameCount
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              By Game Count
            </button>
          </div>

          {useExactGameCount ? (
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                Number of Games: <span className="text-primary">{gameCount}</span>
              </label>
              <input
                type="range"
                min={3}
                max={12}
                value={gameCount}
                onChange={(e) => setGameCount(Number(e.target.value))}
                className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>3</span>
                <span>12</span>
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                Session Duration: <span className="text-primary">{formatDuration(durationMinutes)}</span>
              </label>
              <input
                type="range"
                min={15}
                max={120}
                step={5}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>15m</span>
                <span>2h</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-4">
            <Select
              label="Position Focus"
              options={positionOptions}
              value={position}
              onChange={(e) => setPosition(e.target.value as Position | '')}
            />
            <Select
              label="Skill Level"
              options={difficultyOptions}
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty | '')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <Select
              label="Environment"
              options={environmentOptions}
              value={environment}
              onChange={(e) => setEnvironment(e.target.value as EnvironmentTag | '')}
            />
            <Select
              label="Intensity Target"
              options={intensityOptions}
              value={intensityTarget}
              onChange={(e) => setIntensityTarget(e.target.value as Intensity | '')}
            />
          </div>

          <Select
            label="Topic Focus"
            options={[
              { value: '', label: 'Any Topic' },
              ...topics.map((t) => ({ value: t, label: t })),
            ]}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="mb-4"
          />

          {/* Advanced toggles */}
          <div className="space-y-3 mb-6 bg-background/50 rounded-xl p-4 border border-border/30">
            <h4 className="text-sm font-medium text-foreground">Advanced Options</h4>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={positionalFlow}
                onChange={(e) => setPositionalFlow(e.target.checked)}
                className="w-4 h-4 rounded bg-input border-border/50 text-primary focus:ring-primary"
              />
              <div>
                <span className="text-sm text-foreground">Positional Flow</span>
                <p className="text-xs text-muted-foreground">Order games by natural positional progression</p>
              </div>
            </label>
            <div className="flex items-center gap-3">
              <label className="text-sm text-foreground whitespace-nowrap">Avoid Recent:</label>
              <input
                type="range"
                min={0}
                max={14}
                value={avoidRecentDays}
                onChange={(e) => setAvoidRecentDays(Number(e.target.value))}
                className="flex-1 h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <span className="text-sm text-primary w-16 text-right">
                {avoidRecentDays === 0 ? 'Off' : `${avoidRecentDays}d`}
              </span>
            </div>
          </div>

          {/* Student Picker */}
          {students.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <label className="text-sm font-medium text-foreground">
                  Students ({selectedStudentIds.length} selected)
                </label>
              </div>
              <div className="max-h-32 overflow-y-auto space-y-1 border border-border/50 rounded-xl p-2 mb-2">
                {students.map((s) => {
                  const selected = selectedStudentIds.includes(s.id)
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleStudent(s.id)}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center justify-between ${
                        selected
                          ? 'bg-primary/10 text-primary border border-primary/20'
                          : 'text-foreground hover:bg-secondary/50'
                      }`}
                    >
                      <span>{s.name}</span>
                      <span className="text-xs text-muted-foreground">{s.belt_rank}</span>
                    </button>
                  )
                })}
              </div>
              {studentInferences && (
                <div className="bg-accent/5 rounded-lg p-3 border border-accent/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-accent">Student Insights</span>
                    <Button size="sm" variant="ghost" onClick={applyStudentInferences} className="text-xs h-6 px-2">
                      Apply
                    </Button>
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>Lowest belt: <span className="text-foreground">{studentInferences.lowestBelt}</span> → <span className="text-foreground">{studentInferences.suggestedDifficulty}</span></p>
                    {studentInferences.suggestedEnvironment && (
                      <p>Preferred env: <span className="text-foreground">{studentInferences.suggestedEnvironment}</span></p>
                    )}
                    {studentInferences.topWeaknesses.length > 0 && (
                      <p>Weaknesses: <span className="text-foreground">{studentInferences.topWeaknesses.join(', ')}</span></p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Preview */}
          <div className="bg-background/50 rounded-xl p-4 mb-6 border border-border/30">
            <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              Session Preview
            </h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className={`text-2xl font-bold ${preview.hasEnoughWarmups ? 'text-success' : 'text-warning'}`}>
                  {preview.warmupCount}
                </p>
                <p className="text-xs text-muted-foreground">Warmup</p>
              </div>
              <div>
                <p className={`text-2xl font-bold ${preview.hasEnoughMains ? 'text-foreground' : 'text-warning'}`}>
                  {preview.mainCount}
                </p>
                <p className="text-xs text-muted-foreground">Main</p>
              </div>
              <div>
                <p className={`text-2xl font-bold ${preview.hasEnoughCooldowns ? 'text-primary' : 'text-warning'}`}>
                  {preview.cooldownCount}
                </p>
                <p className="text-xs text-muted-foreground">Cooldown</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-border/30 text-center">
              <p className="text-sm text-muted-foreground">
                ~{formatDuration(preview.estimatedDuration)} &middot;{' '}
                {preview.matchingGames} matching games
              </p>
            </div>
          </div>

          <Button onClick={handleGenerate} className="w-full" size="lg">
            <Zap className="w-5 h-5 mr-2" />
            {useClassArc ? 'Generate CLA Arc' : 'Generate Session'}
          </Button>
        </Card>

        {/* Generated Session */}
        <Card>
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-5 h-5 text-accent" />
            <h3 className="text-lg font-semibold text-foreground">
              {useClassArc ? 'CLA Class Arc' : 'Generated Session'}
            </h3>
          </div>

          {!hasResult ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <p className="text-muted-foreground">
                Configure constraints and click Generate
              </p>
            </div>
          ) : generatedArc ? (
            <>
              {Object.entries(ARC_PHASE_LABELS).map(([key, { label, color }]) => {
                const phaseGames = generatedArc[key as keyof ClassArcResult]
                if (!Array.isArray(phaseGames)) return null
                return <div key={key}>{renderGameList(label, phaseGames, color)}</div>
              })}

              <div className="bg-background/50 rounded-lg p-3 border border-border/30 mb-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Total: <span className="text-foreground font-medium">{formatDuration(generatedArc.total_duration)}</span>
                </p>
              </div>

              <div className="border-t border-border/50 pt-4 mt-4">
                <Input
                  label="Session Name"
                  placeholder="e.g., Monday Guard Class"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  className="mb-4"
                />
                <div className="flex gap-3">
                  <Button variant="secondary" onClick={handleGenerate} className="flex-1">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Regenerate
                  </Button>
                  <Button onClick={handleSaveSession} loading={isSaving} className="flex-1">
                    <Save className="w-4 h-4 mr-2" />
                    Save Session
                  </Button>
                </div>
              </div>
            </>
          ) : generatedSession ? (
            <>
              {renderGameList('Warmup', generatedSession.warmup, 'text-success')}
              {renderGameList('Main Drills', generatedSession.main, 'text-foreground')}
              {renderGameList('Cooldown', generatedSession.cooldown, 'text-primary')}

              <div className="border-t border-border/50 pt-4 mt-4">
                <Input
                  label="Session Name"
                  placeholder="e.g., Monday Guard Class"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  className="mb-4"
                />
                <div className="flex gap-3">
                  <Button variant="secondary" onClick={handleGenerate} className="flex-1">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Regenerate
                  </Button>
                  <Button onClick={handleSaveSession} loading={isSaving} className="flex-1">
                    <Save className="w-4 h-4 mr-2" />
                    Save Session
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </Card>
      </div>
    </div>
  )
}
