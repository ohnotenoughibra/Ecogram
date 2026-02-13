'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useGameStore } from '@/store'
import { Modal, ModalFooter, Button, Input, Select, Textarea } from '@/components/ui'
import type { Game, GameFormData, Position, Difficulty, GameCategory, EnvironmentTag, Intensity, RuleConstraint, ConstraintType } from '@/types/database'
import { Plus, X } from 'lucide-react'

const gameSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  position: z.enum(['guard', 'half-guard', 'mount', 'side-control', 'back', 'turtle', 'standing', 'open-guard', 'closed-guard', 'clinch', 'other']),
  topic: z.string().min(1, 'Topic is required'),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  category: z.enum(['warmup', 'main', 'cooldown', 'drill', 'positional']),
  duration_minutes: z.number().min(1).max(120),
  techniques: z.array(z.string()),
  variations: z.array(z.string()),
  environment_tags: z.array(z.enum(['gi', 'nogi', 'wrestling', 'judo', 'mma'])).optional(),
  intensity: z.enum(['low', 'medium', 'high']).optional(),
  rule_constraints: z.array(z.object({
    type: z.enum(['task', 'environmental', 'performer']),
    description: z.string(),
  })).optional(),
})

interface GameModalProps {
  isOpen: boolean
  onClose: () => void
  game?: Game | null
}

const positionOptions = [
  { value: 'standing', label: 'Standing' },
  { value: 'clinch', label: 'Clinch' },
  { value: 'guard', label: 'Guard' },
  { value: 'open-guard', label: 'Open Guard' },
  { value: 'closed-guard', label: 'Closed Guard' },
  { value: 'half-guard', label: 'Half Guard' },
  { value: 'mount', label: 'Mount' },
  { value: 'side-control', label: 'Side Control' },
  { value: 'back', label: 'Back' },
  { value: 'turtle', label: 'Turtle' },
  { value: 'other', label: 'Other' },
]

const difficultyOptions = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]

const categoryOptions = [
  { value: 'warmup', label: 'Warmup' },
  { value: 'main', label: 'Main' },
  { value: 'cooldown', label: 'Cooldown' },
  { value: 'drill', label: 'Drill' },
  { value: 'positional', label: 'Positional' },
]

const environmentOptions = [
  { value: 'gi', label: 'Gi' },
  { value: 'nogi', label: 'No-Gi' },
  { value: 'wrestling', label: 'Wrestling' },
  { value: 'judo', label: 'Judo' },
  { value: 'mma', label: 'MMA' },
]

const intensityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

const constraintTypeOptions = [
  { value: 'task', label: 'Task' },
  { value: 'environmental', label: 'Environmental' },
  { value: 'performer', label: 'Performer' },
]

export function GameModal({ isOpen, onClose, game }: GameModalProps) {
  const { addGame, updateGame, isLoading } = useGameStore()
  const [techniquesInput, setTechniquesInput] = useState('')
  const [variationsInput, setVariationsInput] = useState('')
  const [ruleConstraints, setRuleConstraints] = useState<RuleConstraint[]>([])
  const [newConstraintType, setNewConstraintType] = useState<ConstraintType>('task')
  const [newConstraintDesc, setNewConstraintDesc] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<GameFormData>({
    resolver: zodResolver(gameSchema),
    defaultValues: {
      name: '',
      description: '',
      position: 'guard',
      topic: 'General',
      difficulty: 'intermediate',
      category: 'main',
      duration_minutes: 10,
      techniques: [],
      variations: [],
      environment_tags: [],
      intensity: 'medium',
      rule_constraints: [],
    },
  })

  const techniques = watch('techniques')
  const variations = watch('variations')

  useEffect(() => {
    if (game) {
      reset({
        name: game.name,
        description: game.description || '',
        position: game.position,
        topic: game.topic,
        difficulty: game.difficulty,
        category: game.category,
        duration_minutes: game.duration_minutes,
        techniques: game.techniques,
        variations: game.variations,
        environment_tags: game.environment_tags || [],
        intensity: game.intensity || 'medium',
        rule_constraints: game.rule_constraints || [],
      })
      setTechniquesInput(game.techniques.join(', '))
      setVariationsInput(game.variations.join(', '))
      setRuleConstraints(game.rule_constraints || [])
    } else {
      reset({
        name: '',
        description: '',
        position: 'guard',
        topic: 'General',
        difficulty: 'intermediate',
        category: 'main',
        duration_minutes: 10,
        techniques: [],
        variations: [],
        environment_tags: [],
        intensity: 'medium',
        rule_constraints: [],
      })
      setTechniquesInput('')
      setVariationsInput('')
      setRuleConstraints([])
    }
  }, [game, reset])

  const handleTechniquesChange = (value: string) => {
    setTechniquesInput(value)
    const techs = value.split(',').map((t) => t.trim()).filter(Boolean)
    setValue('techniques', techs)
  }

  const handleVariationsChange = (value: string) => {
    setVariationsInput(value)
    const vars = value.split(',').map((v) => v.trim()).filter(Boolean)
    setValue('variations', vars)
  }

  const handleToggleEnvTag = (tag: EnvironmentTag) => {
    const current = watch('environment_tags') || []
    const updated = current.includes(tag)
      ? current.filter((t) => t !== tag)
      : [...current, tag]
    setValue('environment_tags', updated)
  }

  const handleAddConstraint = () => {
    if (!newConstraintDesc.trim()) return
    const updated = [...ruleConstraints, { type: newConstraintType, description: newConstraintDesc.trim() }]
    setRuleConstraints(updated)
    setValue('rule_constraints', updated)
    setNewConstraintDesc('')
  }

  const handleRemoveConstraint = (index: number) => {
    const updated = ruleConstraints.filter((_, i) => i !== index)
    setRuleConstraints(updated)
    setValue('rule_constraints', updated)
  }

  const onSubmit = async (data: GameFormData) => {
    const submitData = { ...data, rule_constraints: ruleConstraints }
    if (game) {
      await updateGame(game.id, submitData)
    } else {
      await addGame(submitData)
    }
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={game ? 'Edit Game' : 'Add New Game'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Name"
          placeholder="e.g., Guard Retention Flow"
          error={errors.name?.message}
          {...register('name')}
        />

        <Textarea
          label="Description"
          placeholder="Describe the game rules and objectives..."
          rows={3}
          {...register('description')}
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Position"
            options={positionOptions}
            error={errors.position?.message}
            {...register('position')}
          />
          <Input
            label="Topic"
            placeholder="e.g., Guard, Passing"
            error={errors.topic?.message}
            {...register('topic')}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Select
            label="Difficulty"
            options={difficultyOptions}
            error={errors.difficulty?.message}
            {...register('difficulty')}
          />
          <Select
            label="Category"
            options={categoryOptions}
            error={errors.category?.message}
            {...register('category')}
          />
          <Input
            label="Duration (min)"
            type="number"
            min={1}
            max={120}
            error={errors.duration_minutes?.message}
            {...register('duration_minutes', { valueAsNumber: true })}
          />
        </div>

        <Input
          label="Techniques"
          placeholder="armbar, triangle, sweep (comma separated)"
          value={techniquesInput}
          onChange={(e) => handleTechniquesChange(e.target.value)}
          hint={`${techniques.length} techniques`}
        />

        <Input
          label="Variations"
          placeholder="Add resistance, time limit (comma separated)"
          value={variationsInput}
          onChange={(e) => handleVariationsChange(e.target.value)}
          hint={`${variations.length} variations`}
        />

        {/* Environment Tags */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Environment</label>
          <div className="flex flex-wrap gap-2">
            {environmentOptions.map((opt) => {
              const selected = (watch('environment_tags') || []).includes(opt.value as EnvironmentTag)
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleToggleEnvTag(opt.value as EnvironmentTag)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    selected
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-secondary/50 text-muted-foreground border-border hover:border-foreground/50'
                  }`}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Intensity */}
        <Select
          label="Intensity"
          options={intensityOptions}
          {...register('intensity')}
        />

        {/* Rule Constraints (CLA) */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Rule Constraints <span className="text-muted-foreground font-normal">(CLA)</span>
          </label>
          {ruleConstraints.length > 0 && (
            <div className="space-y-2 mb-3">
              {ruleConstraints.map((c, i) => (
                <div key={i} className="flex items-center gap-2 bg-secondary/30 rounded-lg px-3 py-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    c.type === 'task' ? 'bg-primary/20 text-primary' :
                    c.type === 'environmental' ? 'bg-success/20 text-success' :
                    'bg-warning/20 text-warning'
                  }`}>
                    {c.type}
                  </span>
                  <span className="flex-1 text-sm text-foreground">{c.description}</span>
                  <button type="button" onClick={() => handleRemoveConstraint(i)} className="text-muted-foreground hover:text-error transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <select
              value={newConstraintType}
              onChange={(e) => setNewConstraintType(e.target.value as ConstraintType)}
              className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground"
            >
              {constraintTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="e.g., No hands allowed"
              value={newConstraintDesc}
              onChange={(e) => setNewConstraintDesc(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddConstraint() } }}
              className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
            />
            <Button type="button" variant="ghost" size="sm" onClick={handleAddConstraint}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <ModalFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isLoading}>
            {game ? 'Update Game' : 'Add Game'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
