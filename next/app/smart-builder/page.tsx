'use client'

import { useEffect, useState, useMemo } from 'react'
import { useGameStore, useClassPrepStore } from '@/store'
import { Card, Button, Input, Select, Badge } from '@/components/ui'
import { formatDuration, formatDateISO } from '@/lib/utils'
import { Zap, Sparkles, Save, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Game, Position, Difficulty, SmartBuilderConstraints } from '@/types/database'

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

export default function SmartBuilderPage() {
  const { games, fetchGames } = useGameStore()
  const { generateSmartSession, addClassPrep } = useClassPrepStore()

  const [sessionName, setSessionName] = useState('')
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [useExactGameCount, setUseExactGameCount] = useState(false)
  const [gameCount, setGameCount] = useState(5)
  const [position, setPosition] = useState<Position | ''>('')
  const [difficulty, setDifficulty] = useState<Difficulty | ''>('')
  const [topic, setTopic] = useState('')
  const [generatedSession, setGeneratedSession] = useState<{
    warmup: Game[]
    main: Game[]
    cooldown: Game[]
  } | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchGames()
  }, [fetchGames])

  const topics = useMemo(() => {
    return [...new Set(games.map((g) => g.topic))].sort()
  }, [games])

  const preview = useMemo(() => {
    const constraints: SmartBuilderConstraints = {
      position: position || undefined,
      difficulty: difficulty || undefined,
      topic: topic || undefined,
    }

    if (useExactGameCount) {
      constraints.game_count = gameCount
    } else {
      constraints.duration_minutes = durationMinutes
    }

    let filtered = [...games]
    if (position) filtered = filtered.filter((g) => g.position === position)
    if (difficulty) filtered = filtered.filter((g) => g.difficulty === difficulty)
    if (topic) filtered = filtered.filter((g) => g.topic.toLowerCase().includes(topic.toLowerCase()))

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
  }, [games, position, difficulty, topic, useExactGameCount, gameCount, durationMinutes])

  const handleGenerate = () => {
    const constraints: SmartBuilderConstraints = {
      position: position || undefined,
      difficulty: difficulty || undefined,
      topic: topic || undefined,
    }

    if (useExactGameCount) {
      constraints.game_count = gameCount
    } else {
      constraints.duration_minutes = durationMinutes
    }

    const result = generateSmartSession(constraints, games)
    setGeneratedSession(result)
  }

  const handleSaveSession = async () => {
    if (!generatedSession) return

    setIsSaving(true)
    const allGames = [
      ...generatedSession.warmup,
      ...generatedSession.main,
      ...generatedSession.cooldown,
    ]

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
    setSessionName('')
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
                  <p className="text-sm text-muted-foreground">
                    {game.position} &middot; {formatDuration(game.duration_minutes)}
                  </p>
                </div>
              </div>
              <Badge variant="outline">{game.difficulty}</Badge>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )

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

          <div className="grid grid-cols-2 gap-4 mb-6">
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

          <Select
            label="Topic Focus"
            options={[
              { value: '', label: 'Any Topic' },
              ...topics.map((t) => ({ value: t, label: t })),
            ]}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="mb-6"
          />

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
            Generate Session
          </Button>
        </Card>

        {/* Generated Session */}
        <Card>
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-5 h-5 text-accent" />
            <h3 className="text-lg font-semibold text-foreground">Generated Session</h3>
          </div>

          {!generatedSession ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <p className="text-muted-foreground">
                Configure constraints and click Generate
              </p>
            </div>
          ) : (
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
                  <Button
                    variant="secondary"
                    onClick={handleGenerate}
                    className="flex-1"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Regenerate
                  </Button>
                  <Button
                    onClick={handleSaveSession}
                    loading={isSaving}
                    className="flex-1"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Session
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
