'use client'

import { useEffect, useState } from 'react'
import { useGameStore } from '@/store'
import { GameCard } from '@/components/GameCard'
import { GameFilters } from '@/components/GameFilters'
import { GameModal } from '@/components/GameModal'
import { Button } from '@/components/ui'
import type { Game } from '@/types/database'

export default function GamesPage() {
  const { games, isLoading, fetchGames, filteredGames } = useGameStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Game Library</h1>
          <p className="text-gray-400 mt-1">
            {games.length} games • {filtered.length} shown
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Game
        </Button>
      </div>

      {/* Filters */}
      <GameFilters />

      {/* Loading state */}
      {isLoading && games.length === 0 && (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-[#1A1A1A] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No games found</h3>
          <p className="text-gray-400 mb-6">
            {games.length === 0
              ? 'Add your first game to get started'
              : 'Try adjusting your filters'}
          </p>
          {games.length === 0 && (
            <Button onClick={() => setIsModalOpen(true)}>Add Your First Game</Button>
          )}
        </div>
      )}

      {/* Game grid */}
      {filtered.length > 0 && (
        <div className="card-grid">
          {filtered.map((game) => (
            <GameCard key={game.id} game={game} onEdit={() => handleEdit(game)} />
          ))}
        </div>
      )}

      {/* Game Modal */}
      <GameModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        game={editingGame}
      />
    </div>
  )
}
