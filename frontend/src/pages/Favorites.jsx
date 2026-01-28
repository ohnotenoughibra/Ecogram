import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import GameCard from '../components/GameCard';
import GameModal from '../components/GameModal';
import ConfirmDialog from '../components/ConfirmDialog';
import Loading from '../components/Loading';

export default function Favorites() {
  const {
    games,
    gamesLoading,
    fetchGames,
    updateGame,
    deleteGame,
    filters,
    setFilters
  } = useApp();

  const [showGameModal, setShowGameModal] = useState(false);
  const [editingGame, setEditingGame] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [gameToDelete, setGameToDelete] = useState(null);

  useEffect(() => {
    // Set favorite filter and fetch
    setFilters(prev => ({ ...prev, favorite: true }));
    fetchGames({ favorite: true });

    // Cleanup on unmount
    return () => {
      setFilters(prev => ({ ...prev, favorite: false }));
    };
  }, []);

  const handleSaveGame = async (gameData) => {
    if (editingGame) {
      await updateGame(editingGame._id, gameData);
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
      setGameToDelete(null);
    }
  };

  const favoriteGames = games.filter(g => g.favorite);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 text-yellow-400">
            <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
          </svg>
          Favorites
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Your starred games for quick access
        </p>
      </div>

      {/* Games List */}
      {gamesLoading ? (
        <Loading text="Loading favorites..." />
      ) : favoriteGames.length === 0 ? (
        <div className="text-center py-12">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No favorites yet</h3>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Star games you use frequently for quick access.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {favoriteGames.map(game => (
            <GameCard
              key={game._id}
              game={game}
              onEdit={handleEditGame}
              onDelete={handleDeleteClick}
              selectable={false}
            />
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
