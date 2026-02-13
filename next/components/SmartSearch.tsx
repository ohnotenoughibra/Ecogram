'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useGameStore } from '@/store'
import { Search, Sparkles } from 'lucide-react'
import type { Game } from '@/types/database'

interface SmartSearchProps {
  onSelect?: (game: Game) => void
  onClose?: () => void
}

export function SmartSearch({ onSelect, onClose }: SmartSearchProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const { games } = useGameStore()

  useEffect(() => {
    const saved = localStorage.getItem('ecogram-recent-searches')
    if (saved) setRecentSearches(JSON.parse(saved))
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
      }
      if (e.key === 'Escape') {
        setIsOpen(false)
        onClose?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  const parseQuery = (q: string) => {
    const lower = q.toLowerCase()
    const filters: {
      position?: string
      difficulty?: string
      category?: string
      maxDuration?: number
      text: string
    } = { text: '' }

    const positions = ['guard', 'half-guard', 'mount', 'side-control', 'back', 'turtle', 'standing']
    for (const pos of positions) {
      if (lower.includes(pos)) {
        filters.position = pos
      }
    }

    if (lower.includes('beginner') || lower.includes('easy') || lower.includes('basic')) {
      filters.difficulty = 'beginner'
    } else if (lower.includes('advanced') || lower.includes('hard') || lower.includes('expert')) {
      filters.difficulty = 'advanced'
    } else if (lower.includes('intermediate')) {
      filters.difficulty = 'intermediate'
    }

    if (lower.includes('warmup') || lower.includes('warm up')) {
      filters.category = 'warmup'
    } else if (lower.includes('cooldown') || lower.includes('cool down')) {
      filters.category = 'cooldown'
    } else if (lower.includes('drill')) {
      filters.category = 'drill'
    }

    const durationMatch = lower.match(/(?:under|less than|max|<)\s*(\d+)\s*(?:min|minutes?)/)
    if (durationMatch) {
      filters.maxDuration = parseInt(durationMatch[1])
    }

    let text = q
    positions.forEach(p => text = text.replace(new RegExp(p, 'gi'), ''))
    text = text.replace(/beginner|intermediate|advanced|easy|hard|basic|expert/gi, '')
    text = text.replace(/warmup|warm up|cooldown|cool down|drill/gi, '')
    text = text.replace(/under|less than|max|<|\d+\s*min(utes?)?|for/gi, '')
    filters.text = text.trim()

    return filters
  }

  const results = useMemo(() => {
    if (!query.trim()) return []

    const filters = parseQuery(query)

    return games.filter((game) => {
      if (filters.position && game.position !== filters.position) return false
      if (filters.difficulty && game.difficulty !== filters.difficulty) return false
      if (filters.category && game.category !== filters.category) return false
      if (filters.maxDuration && game.duration_minutes > filters.maxDuration) return false

      if (filters.text) {
        const searchText = filters.text.toLowerCase()
        const matchesName = game.name.toLowerCase().includes(searchText)
        const matchesTopic = game.topic.toLowerCase().includes(searchText)
        const matchesTechniques = game.techniques.some(t => t.toLowerCase().includes(searchText))
        const matchesDescription = game.description?.toLowerCase().includes(searchText)

        if (!matchesName && !matchesTopic && !matchesTechniques && !matchesDescription) {
          return false
        }
      }

      return true
    }).slice(0, 10)
  }, [query, games])

  const suggestions = useMemo(() => {
    if (query.trim()) return []
    return [
      'guard games under 5 min',
      'beginner warmup',
      'passing drills',
      'back attacks advanced',
      ...recentSearches.slice(0, 3),
    ].slice(0, 6)
  }, [query, recentSearches])

  const handleSelect = (game: Game) => {
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('ecogram-recent-searches', JSON.stringify(updated))

    onSelect?.(game)
    setIsOpen(false)
    setQuery('')
  }

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    inputRef.current?.focus()
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 bg-secondary/50 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200 touch-target"
      >
        <Search className="w-4 h-4" />
        <span className="text-sm hidden sm:inline">Search games...</span>
        <kbd className="hidden sm:inline px-1.5 py-0.5 text-xs bg-background/50 rounded border border-border/50 font-mono">⌘K</kbd>
      </button>
    )
  }

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />

      <div className="relative max-w-lg mx-auto mt-[10vh] px-4">
        <div className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
            <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='Try "guard games under 5 min for beginners"'
              className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            <kbd className="hidden sm:inline px-2 py-1 text-xs bg-secondary/50 rounded border border-border/50 text-muted-foreground font-mono">ESC</kbd>
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {suggestions.length > 0 && (
              <div className="p-2">
                <p className="px-2 py-1 text-xs text-muted-foreground font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Try searching for...
                </p>
                {suggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            {results.length > 0 && (
              <div className="p-2">
                <p className="px-2 py-1 text-xs text-muted-foreground font-medium">
                  {results.length} game{results.length !== 1 ? 's' : ''} found
                </p>
                {results.map((game) => (
                  <button
                    key={game.id}
                    onClick={() => handleSelect(game)}
                    className="w-full text-left px-3 py-3 rounded-lg hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-card-foreground">{game.name}</span>
                      <span className="text-xs text-muted-foreground">{game.duration_minutes}m</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-1.5 py-0.5 bg-primary/10 border border-primary/20 rounded-full text-primary">
                        {game.position}
                      </span>
                      <span className="text-xs px-1.5 py-0.5 bg-secondary rounded-full text-secondary-foreground">
                        {game.difficulty}
                      </span>
                      <span className="text-xs text-muted-foreground">{game.topic}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {query.trim() && results.length === 0 && (
              <div className="p-8 text-center">
                <p className="text-muted-foreground">No games found</p>
                <p className="text-sm text-muted-foreground mt-1">Try different keywords</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
