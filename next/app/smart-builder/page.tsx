'use client'

import { useEffect, useState, useMemo } from 'react'
import { useGameStore, useClassPrepStore } from '@/store'
import { Card, Button, Input, Select, Badge } from '@/components/ui'
import { formatDuration, formatDateISO } from '@/lib/utils'
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

  // Get unique topics
  const topics = useMemo(() => {
    return [...new Set(games.map((g) => g.topic))].sort()
  }, [games])

  // Live preview calculation
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

    // Filter games based on constraints
    let filtered = [...games]
    if (position) filtered = filtered.filter((g) => g.position === position)
    if (difficulty) filtered = filtered.filter((g) => g.difficulty === difficulty)
    if (topic) filtered = filtered.filter((g) => g.topic.toLowerCase().includes(topic.toLowerCase()))

    const warmups = filtered.filter((g) => g.category === 'warmup')
    const mains = filtered.filter((g) => ['main', 'drill', 'positional'].includes(g.category))
    const cooldowns = filtered.filter((g) => g.category === 'cooldown')

    // Calculate target counts
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

  const renderGameList = (title: string, gamesInSection: Game[], color: string) => (
    <div className="mb-6">
      <h4 className={`text-sm font-medium ${color} mb-3`}>{title}</h4>
      {gamesInSection.length === 0 ? (
        <p className="text-gray-500 text-sm">No games selected</p>
      ) : (
        <div className="space-y-2">
          {gamesInSection.map((game, index) => (
            <div
              key={game.id}
              className="flex items-center justify-between p-3 bg-[#0A0A0A] rounded-lg"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs text-gray-400">
                  {index + 1}
                </span>
                <div>
                  <p className="text-white font-medium">{game.name}</p>
                  <p className="text-sm text-gray-500">
                    {game.position} • {formatDuration(game.duration_minutes)}
                  </p>
                </div>
              </div>
              <Badge variant="outline">{game.difficulty}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="content-container">
      <h1 className="text-3xl font-bold text-white mb-2">Smart Session Builder</h1>
      <p className="text-gray-400 mb-8">
        Generate an optimized training session based on your constraints
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Constraints */}
        <Card>
          <h3 className="text-lg font-semibold text-white mb-6">Session Constraints</h3>

          {/* Duration/Game count toggle */}
          <div className="flex items-center gap-4 mb-6 p-3 bg-[#1A1A1A] rounded-lg">
            <button
              onClick={() => setUseExactGameCount(false)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                !useExactGameCount
                  ? 'bg-white text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              By Duration
            </button>
            <button
              onClick={() => setUseExactGameCount(true)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                useExactGameCount
                  ? 'bg-white text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              By Game Count
            </button>
          </div>

          {/* Duration slider or game count */}
          {useExactGameCount ? (
            <div className="mb-6">
              <label className="block text-sm font-medium text-white mb-2">
                Number of Games: {gameCount}
              </label>
              <input
                type="range"
                min={3}
                max={12}
                value={gameCount}
                onChange={(e) => setGameCount(Number(e.target.value))}
                className="w-full h-2 bg-[#262626] rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>3</span>
                <span>12</span>
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <label className="block text-sm font-medium text-white mb-2">
                Session Duration: {formatDuration(durationMinutes)}
              </label>
              <input
                type="range"
                min={15}
                max={120}
                step={5}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full h-2 bg-[#262626] rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
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
          <div className="bg-[#1A1A1A] rounded-lg p-4 mb-6">
            <h4 className="text-sm font-medium text-white mb-3">Session Preview</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className={`text-2xl font-bold ${preview.hasEnoughWarmups ? 'text-green-400' : 'text-yellow-400'}`}>
                  {preview.warmupCount}
                </p>
                <p className="text-xs text-gray-500">Warmup</p>
              </div>
              <div>
                <p className={`text-2xl font-bold ${preview.hasEnoughMains ? 'text-white' : 'text-yellow-400'}`}>
                  {preview.mainCount}
                </p>
                <p className="text-xs text-gray-500">Main</p>
              </div>
              <div>
                <p className={`text-2xl font-bold ${preview.hasEnoughCooldowns ? 'text-blue-400' : 'text-yellow-400'}`}>
                  {preview.cooldownCount}
                </p>
                <p className="text-xs text-gray-500">Cooldown</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-[#262626] text-center">
              <p className="text-sm text-gray-400">
                ~{formatDuration(preview.estimatedDuration)} •{' '}
                {preview.matchingGames} matching games
              </p>
            </div>
          </div>

          <Button onClick={handleGenerate} className="w-full">
            Generate Session
          </Button>
        </Card>

        {/* Generated Session */}
        <Card>
          <h3 className="text-lg font-semibold text-white mb-6">Generated Session</h3>

          {!generatedSession ? (
            <div className="text-center py-12">
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
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <p className="text-gray-400">
                Configure constraints and click Generate
              </p>
            </div>
          ) : (
            <>
              {renderGameList('Warmup', generatedSession.warmup, 'text-green-400')}
              {renderGameList('Main Drills', generatedSession.main, 'text-white')}
              {renderGameList('Cooldown', generatedSession.cooldown, 'text-blue-400')}

              <div className="border-t border-[#262626] pt-4 mt-4">
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
                    Regenerate
                  </Button>
                  <Button
                    onClick={handleSaveSession}
                    loading={isSaving}
                    className="flex-1"
                  >
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
