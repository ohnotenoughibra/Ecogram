import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import GameCard from '../components/GameCard';
import GameModal from '../components/GameModal';
import FilterBar from '../components/FilterBar';
import BulkActionBar from '../components/BulkActionBar';
import ConfirmDialog from '../components/ConfirmDialog';
import Loading from '../components/Loading';
import QuickAccess from '../components/QuickAccess';
import SmartSessionBuilder from '../components/SmartSessionBuilder';
import BulkImport from '../components/BulkImport';
import { WhatsNewBanner } from '../components/FeatureTip';
import SkillBalance from '../components/SkillBalance';
import EmptyState from '../components/EmptyState';
import SmartTrainingHub from '../components/SmartTrainingHub';
import GameOfTheDay from '../components/GameOfTheDay';
import SmartPlaylists from '../components/SmartPlaylists';
import PrintableGameCards from '../components/PrintableGameCards';

export default function Games() {
  const navigate = useNavigate();
  const { user } = useAuth();
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
    createSession,
    setFilters
  } = useApp();

  // User display preferences with sensible defaults
  const prefs = user?.preferences || {};
  const showQuickAccess = prefs.showQuickAccess !== false;
  const showRecommendations = prefs.showRecommendations !== false;
  const showGameOfDay = prefs.showGameOfDay !== false;
  const showSkillBalance = prefs.showSkillBalance !== false;
  const showPositionChips = prefs.showPositionChips !== false;
  const compactMode = prefs.compactMode === true;

  const [searchParams, setSearchParams] = useSearchParams();
  const [showGameModal, setShowGameModal] = useState(false);
  const [editingGame, setEditingGame] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [gameToDelete, setGameToDelete] = useState(null);
  const [showSessionSelect, setShowSessionSelect] = useState(false);
  const [showSmartBuilder, setShowSmartBuilder] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('gamesViewMode') || 'list';
  });
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Persist view mode preference
  useEffect(() => {
    localStorage.setItem('gamesViewMode', viewMode);
  }, [viewMode]);

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
      setShowSessionSelect(false);
      setNewSessionName('');
      setShowNewSessionModal(true);
    } else {
      await addGamesToSession(sessionId, Array.from(selectedGames));
      setShowSessionSelect(false);
    }
  };

  const handleCreateNewSession = async (e) => {
    e.preventDefault();
    if (!newSessionName.trim()) return;

    setIsCreatingSession(true);
    const result = await createSession({
      name: newSessionName,
      gameIds: Array.from(selectedGames)
    });
    setIsCreatingSession(false);

    if (result.success) {
      setShowNewSessionModal(false);
      setNewSessionName('');
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
          <div className="flex items-center gap-3">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {gamesPagination.total} games in your library
            </p>
            {/* View toggle */}
            <div className="hidden sm:flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
                title="List view"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M2 4a1 1 0 011-1h10a1 1 0 110 2H3a1 1 0 01-1-1zm0 4a1 1 0 011-1h10a1 1 0 110 2H3a1 1 0 01-1-1zm0 4a1 1 0 011-1h10a1 1 0 110 2H3a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('compact')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'compact'
                    ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
                title="Compact view"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                  <path d="M2 3.5A1.5 1.5 0 013.5 2h9A1.5 1.5 0 0114 3.5v9a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 012 12.5v-9zM3.5 3a.5.5 0 00-.5.5v9a.5.5 0 00.5.5h9a.5.5 0 00.5-.5v-9a.5.5 0 00-.5-.5h-9z" />
                  <path d="M4 5.25a.75.75 0 01.75-.75h6.5a.75.75 0 010 1.5h-6.5A.75.75 0 014 5.25zm0 2.5a.75.75 0 01.75-.75h6.5a.75.75 0 010 1.5h-6.5A.75.75 0 014 7.75zm0 2.5a.75.75 0 01.75-.75h6.5a.75.75 0 010 1.5h-6.5a.75.75 0 01-.75-.75z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPrintModal(true)}
            className="btn-secondary"
            title="Export to PDF / Print"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 sm:mr-1">
              <path fillRule="evenodd" d="M5 2.75C5 1.784 5.784 1 6.75 1h6.5c.966 0 1.75.784 1.75 1.75v3.552c.377.046.752.097 1.126.153A2.212 2.212 0 0118 8.653v4.097A2.25 2.25 0 0115.75 15h-.241l.305 1.984A1.75 1.75 0 0114.084 19H5.915a1.75 1.75 0 01-1.73-2.016L4.492 15H4.25A2.25 2.25 0 012 12.75V8.653c0-1.082.775-2.034 1.874-2.198.374-.056.749-.107 1.126-.153V2.75zm1.5 0v3.401a41.709 41.709 0 017 0V2.75a.25.25 0 00-.25-.25h-6.5a.25.25 0 00-.25.25zM7.364 17.5l.294-1.914a.25.25 0 00-.247-.586H4.25a.75.75 0 01-.75-.75V8.653c0-.362.26-.678.616-.74a39.652 39.652 0 0111.768 0c.356.062.616.378.616.74v5.597a.75.75 0 01-.75.75h-3.161a.25.25 0 00-.247.586l.294 1.914H7.364z" clipRule="evenodd" />
            </svg>
            <span className="hidden sm:inline">Print</span>
          </button>
          <button
            onClick={() => setShowBulkImport(true)}
            className="btn-secondary"
            title="Bulk import games"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 sm:mr-1">
              <path d="M9.25 13.25a.75.75 0 001.5 0V4.636l2.955 3.129a.75.75 0 001.09-1.03l-4.25-4.5a.75.75 0 00-1.09 0l-4.25 4.5a.75.75 0 101.09 1.03L9.25 4.636v8.614z" />
              <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
            </svg>
            <span className="hidden sm:inline">Import</span>
          </button>
          <button
            onClick={() => {
              setEditingGame(null);
              setShowGameModal(true);
            }}
            className="btn-primary"
            title="Create new game (N)"
            data-tour="new-game"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-1">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
            <span className="hidden sm:inline">New Game</span>
            <span className="sm:hidden">New</span>
            <kbd className="hidden lg:inline-flex ml-2 px-1.5 py-0.5 text-xs font-mono bg-primary-700 rounded">N</kbd>
          </button>
        </div>
      </div>

      {/* Quick Access Section - toggleable via user preferences */}
      {showQuickAccess && (
        <QuickAccess onSmartBuild={() => setShowSmartBuilder(true)} compact={compactMode} />
      )}

      {/* Smart Training Hub - Unified coaching dashboard */}
      {showRecommendations && (
        <div data-tour="smart-hub">
          <SmartTrainingHub
            compact={compactMode}
            onFilterChange={(newFilters) => {
              setFilters(prev => ({ ...prev, ...newFilters }));
              fetchGames({ page: 1, ...newFilters });
            }}
          />
        </div>
      )}

      {/* Game of the Day - Daily suggested game */}
      {showGameOfDay && games.length > 0 && <GameOfTheDay compact={compactMode} />}

      {/* Skill Balance - show only when user has games and preference is enabled */}
      {showSkillBalance && games.length > 0 && (
        <div className="mb-6">
          <SkillBalance compact={compactMode} />
        </div>
      )}

      {/* Smart Playlists - Auto-generated game collections */}
      {games.length >= 5 && (
        <SmartPlaylists compact={compactMode} />
      )}

      {/* Filters */}
      <div className="mb-6" data-tour="filters">
        <FilterBar onSearch={handleSearch} showQuickPositions={showPositionChips} />
      </div>

      {/* Games List */}
      {gamesLoading && games.length === 0 ? (
        <Loading text="Loading games..." />
      ) : games.length === 0 ? (
        <EmptyState
          type="games"
          onAction={() => setShowGameModal(true)}
          onSecondaryAction={() => navigate('/ai')}
          onQuickAction={(action) => {
            if (action === 'import') setShowBulkImport(true);
            if (action === 'templates') navigate('/ai?tab=templates');
          }}
        />
      ) : (
        <div className={viewMode === 'compact' ? 'space-y-2' : 'space-y-4'}>
          {games.map((game, index) => (
            <div key={game._id} data-tour={index === 0 ? 'game-card' : undefined}>
              <GameCard
                game={game}
                onEdit={handleEditGame}
                onDelete={handleDeleteClick}
                compact={viewMode === 'compact'}
              />
            </div>
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

      {/* New Session Name Modal */}
      {showNewSessionModal && (
        <div className="modal-overlay" onClick={() => setShowNewSessionModal(false)}>
          <div className="modal-content max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Create New Session
              </h3>
              <form onSubmit={handleCreateNewSession}>
                <div className="mb-4">
                  <label className="label">Session Name</label>
                  <input
                    type="text"
                    value={newSessionName}
                    onChange={(e) => setNewSessionName(e.target.value)}
                    placeholder="e.g., Tuesday Guard Work"
                    className="input"
                    autoFocus
                    required
                  />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {selectedGames.size} game{selectedGames.size !== 1 ? 's' : ''} will be added to this session
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowNewSessionModal(false)}
                    className="btn-secondary flex-1"
                    disabled={isCreatingSession}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                    disabled={isCreatingSession || !newSessionName.trim()}
                  >
                    {isCreatingSession && (
                      <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    {isCreatingSession ? 'Creating...' : 'Create Session'}
                  </button>
                </div>
              </form>
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

      {/* Bulk Import Modal */}
      <BulkImport
        isOpen={showBulkImport}
        onClose={() => setShowBulkImport(false)}
      />

      {/* Print / PDF Export Modal */}
      <PrintableGameCards
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        title="My Game Library"
      />
    </div>
  );
}
