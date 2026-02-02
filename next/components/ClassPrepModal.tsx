'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useClassPrepStore } from '@/store'
import { Modal, ModalFooter, Button, Input, Select, Textarea } from '@/components/ui'
import { GameCard } from '@/components/GameCard'
import { formatDateISO } from '@/lib/utils'
import type { ClassPrep, ClassPrepFormData, Game } from '@/types/database'

const prepSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  duration_minutes: z.number().min(15).max(180),
  focus: z.string().optional(),
  skill_level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  game_ids: z.array(z.string()),
  notes: z.string().optional(),
})

interface ClassPrepModalProps {
  isOpen: boolean
  onClose: () => void
  prep?: ClassPrep | null
  games: Game[]
}

const skillLevelOptions = [
  { value: '', label: 'Any Level' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]

export function ClassPrepModal({ isOpen, onClose, prep, games }: ClassPrepModalProps) {
  const { addClassPrep, updateClassPrep, isLoading } = useClassPrepStore()
  const [selectedGameIds, setSelectedGameIds] = useState<string[]>([])
  const [gameFilter, setGameFilter] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ClassPrepFormData>({
    resolver: zodResolver(prepSchema),
    defaultValues: {
      name: '',
      description: '',
      date: formatDateISO(new Date()),
      duration_minutes: 60,
      focus: '',
      game_ids: [],
      notes: '',
    },
  })

  useEffect(() => {
    if (prep) {
      reset({
        name: prep.name,
        description: prep.description || '',
        date: prep.date,
        duration_minutes: prep.duration_minutes,
        focus: prep.focus || '',
        skill_level: prep.skill_level || undefined,
        game_ids: prep.game_ids,
        notes: prep.notes || '',
      })
      setSelectedGameIds(prep.game_ids)
    } else {
      reset({
        name: '',
        description: '',
        date: formatDateISO(new Date()),
        duration_minutes: 60,
        focus: '',
        game_ids: [],
        notes: '',
      })
      setSelectedGameIds([])
    }
  }, [prep, reset])

  const toggleGame = (gameId: string) => {
    setSelectedGameIds((prev) => {
      const next = prev.includes(gameId)
        ? prev.filter((id) => id !== gameId)
        : [...prev, gameId]
      setValue('game_ids', next)
      return next
    })
  }

  const filteredGames = games.filter((g) =>
    gameFilter
      ? g.name.toLowerCase().includes(gameFilter.toLowerCase()) ||
        g.topic.toLowerCase().includes(gameFilter.toLowerCase())
      : true
  )

  const onSubmit = async (data: ClassPrepFormData) => {
    if (prep) {
      await updateClassPrep(prep.id, data)
    } else {
      await addClassPrep(data)
    }
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={prep ? 'Edit Session' : 'New Session'}
      size="xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Session Name"
            placeholder="e.g., Guard Day"
            error={errors.name?.message}
            {...register('name')}
          />
          <Input
            label="Date"
            type="date"
            error={errors.date?.message}
            {...register('date')}
          />
        </div>

        <Textarea
          label="Description"
          placeholder="Session goals and notes..."
          rows={2}
          {...register('description')}
        />

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Duration (min)"
            type="number"
            min={15}
            max={180}
            {...register('duration_minutes', { valueAsNumber: true })}
          />
          <Input
            label="Focus Area"
            placeholder="e.g., Guard passing"
            {...register('focus')}
          />
          <Select
            label="Skill Level"
            options={skillLevelOptions}
            {...register('skill_level')}
          />
        </div>

        {/* Game selection */}
        <div className="border-t border-[#262626] pt-4 mt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-white">
              Select Games ({selectedGameIds.length} selected)
            </h4>
            <Input
              placeholder="Filter games..."
              value={gameFilter}
              onChange={(e) => setGameFilter(e.target.value)}
              className="w-48"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
            {filteredGames.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                onEdit={() => {}}
                selectable
                selected={selectedGameIds.includes(game.id)}
                onSelect={() => toggleGame(game.id)}
              />
            ))}
          </div>

          {filteredGames.length === 0 && (
            <p className="text-center text-gray-500 py-8">No games found</p>
          )}
        </div>

        <Textarea
          label="Notes"
          placeholder="Additional notes for this session..."
          rows={2}
          {...register('notes')}
        />

        <ModalFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isLoading}>
            {prep ? 'Update Session' : 'Create Session'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
