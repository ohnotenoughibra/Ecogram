import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import GameCard from '../components/GameCard';
import GameModal from '../components/GameModal';
import FilterBar from '../components/FilterBar';
import BulkActionBar from '../components/BulkActionBar';
import ConfirmModal from '../components/ConfirmModal';
import Loading from '../components/Loading';
import QuickAccess from '../components/QuickAccess';
import SmartSessionBuilder from '../components/SmartSessionBuilder';
import { WhatsNewBanner } from '../components/FeatureTip';
import SkillBalance from '../components/SkillBalance';
import EmptyState from '../components/EmptyState';

export default function Games() {
  const {
    games,
    gamesLoading,
    gamesPagination,
    fetchGames,
    createGame,
    updateGame,
    deleteGame,
    selectedGames,
    sessions,
    fetchSessions,
    addGamesToSession,
    createSession
  } = useApp();

  const [searchParams, setSearchParams] = useSearchParams();
  const [showGameModal, setShowGameModal] = useState(false);
  const [editingGame, setEditingGame] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [gameToDelete, setGameToDelete] = useState(null);
  const [showSessionSelect, setShowSessionSelect] = useState(false);
  const [showSmartBuilder, setShowSmartBuilder] = useState(false);

  useEffect(() => {
    fetchGames();
    fetchSessions();
  }, []);

  // Handle ?edit= and ?new= query parameters
  useEffect(() => {
    const editId = searchParams.get('edit');
    const isNew = searchParams.get('new');

    if (editId && games.length > 0) {
      const gameToEdit = games.find(g => g._id === editId);
      if (gameToEdit) {
        setEditingGame(gameToEdit);
        setShowGameModal(true);
        // Clear the query param after opening
        setSearchParams({});
      }
    } else if (isNew === 'true') {
      setEditingGame(null);
      setShowGameModal(true);
      // Clear the query param after opening
      setSearchParams({});
    }
  }, [searchParams, games, setSearchParams]);

  // Keyboard shortcut: N for new game
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if typing in input or modal is open
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }
      if (showGameModal || showDeleteConfirm || showSessionSelect) {
        return;
      }

      if (e.key === 'n' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setEditingGame(null);
        setShowGameModal(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showGameModal, showDeleteConfirm, showSessionSelect]);

  const handleSearch = useCallback(() => {
    fetchGames({ page: 1 });
  }, [fetchGames]);

  const handleSaveGame = async (gameData) => {
    if (editingGame) {
      await updateGame(editingGame._id, gameData);
    } else {
      await createGame(gameData);
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

  const handleAddToSession = () => {
    setShowSessionSelect(true);
  };

  const handleSelectSession = async (sessionId) => {
    if (sessionId === 'new') {
      const name = prompt('Enter session name:');
      if (name) {
        const result = await createSession({
          name,
          gameIds: Array.from(selectedGames)
        });
        if (result.success) {
          setShowSessionSelect(false);
        }
      }
    } else {
      await addGamesToSession(sessionId, Array.from(selectedGames));
      setShowSessionSelect(false);
    }
  };

  const handleLoadMore = () => {
    if (gamesPagination.page < gamesPagination.pages) {
      fetchGames({ page: gamesPagination.page + 1 });
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* What's New Banner */}
      <WhatsNewBanner />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Games</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {gamesPagination.total} games in your library
          </p>
        </div>
        <button
          onClick={() => {
            setEditingGame(null);
            setShowGameModal(true);
          }}
          className="btn-primary"
          title="Create new game (N)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-1">
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
          <span className="hidden sm:inline">New Game</span>
          <span className="sm:hidden">New</span>
          <kbd className="hidden lg:inline-flex ml-2 px-1.5 py-0.5 text-xs font-mono bg-primary-700 rounded">N</kbd>
        </button>
      </div>

      {/* Quick Access Section */}
      <QuickAccess onSmartBuild={() => setShowSmartBuilder(true)} />

      {/* Skill Balance - show only when user has games */}
      {games.length > 0 && localStorage.getItem('showBalanceTips') !== 'false' && (
        <div className="mb-6">
          <SkillBalance showSuggestions={games.length >= 3} />
        </div>
      )}

      {/* Filters */}
      <div className="mb-6">
        <FilterBar onSearch={handleSearch} />
      </div>

      {/* Games List */}
      {gamesLoading && games.length === 0 ? (
        <Loading text="Loading games..." />
      ) : games.length === 0 ? (
        <EmptyState
          type="games"
          onAction={() => setShowGameModal(true)}
        />
      ) : (
        <div className="space-y-4">
          {games.map(game => (
            <GameCard
              key={game._id}
              game={game}
              onEdit={handleEditGame}
              onDelete={handleDeleteClick}
            />
          ))}

          {/* Load more */}
          {gamesPagination.page < gamesPagination.pages && (
            <div className="text-center pt-4">
              <button
                onClick={handleLoadMore}
                disabled={gamesLoading}
                className="btn-secondary"
              >
                {gamesLoading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Bulk action bar */}
      <BulkActionBar onAddToSession={handleAddToSession} />

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
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setGameToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Game"
        message={`Are you sure you want to delete "${gameToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        danger
      />

      {/* Session Select Modal */}
      {showSessionSelect && (
        <div className="modal-overlay" onClick={() => setShowSessionSelect(false)}>
          <div className="modal-content max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Add to Session
              </h3>
            </div>
            <div className="p-4 max-h-64 overflow-y-auto">
              <button
                onClick={() => handleSelectSession('new')}
                className="w-full text-left p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-primary-500">
                  <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                </svg>
                <span className="font-medium">Create New Session</span>
              </button>

              {sessions.length > 0 && (
                <>
                  <div className="divider my-2" />
                  {sessions.map(session => (
                    <button
                      key={session._id}
                      onClick={() => handleSelectSession(session._id)}
                      className="w-full text-left p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <p className="font-medium text-gray-900 dark:text-white">{session.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {session.games?.length || 0} games
                      </p>
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Padding for bulk action bar */}
      {selectedGames.size > 0 && <div className="h-20" />}

      {/* Smart Session Builder */}
      <SmartSessionBuilder
        isOpen={showSmartBuilder}
        onClose={() => setShowSmartBuilder(false)}
        onSessionCreated={() => fetchSessions()}
      />
    </div>
  );
}
