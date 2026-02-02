'use client'

import { useGameStore } from '@/store'
import { Card, Badge, Button } from '@/components/ui'
import { StarRating } from '@/components/StarRating'
import { formatDuration, capitalizeFirst } from '@/lib/utils'
import type { Game } from '@/types/database'

interface GameCardProps {
  game: Game
  onEdit: () => void
  selectable?: boolean
  selected?: boolean
  onSelect?: () => void
}

const difficultyColors = {
  beginner: 'success',
  intermediate: 'warning',
  advanced: 'danger',
} as const

const categoryLabels = {
  warmup: 'Warmup',
  main: 'Main',
  cooldown: 'Cooldown',
  drill: 'Drill',
  positional: 'Positional',
}

export function GameCard({
  game,
  onEdit,
  selectable,
  selected,
  onSelect,
}: GameCardProps) {
  const { toggleFavorite, deleteGame, rateGame } = useGameStore()

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this game?')) {
      await deleteGame(game.id)
    }
  }

  return (
    <Card
      variant={selectable ? 'interactive' : 'default'}
      className={`relative group ${selected ? 'ring-2 ring-primary' : ''}`}
      onClick={selectable ? onSelect : undefined}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{game.name}</h3>
          <p className="text-sm text-muted-foreground">{game.topic}</p>
        </div>

        {/* Favorite button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            toggleFavorite(game.id)
          }}
          className="p-1 hover:bg-accent rounded transition-colors"
        >
          <svg
            className={`w-5 h-5 ${
              game.is_favorite ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'
            }`}
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
            />
          </svg>
        </button>
      </div>

      {/* Description */}
      {game.description && (
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {game.description}
        </p>
      )}

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mb-3">
        <Badge variant={difficultyColors[game.difficulty]}>
          {capitalizeFirst(game.difficulty)}
        </Badge>
        <Badge variant="outline">{capitalizeFirst(game.position)}</Badge>
        <Badge variant="outline">{categoryLabels[game.category]}</Badge>
      </div>

      {/* Meta info */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {formatDuration(game.duration_minutes)}
        </span>
        {game.play_count > 0 && (
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
            </svg>
            {game.play_count} plays
          </span>
        )}
      </div>

      {/* Rating */}
      {!selectable && (
        <div className="flex items-center gap-2 mb-3" onClick={(e) => e.stopPropagation()}>
          <StarRating
            rating={game.rating}
            onRate={(rating) => rateGame(game.id, rating)}
            size="sm"
          />
          {game.rating && <span className="text-xs text-muted-foreground">({game.rating}/5)</span>}
        </div>
      )}

      {/* Techniques */}
      {game.techniques.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {game.techniques.slice(0, 3).map((tech) => (
            <span
              key={tech}
              className="px-2 py-0.5 bg-secondary rounded text-xs text-muted-foreground"
            >
              {tech}
            </span>
          ))}
          {game.techniques.length > 3 && (
            <span className="text-xs text-muted-foreground">
              +{game.techniques.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      {!selectable && (
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button size="sm" variant="ghost" onClick={onEdit}>
            Edit
          </Button>
          <Button size="sm" variant="ghost" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      )}

      {/* Selection indicator */}
      {selectable && (
        <div
          className={`absolute top-3 right-3 w-5 h-5 rounded-full border-2 transition-colors ${
            selected
              ? 'bg-primary border-primary'
              : 'border-muted-foreground group-hover:border-foreground'
          }`}
        >
          {selected && (
            <svg
              className="w-full h-full text-primary-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </div>
      )}
    </Card>
  )
}
