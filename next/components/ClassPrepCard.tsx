'use client'

import { useClassPrepStore } from '@/store'
import { Card, Badge, Button } from '@/components/ui'
import { formatDate, formatDuration } from '@/lib/utils'
import type { ClassPrep, Game } from '@/types/database'

interface ClassPrepCardProps {
  prep: ClassPrep
  games: Game[]
  onEdit: () => void
}

export function ClassPrepCard({ prep, games, onEdit }: ClassPrepCardProps) {
  const { deleteClassPrep } = useClassPrepStore()

  const prepGames = prep.game_ids
    .map((id) => games.find((g) => g.id === id))
    .filter(Boolean) as Game[]

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this session?')) {
      await deleteClassPrep(prep.id)
    }
  }

  const totalDuration = prepGames.reduce((sum, g) => sum + g.duration_minutes, 0)

  return (
    <Card className="group">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-white">{prep.name}</h3>
            <Badge variant="outline">{formatDate(prep.date)}</Badge>
            {prep.skill_level && (
              <Badge
                variant={
                  prep.skill_level === 'beginner'
                    ? 'success'
                    : prep.skill_level === 'intermediate'
                    ? 'warning'
                    : 'danger'
                }
              >
                {prep.skill_level}
              </Badge>
            )}
          </div>

          {/* Meta */}
          <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
            <span>{prep.game_ids.length} games</span>
            <span>{formatDuration(totalDuration)}</span>
            {prep.focus && <span>Focus: {prep.focus}</span>}
          </div>

          {/* Description */}
          {prep.description && (
            <p className="text-sm text-gray-400 mb-3">{prep.description}</p>
          )}

          {/* Games preview */}
          {prepGames.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {prepGames.map((game, index) => (
                <span
                  key={game.id}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-white/5 rounded text-sm text-gray-300"
                >
                  <span className="text-gray-500">{index + 1}.</span>
                  {game.name}
                </span>
              ))}
            </div>
          )}

          {/* Notes */}
          {prep.notes && (
            <p className="mt-3 text-sm text-gray-500 italic">{prep.notes}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button size="sm" variant="ghost" onClick={onEdit}>
            Edit
          </Button>
          <Button size="sm" variant="ghost" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </div>
    </Card>
  )
}
