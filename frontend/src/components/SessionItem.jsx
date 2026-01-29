import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { getTopicColor } from '../utils/constants';
import api from '../utils/api';

// Session status helper
const getSessionStatus = (session) => {
  const completedCount = session.games?.filter(g => g.completed).length || 0;
  const totalGames = session.games?.length || 0;

  if (totalGames === 0) return { label: 'Empty', color: 'gray', icon: 'folder' };
  if (completedCount === totalGames) return { label: 'Completed', color: 'green', icon: 'check' };
  if (completedCount > 0) return { label: 'In Progress', color: 'amber', icon: 'play' };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (session.scheduledDate) {
    const scheduled = new Date(session.scheduledDate);
    scheduled.setHours(0, 0, 0, 0);
    if (scheduled.getTime() === today.getTime()) return { label: 'Today', color: 'primary', icon: 'clock' };
    if (scheduled < today) return { label: 'Overdue', color: 'red', icon: 'alert' };
  }

  return { label: 'Ready', color: 'blue', icon: 'ready' };
};

export default function SessionItem({ session, onEdit, onDelete, onShare, onSessionUpdate, onSaveAsTemplate }) {
  const navigate = useNavigate();
  const { updateSession, showToast } = useApp();
  const [isExpanded, setIsExpanded] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showAddGame, setShowAddGame] = useState(false);
  const [availableGames, setAvailableGames] = useState([]);
  const [gameSearch, setGameSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loadingGames, setLoadingGames] = useState(false);
  const searchTimeout = useRef(null);

  // Debounce search input
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setDebouncedSearch(gameSearch);
    }, 300);
    return () => clearTimeout(searchTimeout.current);
  }, [gameSearch]);

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

  // Filter games that are not already in the session (use debounced search)
  const sessionGameIds = new Set(session.games?.map(g => g.game?._id || g.game) || []);
  const filteredGames = availableGames.filter(g =>
    !sessionGameIds.has(g._id) &&
    g.name.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const handleFavoriteToggle = async (e) => {
    e.stopPropagation();
    await updateSession(session._id, { favorite: !session.favorite });
  };

  const handleDuplicateSession = async (e) => {
    e.stopPropagation();
    try {
      const response = await api.post(`/sessions/${session._id}/duplicate`);
      showToast('Session duplicated!', 'success');
      if (onSessionUpdate) onSessionUpdate(response.data);
    } catch (err) {
      showToast('Failed to duplicate session', 'error');
    }
  };

  const handleStartSession = (e) => {
    e.stopPropagation();
    navigate(`/session/${session._id}`);
  };

  const completedCount = session.games?.filter(g => g.completed).length || 0;
  const totalGames = session.games?.length || 0;
  const progressPercent = totalGames > 0 ? Math.round((completedCount / totalGames) * 100) : 0;
  const status = getSessionStatus(session);

  // Status badge colors
  const statusColors = {
    gray: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    primary: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
    red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
  };

  return (
    <div
      className={`card card-hover p-4 cursor-pointer transition-all duration-200 ${
        isExpanded ? 'ring-2 ring-primary-200 dark:ring-primary-800' : ''
      } ${status.color === 'primary' ? 'border-l-4 border-l-primary-500' : ''}`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex items-start gap-3">
        {/* Progress Circle - Visual anchor */}
        <div className="flex-shrink-0 relative">
          <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
            {totalGames > 0 ? (
              <div className="relative w-full h-full flex items-center justify-center">
                {/* Circular progress background */}
                <svg className="absolute w-10 h-10" viewBox="0 0 36 36">
                  <path
                    className="text-gray-200 dark:text-gray-700"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className={progressPercent === 100 ? 'text-green-500' : 'text-primary-500'}
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray={`${progressPercent}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className={`text-xs font-bold ${progressPercent === 100 ? 'text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}`}>
                  {progressPercent}%
                </span>
              </div>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-gray-400">
                <path d="M3.75 3A1.75 1.75 0 002 4.75v3.26a3.235 3.235 0 011.75-.51h12.5c.644 0 1.245.188 1.75.51V6.75A1.75 1.75 0 0016.25 5h-4.836a.25.25 0 01-.177-.073L9.823 3.513A1.75 1.75 0 008.586 3H3.75zM3.75 9A1.75 1.75 0 002 10.75v4.5c0 .966.784 1.75 1.75 1.75h12.5A1.75 1.75 0 0018 15.25v-4.5A1.75 1.75 0 0016.25 9H3.75z" />
              </svg>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                  {session.name}
                </h3>
                <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[status.color]}`}>
                  {status.label}
                </span>
                {session.isPublic && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                      <path d="M13 4.5a2.5 2.5 0 11.702 1.737L6.97 9.604a2.518 2.518 0 010 .792l6.733 3.367a2.5 2.5 0 11-.671 1.341l-6.733-3.367a2.5 2.5 0 110-3.475l6.733-3.366A2.52 2.52 0 0113 4.5z" />
                    </svg>
                    Shared
                  </span>
                )}
              </div>

              {/* Session meta info */}
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                    <path fillRule="evenodd" d="M11.986 3H12a2 2 0 012 2v6a2 2 0 01-1.5 1.937v-.059A1.5 1.5 0 0011 11.5v-6c0-.057.003-.112.009-.166A.503.503 0 0011 5.25V5a.5.5 0 01.014-.116A.503.503 0 0011 4.75a1.501 1.501 0 01.986-1.75zM4 5.5a1.5 1.5 0 011.5-1.5h4A1.5 1.5 0 0111 5.5v6A1.5 1.5 0 019.5 13h-4A1.5 1.5 0 014 11.5v-6zM2 5a2 2 0 012-2h.014c-.01.05-.014.1-.014.166V5.25a.48.48 0 00.014.134A.5.5 0 014 5.5v6a1.5 1.5 0 001.5 1.437v.058A2 2 0 012 11V5z" clipRule="evenodd" />
                  </svg>
                  {totalGames} game{totalGames !== 1 ? 's' : ''}
                </span>
                {session.scheduledDate && (
                  <span className="flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                      <path fillRule="evenodd" d="M4 1.75a.75.75 0 01.75.75V3h6.5V2.5a.75.75 0 011.5 0V3h.25A2.75 2.75 0 0115.75 5.75v7.5A2.75 2.75 0 0113 16H3A2.75 2.75 0 01.25 13.25v-7.5A2.75 2.75 0 013 3h.25V2.5A.75.75 0 014 1.75zM1.75 7.75v5.5c0 .69.56 1.25 1.25 1.25h10c.69 0 1.25-.56 1.25-1.25v-5.5H1.75z" clipRule="evenodd" />
                    </svg>
                    {new Date(session.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                )}
                {session.duration && (
                  <span className="flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                      <path fillRule="evenodd" d="M1 8a7 7 0 1114 0A7 7 0 011 8zm7.75-4.25a.75.75 0 00-1.5 0V8c0 .414.336.75.75.75h3.25a.75.75 0 000-1.5h-2.5v-3.5z" clipRule="evenodd" />
                    </svg>
                    {session.duration} min
                  </span>
                )}
              </div>
            </div>

            {/* Favorite button */}
            <button
              onClick={handleFavoriteToggle}
              className={`p-1.5 rounded-lg transition-all hover:scale-110 ${
                session.favorite
                  ? 'text-yellow-400 hover:text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                  : 'text-gray-300 hover:text-yellow-400 hover:bg-gray-100 dark:text-gray-600 dark:hover:bg-gray-800'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          </div>

          {/* Topic distribution - More visual */}
          {session.games && session.games.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex -space-x-0.5">
                {session.games.slice(0, 8).map((g, idx) => (
                  <span
                    key={idx}
                    className={`w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 ${getTopicColor(g.game?.topic)}`}
                    title={g.game?.name}
                  />
                ))}
              </div>
              {session.games.length > 8 && (
                <span className="text-xs text-gray-400 font-medium">+{session.games.length - 8}</span>
              )}
            </div>
          )}
        </div>

        {/* Expand indicator */}
        <div className="flex-shrink-0 self-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          >
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 space-y-4 animate-fade-in">
          {/* Primary Action - Start Session */}
          <button
            onClick={handleStartSession}
            className="w-full py-3 px-4 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
            Start Session
          </button>

          {/* Games list */}
          {session.games && session.games.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 text-gray-400">
                    <path fillRule="evenodd" d="M2.5 4A1.5 1.5 0 001 5.5V6h14v-.5A1.5 1.5 0 0013.5 4h-11zM15 7H1v4.5A1.5 1.5 0 002.5 13h11a1.5 1.5 0 001.5-1.5V7z" clipRule="evenodd" />
                  </svg>
                  Games ({totalGames})
                </h4>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditMode(!editMode);
                  }}
                  className={`text-xs px-2 py-1 rounded-md transition-colors ${
                    editMode
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                  }`}
                >
                  {editMode ? 'Done' : 'Edit'}
                </button>
              </div>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {session.games.map((g, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-2 p-2.5 rounded-lg transition-all ${
                      g.completed
                        ? 'bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30'
                        : 'bg-gray-50 dark:bg-gray-800/50 border border-transparent'
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
                          className="p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
                          className="p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                            <path fillRule="evenodd" d="M8 12.5a.5.5 0 01-.354-.146l-3.5-3.5a.5.5 0 11.708-.708L8 11.293l3.146-3.147a.5.5 0 11.708.708l-3.5 3.5A.5.5 0 018 12.5z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    )}
                    <span className="text-sm text-gray-500 dark:text-gray-500 w-5">{idx + 1}.</span>
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${getTopicColor(g.game?.topic)}`} />
                    <span className={`flex-1 text-sm truncate ${g.completed ? 'text-green-700 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}`}>
                      {g.game?.name || 'Unknown game'}
                    </span>
                    {editMode ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveGame(g.game?._id || g.game);
                        }}
                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                          <path fillRule="evenodd" d="M4.28 3.22a.75.75 0 00-1.06 1.06L6.94 8l-3.72 3.72a.75.75 0 101.06 1.06L8 9.06l3.72 3.72a.75.75 0 101.06-1.06L9.06 8l3.72-3.72a.75.75 0 00-1.06-1.06L8 6.94 4.28 3.22z" clipRule="evenodd" />
                        </svg>
                      </button>
                    ) : (
                      g.completed && (
                        <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                            <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 01.208 1.04l-5 7.5a.75.75 0 01-1.154.114l-3-3a.75.75 0 011.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 011.04-.207z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )
                    )}
                  </div>
                ))}
              </div>
              {/* Add game button */}
              {editMode && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAddGame(true);
                  }}
                  className="w-full p-2.5 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 text-sm hover:border-primary-400 hover:text-primary-500 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 transition-all flex items-center justify-center gap-1.5"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                    <path d="M8.75 4.75a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" />
                  </svg>
                  Add Game
                </button>
              )}
            </div>
          )}

          {/* Empty state when no games */}
          {(!session.games || session.games.length === 0) && (
            <div className="text-center py-6">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">No games in this session yet</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAddGame(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                  <path d="M8.75 4.75a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" />
                </svg>
                Add Games
              </button>
            </div>
          )}

          {/* Meta info */}
          <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-100 dark:border-gray-800">
            <span>Created {new Date(session.createdAt).toLocaleDateString()}</span>
            {session.lastUsed && (
              <span>Last used: {new Date(session.lastUsed).toLocaleDateString()}</span>
            )}
          </div>

          {/* Secondary Actions - Better organized */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <div className="flex-1 flex flex-wrap gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(session);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                  <path d="M13.488 2.513a1.75 1.75 0 00-2.475 0L6.75 6.774a2.75 2.75 0 00-.596.892l-.848 2.047a.75.75 0 00.98.98l2.047-.848a2.75 2.75 0 00.892-.596l4.261-4.262a1.75 1.75 0 000-2.474z" />
                  <path d="M4.75 3.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h6.5c.69 0 1.25-.56 1.25-1.25V9A.75.75 0 0114 9v2.25A2.75 2.75 0 0111.25 14h-6.5A2.75 2.75 0 012 11.25v-6.5A2.75 2.75 0 014.75 2H7a.75.75 0 010 1.5H4.75z" />
                </svg>
                Rename
              </button>
              <button
                onClick={handleDuplicateSession}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Duplicate Session"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                  <path d="M5.5 3.5A1.5 1.5 0 017 2h2.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 01.439 1.061V9.5A1.5 1.5 0 0112 11h-.5v-1h.5a.5.5 0 00.5-.5V5.621a.5.5 0 00-.146-.353l-2.122-2.122A.5.5 0 0010.38 3H7a.5.5 0 00-.5.5V4h-1v-.5z" />
                  <path d="M3.5 6A1.5 1.5 0 002 7.5v5A1.5 1.5 0 003.5 14h5a1.5 1.5 0 001.5-1.5v-5A1.5 1.5 0 008.5 6h-5z" />
                </svg>
                Duplicate
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onShare(session);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                  <path d="M10.5 4a2.5 2.5 0 11.702 1.737L6.97 8.604a2.518 2.518 0 010 .792l4.233 2.867a2.5 2.5 0 11-.671 1.341l-4.233-2.867a2.5 2.5 0 110-3.475l4.233-2.867A2.52 2.52 0 0110.5 4z" />
                </svg>
                Share
              </button>
              {onSaveAsTemplate && session.games?.length > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSaveAsTemplate(session);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
                  title="Save as Template"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                    <path d="M5 3.5A1.5 1.5 0 016.5 2h3a1.5 1.5 0 011.5 1.5V5h2.5A1.5 1.5 0 0115 6.5v7a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 011 13.5v-7A1.5 1.5 0 012.5 5H5V3.5zm1.5 0V5h3V3.5a.5.5 0 00-.5-.5h-2a.5.5 0 00-.5.5z" />
                  </svg>
                  Template
                </button>
              )}
            </div>
            {/* Delete button - separated for safety */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(session);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="Delete Session"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                <path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 000 1.5h.3l.815 8.15A1.5 1.5 0 005.357 15h5.285a1.5 1.5 0 001.493-1.35l.815-8.15h.3a.75.75 0 000-1.5H11v-.75A2.25 2.25 0 008.75 1h-1.5A2.25 2.25 0 005 3.25zm2.25-.75a.75.75 0 00-.75.75V4h3v-.75a.75.75 0 00-.75-.75h-1.5z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Add Game Modal - rendered via Portal to avoid z-index issues */}
      {showAddGame && createPortal(
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
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${getTopicColor(game.topic)}`} />
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
        </div>,
        document.body
      )}
    </div>
  );
}
