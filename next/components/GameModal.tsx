'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useGameStore } from '@/store'
import { Modal, ModalFooter, Button, Input, Select, Textarea } from '@/components/ui'
import type { Game, GameFormData, Position, Difficulty, GameCategory } from '@/types/database'

const gameSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  position: z.enum(['guard', 'half-guard', 'mount', 'side-control', 'back', 'turtle', 'standing', 'other']),
  topic: z.string().min(1, 'Topic is required'),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  category: z.enum(['warmup', 'main', 'cooldown', 'drill', 'positional']),
  duration_minutes: z.number().min(1).max(120),
  techniques: z.array(z.string()),
  variations: z.array(z.string()),
})

interface GameModalProps {
  isOpen: boolean
  onClose: () => void
  game?: Game | null
}

const positionOptions = [
  { value: 'guard', label: 'Guard' },
  { value: 'half-guard', label: 'Half Guard' },
  { value: 'mount', label: 'Mount' },
  { value: 'side-control', label: 'Side Control' },
  { value: 'back', label: 'Back' },
  { value: 'turtle', label: 'Turtle' },
  { value: 'standing', label: 'Standing' },
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

export function GameModal({ isOpen, onClose, game }: GameModalProps) {
  const { addGame, updateGame, isLoading } = useGameStore()
  const [techniquesInput, setTechniquesInput] = useState('')
  const [variationsInput, setVariationsInput] = useState('')

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
      })
      setTechniquesInput(game.techniques.join(', '))
      setVariationsInput(game.variations.join(', '))
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
      })
      setTechniquesInput('')
      setVariationsInput('')
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

  const onSubmit = async (data: GameFormData) => {
    if (game) {
      await updateGame(game.id, data)
    } else {
      await addGame(data)
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
