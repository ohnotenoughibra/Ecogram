'use client'

import { useEffect, useState } from 'react'
import { useGameStore } from '@/store'
import { GameCard } from '@/components/GameCard'
import { GameFilters } from '@/components/GameFilters'
import { GameModal } from '@/components/GameModal'
import { YouTubeImport } from '@/components/YouTubeImport'
import { Button } from '@/components/ui'
import { Plus, Dumbbell, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Game } from '@/types/database'

export default function GamesPage() {
  const { games, isLoading, fetchGames, filteredGames } = useGameStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isYouTubeOpen, setIsYouTubeOpen] = useState(false)
  const [editingGame, setEditingGame] = useState<Game | null>(null)

  useEffect(() => {
    fetchGames()
  }, [fetchGames])

  const handleEdit = (game: Game) => {
    setEditingGame(game)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingGame(null)
  }

  const filtered = filteredGames()

  return (
    <div className="content-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            <span className="gradient-text">Game Library</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            {games.length} games &middot; {filtered.length} shown
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => setIsYouTubeOpen(true)} title="Import from YouTube">
            <svg className="w-5 h-5 sm:mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            <span className="hidden sm:inline">YouTube</span>
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-5 h-5 sm:mr-2" />
            <span className="hidden sm:inline">Add Game</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <GameFilters />

      {/* Loading state */}
      {isLoading && games.length === 0 && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16 sm:py-20"
        >
          <div className="w-16 h-16 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Dumbbell className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">No games found</h3>
          <p className="text-muted-foreground mb-6">
            {games.length === 0
              ? 'Add your first game to get started'
              : 'Try adjusting your filters'}
          </p>
          {games.length === 0 && (
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Game
            </Button>
          )}
        </motion.div>
      )}

      {/* Game grid */}
      {filtered.length > 0 && (
        <div className="card-grid">
          {filtered.map((game, i) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.05, 0.3) }}
            >
              <GameCard game={game} onEdit={() => handleEdit(game)} />
            </motion.div>
          ))}
        </div>
      )}

      {/* Game Modal */}
      <GameModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        game={editingGame}
      />

      {/* YouTube Import Modal */}
      <YouTubeImport
        isOpen={isYouTubeOpen}
        onClose={() => setIsYouTubeOpen(false)}
      />
    </div>
  )
}
