import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import GameCard from '../components/GameCard';
import GameModal from '../components/GameModal';
import ConfirmDialog from '../components/ConfirmDialog';
import Loading from '../components/Loading';

export default function Recent() {
  const {
    fetchRecentGames,
    updateGame,
    deleteGame
  } = useApp();

  const [recentGames, setRecentGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGameModal, setShowGameModal] = useState(false);
  const [editingGame, setEditingGame] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [gameToDelete, setGameToDelete] = useState(null);

  useEffect(() => {
    loadRecentGames();
  }, []);

  const loadRecentGames = async () => {
    setLoading(true);
    const games = await fetchRecentGames(20);
    setRecentGames(games);
    setLoading(false);
  };

  const handleSaveGame = async (gameData) => {
    if (editingGame) {
      await updateGame(editingGame._id, gameData);
      loadRecentGames();
    }
    setShowGameModal(false);
    setEditingGame(null);
  };

  const handleEditGame = (game) => {
    setEditingGame(game);
    setShowGameModal(true);
  };

  const handleDeleteClick = (game) => {
    setGameToDelete(game);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (gameToDelete) {
      await deleteGame(gameToDelete._id);
      setRecentGames(prev => prev.filter(g => g._id !== gameToDelete._id));
      setGameToDelete(null);
    }
  };

  const formatRelativeTime = (date) => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now - past;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return past.toLocaleDateString();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 text-primary-500">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
          </svg>
          Recently Used
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Games you've used in your training sessions
        </p>
      </div>

      {/* Games List */}
      {loading ? (
        <Loading text="Loading recent games..." />
      ) : recentGames.length === 0 ? (
        <div className="text-center py-12">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No recent games</h3>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Start using games in sessions to see them here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {recentGames.map(game => (
            <div key={game._id}>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
                Last used: {formatRelativeTime(game.lastUsed)}
              </p>
              <GameCard
                game={game}
                onEdit={handleEditGame}
                onDelete={handleDeleteClick}
                selectable={false}
              />
            </div>
          ))}
        </div>
      )}

      {/* Game Modal */}
      <GameModal
        isOpen={showGameModal}
        onClose={() => {
          setShowGameModal(false);
          setEditingGame(null);
        }}
        onSave={handleSaveGame}
        game={editingGame}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setGameToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Game"
        message={`Are you sure you want to delete "${gameToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
}
