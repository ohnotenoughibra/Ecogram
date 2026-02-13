'use client'

import { useGameStore } from '@/store'
import { Input, Select, Button } from '@/components/ui'
import { Search, Filter, X, Star } from 'lucide-react'
import type { Position, Difficulty, GameCategory } from '@/types/database'

const positionOptions = [
  { value: '', label: 'All Positions' },
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
  { value: '', label: 'All Levels' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]

const categoryOptions = [
  { value: '', label: 'All Categories' },
  { value: 'warmup', label: 'Warmup' },
  { value: 'main', label: 'Main' },
  { value: 'cooldown', label: 'Cooldown' },
  { value: 'drill', label: 'Drill' },
  { value: 'positional', label: 'Positional' },
]

export function GameFilters() {
  const { filters, setFilters, resetFilters, games } = useGameStore()

  const topics = [...new Set(games.map((g) => g.topic))].sort()
  const topicOptions = [
    { value: '', label: 'All Topics' },
    ...topics.map((t) => ({ value: t, label: t })),
  ]

  const hasActiveFilters =
    filters.search ||
    filters.position ||
    filters.difficulty ||
    filters.category ||
    filters.topic ||
    filters.favorites_only

  return (
    <div className="bg-card/50 backdrop-blur-sm rounded-xl p-4 mb-6 border border-border/50">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search games, techniques..."
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value })}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <Select
            options={positionOptions}
            value={filters.position}
            onChange={(e) => setFilters({ position: e.target.value as Position | '' })}
            className="w-36"
          />
          <Select
            options={difficultyOptions}
            value={filters.difficulty}
            onChange={(e) => setFilters({ difficulty: e.target.value as Difficulty | '' })}
            className="w-36"
          />
          <Select
            options={categoryOptions}
            value={filters.category}
            onChange={(e) => setFilters({ category: e.target.value as GameCategory | '' })}
            className="w-36"
          />
          <Select
            options={topicOptions}
            value={filters.topic}
            onChange={(e) => setFilters({ topic: e.target.value })}
            className="w-36"
          />
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="checkbox"
            checked={filters.favorites_only}
            onChange={(e) => setFilters({ favorites_only: e.target.checked })}
            className="w-4 h-4 rounded bg-input border-border/50 text-primary focus:ring-primary focus:ring-offset-background"
          />
          <Star className="w-4 h-4 text-muted-foreground group-hover:text-warning transition-colors" />
          <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Favorites only</span>
        </label>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            <X className="w-4 h-4 mr-1" />
            Clear filters
          </Button>
        )}
      </div>
    </div>
  )
}
