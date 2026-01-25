import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import api from '../utils/api';

const topicColors = {
  offensive: 'bg-red-500',
  defensive: 'bg-blue-500',
  control: 'bg-purple-500',
  transition: 'bg-green-500'
};

export default function SessionItem({ session, onEdit, onDelete, onShare, onSessionUpdate, onSaveAsTemplate }) {
  const navigate = useNavigate();
  const { updateSession, showToast } = useApp();
  const [isExpanded, setIsExpanded] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showAddGame, setShowAddGame] = useState(false);
  const [availableGames, setAvailableGames] = useState([]);
  const [gameSearch, setGameSearch] = useState('');
  const [loadingGames, setLoadingGames] = useState(false);

  // Fetch available games when add game modal opens
  useEffect(() => {
    if (showAddGame && availableGames.length === 0) {
      fetchAvailableGames();
    }
  }, [showAddGame]);

  const fetchAvailableGames = async () => {
    setLoadingGames(true);
    try {
      const response = await api.get('/games', { params: { limit: 100 } });
      setAvailableGames(response.data.games || []);
    } catch (err) {
      showToast('Failed to fetch games', 'error');
    } finally {
      setLoadingGames(false);
    }
  };

  const handleAddGame = async (gameId) => {
    try {
      const response = await api.put(`/sessions/${session._id}/games`, {
        action: 'add',
        gameId
      });
      if (onSessionUpdate) onSessionUpdate(response.data);
      showToast('Game added to session', 'success');
      setShowAddGame(false);
      setGameSearch('');
    } catch (err) {
      showToast('Failed to add game', 'error');
    }
  };

  const handleRemoveGame = async (gameId) => {
    // Find the game being removed for undo
    const removedGame = session.games.find(g => (g.game?._id || g.game) === gameId);
    const gameName = removedGame?.game?.name || 'Game';

    try {
      const response = await api.put(`/sessions/${session._id}/games`, {
        action: 'remove',
        gameId
      });
      if (onSessionUpdate) onSessionUpdate(response.data);

      // Show toast with undo action
      showToast(
        `"${gameName}" removed`,
        'success',
        5000,
        {
          label: 'Undo',
          onClick: async () => {
            try {
              const undoResponse = await api.put(`/sessions/${session._id}/games`, {
                action: 'add',
                gameId
              });
              if (onSessionUpdate) onSessionUpdate(undoResponse.data);
              showToast('Game restored', 'success');
            } catch (err) {
              showToast('Failed to restore game', 'error');
            }
          }
        }
      );
    } catch (err) {
      showToast('Failed to remove game', 'error');
    }
  };

  const handleMoveGame = async (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= session.games.length) return;

    const gameIds = session.games.map(g => g.game?._id || g.game);
    const [moved] = gameIds.splice(fromIndex, 1);
    gameIds.splice(toIndex, 0, moved);

    try {
      const response = await api.put(`/sessions/${session._id}/games`, {
        action: 'reorder',
        gameIds
      });
      if (onSessionUpdate) onSessionUpdate(response.data);
    } catch (err) {
      showToast('Failed to reorder games', 'error');
    }
  };

  // Filter games that are not already in the session
  const sessionGameIds = new Set(session.games?.map(g => g.game?._id || g.game) || []);
  const filteredGames = availableGames.filter(g =>
    !sessionGameIds.has(g._id) &&
    g.name.toLowerCase().includes(gameSearch.toLowerCase())
  );

  const handleFavoriteToggle = async (e) => {
    e.stopPropagation();
    await updateSession(session._id, { favorite: !session.favorite });
  };

  const handleStartSession = (e) => {
    e.stopPropagation();
    navigate(`/session/${session._id}`);
  };

  const completedCount = session.games?.filter(g => g.completed).length || 0;
  const totalGames = session.games?.length || 0;

  return (
    <div
      className="card card-hover p-4 cursor-pointer"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
              {session.name}
            </h3>
            {session.isPublic && (
              <span className="badge bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                Shared
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
            <span>{totalGames} games</span>
            {session.scheduledDate && (
              <span>
                Scheduled: {new Date(session.scheduledDate).toLocaleDateString()}
              </span>
            )}
          </div>

          {/* Progress bar */}
          {totalGames > 0 && (
            <div className="mt-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all"
                    style={{ width: `${(completedCount / totalGames) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {completedCount}/{totalGames}
                </span>
              </div>
            </div>
          )}

          {/* Topic distribution */}
          {session.games && session.games.length > 0 && (
            <div className="flex gap-1 mt-2">
              {session.games.slice(0, 6).map((g, idx) => (
                <span
                  key={idx}
                  className={`w-2 h-2 rounded-full ${topicColors[g.game?.topic] || 'bg-gray-400'}`}
                  title={g.game?.name}
                />
              ))}
              {session.games.length > 6 && (
                <span className="text-xs text-gray-400">+{session.games.length - 6}</span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleFavoriteToggle}
            className={`p-1 rounded-full transition-colors ${
              session.favorite
                ? 'text-yellow-400 hover:text-yellow-500'
                : 'text-gray-300 hover:text-yellow-400 dark:text-gray-600'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="mt-4 space-y-3 animate-fade-in">
          {/* Games list */}
          {session.games && session.games.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Games</h4>
                {!editMode && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditMode(true);
                    }}
                    className="text-xs text-primary-500 hover:text-primary-600"
                  >
                    Edit Games
                  </button>
                )}
                {editMode && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditMode(false);
                    }}
                    className="text-xs text-green-500 hover:text-green-600"
                  >
                    Done
                  </button>
                )}
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {session.games.map((g, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800 ${
                      g.completed ? 'opacity-60' : ''
                    }`}
                  >
                    {editMode && (
                      <div className="flex flex-col gap-0.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveGame(idx, idx - 1);
                          }}
                          disabled={idx === 0}
                          className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                            <path fillRule="evenodd" d="M8 3.5a.5.5 0 01.354.146l3.5 3.5a.5.5 0 11-.708.708L8 4.707 4.854 7.854a.5.5 0 11-.708-.708l3.5-3.5A.5.5 0 018 3.5z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveGame(idx, idx + 1);
                          }}
                          disabled={idx === session.games.length - 1}
                          className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                            <path fillRule="evenodd" d="M8 12.5a.5.5 0 01-.354-.146l-3.5-3.5a.5.5 0 11.708-.708L8 11.293l3.146-3.147a.5.5 0 11.708.708l-3.5 3.5A.5.5 0 018 12.5z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    )}
                    <span className={`w-2 h-2 rounded-full ${topicColors[g.game?.topic] || 'bg-gray-400'}`} />
                    <span className={`flex-1 text-sm ${g.completed ? 'line-through' : ''}`}>
                      {g.game?.name || 'Unknown game'}
                    </span>
                    {editMode ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveGame(g.game?._id || g.game);
                        }}
                        className="text-red-400 hover:text-red-500 p-1"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                          <path fillRule="evenodd" d="M4.28 3.22a.75.75 0 00-1.06 1.06L6.94 8l-3.72 3.72a.75.75 0 101.06 1.06L8 9.06l3.72 3.72a.75.75 0 101.06-1.06L9.06 8l3.72-3.72a.75.75 0 00-1.06-1.06L8 6.94 4.28 3.22z" clipRule="evenodd" />
                        </svg>
                      </button>
                    ) : (
                      g.completed && (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 text-green-500">
                          <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 01.208 1.04l-5 7.5a.75.75 0 01-1.154.114l-3-3a.75.75 0 011.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 011.04-.207z" clipRule="evenodd" />
                        </svg>
                      )
                    )}
                  </div>
                ))}
              </div>
              {/* Add game button in edit mode */}
              {editMode && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAddGame(true);
                  }}
                  className="w-full p-2 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 text-sm hover:border-primary-400 hover:text-primary-500 transition-colors flex items-center justify-center gap-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                    <path d="M8.75 4.75a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" />
                  </svg>
                  Add Game
                </button>
              )}
            </div>
          )}

          {/* Empty state when no games and in edit mode */}
          {(!session.games || session.games.length === 0) && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Games</h4>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAddGame(true);
                }}
                className="w-full p-3 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 text-sm hover:border-primary-400 hover:text-primary-500 transition-colors flex items-center justify-center gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                  <path d="M8.75 4.75a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" />
                </svg>
                Add your first game
              </button>
            </div>
          )}

          {/* Meta info */}
          <div className="text-xs text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-800">
            Created {new Date(session.createdAt).toLocaleDateString()}
            {session.lastUsed && ` • Last used: ${new Date(session.lastUsed).toLocaleDateString()}`}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              onClick={handleStartSession}
              className="btn-primary text-sm flex-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
              Start
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(session);
              }}
              className="btn-secondary text-sm"
            >
              Rename
            </button>
            {onSaveAsTemplate && session.games?.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSaveAsTemplate(session);
                }}
                className="btn-secondary text-sm"
                title="Save as Template"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path d="M5.127 3.502L5.25 3.5h9.5c.041 0 .082 0 .123.002A2.251 2.251 0 0012.75 2h-5.5a2.25 2.25 0 00-2.123 1.502zM1 10.25A2.25 2.25 0 013.25 8h13.5A2.25 2.25 0 0119 10.25v5.5A2.25 2.25 0 0116.75 18H3.25A2.25 2.25 0 011 15.75v-5.5zM3.25 6.5c-.04 0-.082 0-.123.002A2.25 2.25 0 015.25 5h9.5c.98 0 1.814.627 2.123 1.502a3.819 3.819 0 00-.123-.002H3.25z" />
                </svg>
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onShare(session);
              }}
              className="btn-secondary text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M13 4.5a2.5 2.5 0 11.702 1.737L6.97 9.604a2.518 2.518 0 010 .792l6.733 3.367a2.5 2.5 0 11-.671 1.341l-6.733-3.367a2.5 2.5 0 110-3.475l6.733-3.366A2.52 2.52 0 0113 4.5z" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(session);
              }}
              className="btn-danger text-sm px-3"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Add Game Modal */}
      {showAddGame && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            e.stopPropagation();
            setShowAddGame(false);
            setGameSearch('');
          }}
        >
          <div className="modal-content max-w-md" onClick={e => e.stopPropagation()}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Add Game to Session
                </h3>
                <button
                  onClick={() => {
                    setShowAddGame(false);
                    setGameSearch('');
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                  </svg>
                </button>
              </div>

              {/* Search input */}
              <div className="relative mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                </svg>
                <input
                  type="text"
                  value={gameSearch}
                  onChange={(e) => setGameSearch(e.target.value)}
                  placeholder="Search games..."
                  className="input pl-10"
                  autoFocus
                />
              </div>

              {/* Games list */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {loadingGames ? (
                  <div className="flex justify-center py-8">
                    <span className="spinner" />
                  </div>
                ) : filteredGames.length > 0 ? (
                  filteredGames.map(game => (
                    <button
                      key={game._id}
                      onClick={() => handleAddGame(game._id)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                    >
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${topicColors[game.topic] || 'bg-gray-400'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900 dark:text-white truncate">
                          {game.name}
                        </div>
                        {game.skills && game.skills.length > 0 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {game.skills.slice(0, 3).join(', ')}
                          </div>
                        )}
                      </div>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 text-primary-500 flex-shrink-0">
                        <path d="M8.75 4.75a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" />
                      </svg>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    {gameSearch ? 'No games found' : 'All games are already in this session'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
