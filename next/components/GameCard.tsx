'use client'

import { useGameStore } from '@/store'
import { Card, Badge, Button } from '@/components/ui'
import { StarRating } from '@/components/StarRating'
import { formatDuration, capitalizeFirst } from '@/lib/utils'
import { Star, Clock, Play, Edit, Trash2, Check } from 'lucide-react'
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
      className={`relative group ${selected ? 'ring-2 ring-primary shadow-primary/20' : ''}`}
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
          className="p-1.5 hover:bg-secondary/50 rounded-lg transition-colors"
        >
          <Star
            className={`w-5 h-5 transition-colors ${
              game.is_favorite ? 'text-warning fill-warning' : 'text-muted-foreground'
            }`}
          />
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
          <Clock className="w-4 h-4" />
          {formatDuration(game.duration_minutes)}
        </span>
        {game.play_count > 0 && (
          <span className="flex items-center gap-1">
            <Play className="w-4 h-4" />
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
              className="px-2 py-0.5 bg-primary/10 border border-primary/20 rounded-full text-xs text-primary"
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
            <Edit className="w-4 h-4 mr-1" />
            Edit
          </Button>
          <Button size="sm" variant="ghost" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-1" />
            Delete
          </Button>
        </div>
      )}

      {/* Selection indicator */}
      {selectable && (
        <div
          className={`absolute top-3 right-3 w-5 h-5 rounded-full border-2 transition-all ${
            selected
              ? 'bg-primary border-primary'
              : 'border-muted-foreground/50 group-hover:border-foreground'
          }`}
        >
          {selected && (
            <Check className="w-full h-full text-primary-foreground p-0.5" />
          )}
        </div>
      )}
    </Card>
  )
}
