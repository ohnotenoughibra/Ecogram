'use client'

import { useState } from 'react'
import { useGameStore, useClassPrepStore } from '@/store'
import { Modal, ModalFooter, Button, Input, Card } from './ui'
import { formatDateISO } from '@/lib/utils'

interface SessionTemplatesProps {
  isOpen: boolean
  onClose: () => void
  onSelectTemplate: (templateId: string) => void
}

interface Template {
  id: string
  name: string
  description: string
  icon: string
  duration: number
  structure: {
    warmup: { count: number; filters?: { position?: string; difficulty?: string } }
    main: { count: number; filters?: { position?: string; difficulty?: string; topic?: string } }
    cooldown: { count: number }
  }
}

const PRESET_TEMPLATES: Template[] = [
  {
    id: 'fundamentals',
    name: 'Fundamentals Class',
    description: 'Basic positions and escapes for beginners',
    icon: '🥋',
    duration: 60,
    structure: {
      warmup: { count: 2, filters: { difficulty: 'beginner' } },
      main: { count: 4, filters: { difficulty: 'beginner' } },
      cooldown: { count: 1 },
    },
  },
  {
    id: 'guard-day',
    name: 'Guard Day',
    description: 'Focus on guard retention, sweeps, and submissions',
    icon: '🛡️',
    duration: 60,
    structure: {
      warmup: { count: 1, filters: { position: 'guard' } },
      main: { count: 5, filters: { position: 'guard' } },
      cooldown: { count: 1 },
    },
  },
  {
    id: 'passing-day',
    name: 'Passing Day',
    description: 'Guard passing techniques and pressure',
    icon: '⚡',
    duration: 60,
    structure: {
      warmup: { count: 1 },
      main: { count: 5, filters: { topic: 'Passing' } },
      cooldown: { count: 1 },
    },
  },
  {
    id: 'competition-prep',
    name: 'Competition Prep',
    description: 'High intensity drilling for competitors',
    icon: '🏆',
    duration: 90,
    structure: {
      warmup: { count: 2, filters: { difficulty: 'intermediate' } },
      main: { count: 6, filters: { difficulty: 'advanced' } },
      cooldown: { count: 2 },
    },
  },
  {
    id: 'takedown-focus',
    name: 'Takedown Focus',
    description: 'Standing work and wrestling integration',
    icon: '🤼',
    duration: 60,
    structure: {
      warmup: { count: 2, filters: { position: 'standing' } },
      main: { count: 4, filters: { position: 'standing' } },
      cooldown: { count: 1 },
    },
  },
  {
    id: 'quick-flow',
    name: 'Quick Flow Session',
    description: 'Short technical session with light sparring',
    icon: '💨',
    duration: 30,
    structure: {
      warmup: { count: 1 },
      main: { count: 2 },
      cooldown: { count: 1 },
    },
  },
]

export function SessionTemplates({ isOpen, onClose, onSelectTemplate }: SessionTemplatesProps) {
  const { games } = useGameStore()
  const { addClassPrep } = useClassPrepStore()
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [sessionName, setSessionName] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const selectGamesForTemplate = (template: Template) => {
    const result: { warmup: string[]; main: string[]; cooldown: string[] } = {
      warmup: [],
      main: [],
      cooldown: [],
    }

    // Get games by category
    const warmupGames = games.filter((g) => g.category === 'warmup')
    const mainGames = games.filter((g) => ['main', 'drill', 'positional'].includes(g.category))
    const cooldownGames = games.filter((g) => g.category === 'cooldown')

    // Apply filters and select games
    const selectFiltered = (
      pool: typeof games,
      count: number,
      filters?: { position?: string; difficulty?: string; topic?: string }
    ) => {
      let filtered = [...pool]

      if (filters?.position) {
        filtered = filtered.filter((g) => g.position === filters.position)
      }
      if (filters?.difficulty) {
        filtered = filtered.filter((g) => g.difficulty === filters.difficulty)
      }
      if (filters?.topic) {
        filtered = filtered.filter((g) =>
          g.topic.toLowerCase().includes(filters.topic!.toLowerCase())
        )
      }

      // Shuffle and take count
      const shuffled = filtered.sort(() => Math.random() - 0.5)
      return shuffled.slice(0, count).map((g) => g.id)
    }

    result.warmup = selectFiltered(warmupGames, template.structure.warmup.count, template.structure.warmup.filters)
    result.main = selectFiltered(mainGames, template.structure.main.count, template.structure.main.filters)
    result.cooldown = selectFiltered(cooldownGames, template.structure.cooldown.count)

    return result
  }

  const handleCreateSession = async () => {
    if (!selectedTemplate) return

    setIsCreating(true)

    const selected = selectGamesForTemplate(selectedTemplate)
    const allGameIds = [...selected.warmup, ...selected.main, ...selected.cooldown]

    await addClassPrep({
      name: sessionName || selectedTemplate.name,
      description: selectedTemplate.description,
      date: formatDateISO(new Date()),
      duration_minutes: selectedTemplate.duration,
      focus: selectedTemplate.name,
      game_ids: allGameIds,
    })

    setIsCreating(false)
    setSelectedTemplate(null)
    setSessionName('')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Session Templates" size="full">
      {!selectedTemplate ? (
        // Template list
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground mb-4">
            Choose a template to quickly create a structured session
          </p>

          {PRESET_TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => setSelectedTemplate(template)}
              className="w-full text-left"
            >
              <Card variant="interactive" className="flex items-start gap-3">
                <span className="text-2xl">{template.icon}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-card-foreground">{template.name}</h3>
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs px-2 py-0.5 bg-secondary rounded">
                      {template.duration} min
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-secondary rounded">
                      {template.structure.warmup.count + template.structure.main.count + template.structure.cooldown.count} games
                    </span>
                  </div>
                </div>
                <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Card>
            </button>
          ))}
        </div>
      ) : (
        // Template confirmation
        <div>
          <button
            onClick={() => setSelectedTemplate(null)}
            className="flex items-center gap-2 text-sm text-muted-foreground mb-4"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to templates
          </button>

          <div className="text-center mb-6">
            <span className="text-4xl">{selectedTemplate.icon}</span>
            <h2 className="text-xl font-bold text-foreground mt-2">{selectedTemplate.name}</h2>
            <p className="text-muted-foreground">{selectedTemplate.description}</p>
          </div>

          <div className="bg-secondary rounded-lg p-4 mb-6">
            <h3 className="font-medium text-foreground mb-3">Session Structure</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-green-600">Warmup</span>
                <span className="text-muted-foreground">{selectedTemplate.structure.warmup.count} games</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground">Main Drills</span>
                <span className="text-muted-foreground">{selectedTemplate.structure.main.count} games</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-600">Cooldown</span>
                <span className="text-muted-foreground">{selectedTemplate.structure.cooldown.count} games</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-border">
                <span className="font-medium text-foreground">Total Duration</span>
                <span className="text-muted-foreground">~{selectedTemplate.duration} min</span>
              </div>
            </div>
          </div>

          <Input
            label="Session Name (optional)"
            placeholder={selectedTemplate.name}
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
          />

          <ModalFooter>
            <Button variant="ghost" onClick={() => setSelectedTemplate(null)}>
              Back
            </Button>
            <Button onClick={handleCreateSession} loading={isCreating}>
              Create Session
            </Button>
          </ModalFooter>
        </div>
      )}
    </Modal>
  )
}
