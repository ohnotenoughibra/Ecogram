import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import Timer from '../components/Timer';
import SessionTimer from '../components/SessionTimer';
import DrillTimer from '../components/DrillTimer';
import EffectivenessRating from '../components/EffectivenessRating';
import SessionPrintShare from '../components/SessionPrintShare';
import Loading from '../components/Loading';
import api from '../utils/api';
import {
  connectSocket,
  joinSession,
  leaveSession,
  startTimer,
  pauseTimer,
  resumeTimer,
  stopTimer,
  onTimerState,
  onTimerStopped,
  onUserJoined,
  onUserLeft,
  emitGameCompleted
} from '../utils/socket';

const topicColors = {
  offensive: 'bg-red-500',
  defensive: 'bg-blue-500',
  control: 'bg-purple-500',
  transition: 'bg-green-500'
};

export default function SessionView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast, markGameUsed } = useApp();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentGameIndex, setCurrentGameIndex] = useState(0);
  const [showTimer, setShowTimer] = useState(false);
  const [timerState, setTimerState] = useState(null);
  const [participants, setParticipants] = useState(1);
  const [editingNotes, setEditingNotes] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [showAddGame, setShowAddGame] = useState(false);
  const [availableGames, setAvailableGames] = useState([]);
  const [timerMode, setTimerMode] = useState('drill'); // 'simple' | 'drill'
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [gameToRate, setGameToRate] = useState(null);
  const [showPrintShare, setShowPrintShare] = useState(false);

  useEffect(() => {
    loadSession();
    setupSocket();

    return () => {
      if (id) {
        leaveSession(id);
      }
    };
  }, [id]);

  const loadSession = async () => {
    try {
      const response = await api.get(`/sessions/${id}`);
      setSession(response.data);
    } catch (error) {
      showToast('Failed to load session', 'error');
      navigate('/sessions');
    } finally {
      setLoading(false);
    }
  };

  const setupSocket = () => {
    const socket = connectSocket();

    if (socket && user) {
      joinSession(id, user._id);

      onTimerState((state) => {
        setTimerState(state);
        if (state.currentGameIndex !== undefined) {
          setCurrentGameIndex(state.currentGameIndex);
        }
      });

      onTimerStopped(() => {
        setTimerState(null);
      });

      onUserJoined(({ participants: count }) => {
        setParticipants(count);
        showToast('Someone joined the session', 'info');
      });

      onUserLeft(({ participants: count }) => {
        setParticipants(count);
      });
    }
  };

  const loadAvailableGames = async () => {
    try {
      const response = await api.get('/games?limit=100');
      // Filter out games already in session
      const sessionGameIds = session.games.map(g => g.game._id);
      const available = response.data.games.filter(g => !sessionGameIds.includes(g._id));
      setAvailableGames(available);
      setShowAddGame(true);
    } catch (error) {
      showToast('Failed to load games', 'error');
    }
  };

  const handleRemoveGame = async (gameId) => {
    // Find the game being removed for undo
    const removedGameEntry = session.games.find(g => g.game._id === gameId);
    const removedGameIndex = session.games.findIndex(g => g.game._id === gameId);

    try {
      await api.put(`/sessions/${id}/games`, {
        action: 'remove',
        gameId
      });

      // Update local state
      setSession(prev => ({
        ...prev,
        games: prev.games.filter(g => g.game._id !== gameId)
      }));

      // Adjust current index if needed
      if (currentGameIndex >= session.games.length - 1) {
        setCurrentGameIndex(Math.max(0, session.games.length - 2));
      }

      // Show toast with undo action
      showToast(
        `"${removedGameEntry?.game?.name || 'Game'}" removed`,
        'success',
        5000,
        {
          label: 'Undo',
          onClick: async () => {
            try {
              await api.put(`/sessions/${id}/games`, {
                action: 'add',
                gameId
              });
              // Reload session to get proper order
              await loadSession();
              showToast('Game restored', 'success');
            } catch (err) {
              showToast('Failed to restore game', 'error');
            }
          }
        }
      );
    } catch (error) {
      showToast('Failed to remove game', 'error');
    }
  };

  const handleAddGame = async (gameId) => {
    try {
      await api.put(`/sessions/${id}/games`, {
        action: 'add',
        gameId
      });

      // Reload session to get updated games
      await loadSession();
      setShowAddGame(false);
      showToast('Game added to session', 'success');
    } catch (error) {
      showToast('Failed to add game', 'error');
    }
  };

  const handleMoveGame = async (fromIndex, direction) => {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= session.games.length) return;

    const newGames = [...session.games];
    [newGames[fromIndex], newGames[toIndex]] = [newGames[toIndex], newGames[fromIndex]];
    const gameIds = newGames.map(g => g.game._id);

    try {
      await api.put(`/sessions/${id}/games`, {
        action: 'reorder',
        gameIds
      });

      // Update local state
      setSession(prev => ({
        ...prev,
        games: newGames
      }));

      // Update current index to follow the game
      if (currentGameIndex === fromIndex) {
        setCurrentGameIndex(toIndex);
      } else if (currentGameIndex === toIndex) {
        setCurrentGameIndex(fromIndex);
      }
    } catch (error) {
      showToast('Failed to reorder games', 'error');
    }
  };

  const handleSaveNotes = async (gameId, notes) => {
    try {
      await api.put(`/sessions/${id}/games/${gameId}/notes`, { notes });

      // Update local state
      setSession(prev => ({
        ...prev,
        games: prev.games.map(g =>
          g.game._id === gameId ? { ...g, notes } : g
        )
      }));

      setEditingNotes(false);
      showToast('Notes saved', 'success');
    } catch (error) {
      showToast('Failed to save notes', 'error');
    }
  };

  const handleGameComplete = async (gameId, completed) => {
    try {
      await api.put(`/sessions/${id}/games/${gameId}/complete`);

      // Update local state
      setSession(prev => ({
        ...prev,
        games: prev.games.map(g =>
          g.game._id === gameId ? { ...g, completed } : g
        )
      }));

      // Emit to other participants
      emitGameCompleted(id, gameId, completed);

      if (completed) {
        await markGameUsed(gameId);
        showToast('Game completed!', 'success');

        // Show effectiveness rating modal
        const gameEntry = session.games.find(g => g.game._id === gameId);
        if (gameEntry?.game) {
          setGameToRate(gameEntry.game);
          setShowRatingModal(true);
        }
      }
    } catch (error) {
      showToast('Failed to update game status', 'error');
    }
  };

  const handleTimerStart = (duration) => {
    startTimer(id, duration, currentGameIndex);
    setShowTimer(false);
  };

  const handleTimerPause = () => {
    pauseTimer(id);
  };

  const handleTimerResume = () => {
    resumeTimer(id);
  };

  const handleTimerStop = () => {
    stopTimer(id);
  };

  const nextGame = () => {
    if (currentGameIndex < session.games.length - 1) {
      setCurrentGameIndex(prev => prev + 1);
    }
  };

  const prevGame = () => {
    if (currentGameIndex > 0) {
      setCurrentGameIndex(prev => prev - 1);
    }
  };

  if (loading) {
    return <Loading text="Loading session..." />;
  }

  if (!session) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Session not found</p>
      </div>
    );
  }

  const currentGame = session.games[currentGameIndex]?.game;
  const completedCount = session.games.filter(g => g.completed).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={() => navigate('/sessions')}
            className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-1 flex items-center gap-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
            </svg>
            Back to Sessions
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {session.name}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {completedCount} of {session.games.length} games completed
          </p>
        </div>

        <div className="flex items-center gap-3">
          {participants > 1 && (
            <span className="badge bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              {participants} participants
            </span>
          )}
          <button
            onClick={() => setShowPrintShare(true)}
            className="btn-secondary"
            title="Print or share session"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M13 4.5a2.5 2.5 0 11.702 1.737L6.97 9.604a2.518 2.518 0 010 .792l6.733 3.367a2.5 2.5 0 11-.671 1.341l-6.733-3.367a2.5 2.5 0 110-3.474l6.733-3.367A2.52 2.52 0 0113 4.5z" />
            </svg>
          </button>
          <button
            onClick={() => setEditMode(!editMode)}
            className={`btn-secondary ${editMode ? 'bg-primary-100 dark:bg-primary-900/30' : ''}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-1">
              <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
              <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
            </svg>
            {editMode ? 'Done' : 'Edit'}
          </button>
          <button
            onClick={() => setShowTimer(true)}
            className="btn-primary"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-1">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
            </svg>
            Timer
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-300"
            style={{ width: `${(completedCount / session.games.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Timer Mode Toggle & Timer */}
      <div className="mb-6">
        {/* Timer Mode Toggle */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Session Timer</h3>
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setTimerMode('drill')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                timerMode === 'drill'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Drill Timer
            </button>
            <button
              onClick={() => setTimerMode('simple')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                timerMode === 'simple'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Simple Timer
            </button>
          </div>
        </div>

        {timerMode === 'drill' ? (
          <DrillTimer
            games={session.games}
            currentGameIndex={currentGameIndex}
            onGameComplete={handleGameComplete}
            onNextGame={nextGame}
            onPrevGame={prevGame}
          />
        ) : (
          <SessionTimer
            onTimerEnd={() => {
              showToast('Time is up!', 'info');
            }}
          />
        )}
      </div>

      {/* Current Game Display */}
      {currentGame && (
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Game {currentGameIndex + 1} of {session.games.length}
            </span>
            <span className={`w-3 h-3 rounded-full ${topicColors[currentGame.topic]}`} />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {currentGame.name}
          </h2>

          {/* AI Metadata if available */}
          {currentGame.aiMetadata?.startPosition && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Position
              </h4>
              <p className="text-gray-900 dark:text-white">
                {currentGame.aiMetadata.startPosition}
              </p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            {currentGame.topPlayer && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                  Top Player
                </h4>
                <p className="text-sm text-blue-900 dark:text-blue-100 whitespace-pre-wrap">
                  {currentGame.topPlayer}
                </p>
              </div>
            )}

            {currentGame.bottomPlayer && (
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <h4 className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">
                  Bottom Player
                </h4>
                <p className="text-sm text-purple-900 dark:text-purple-100 whitespace-pre-wrap">
                  {currentGame.bottomPlayer}
                </p>
              </div>
            )}
          </div>

          {currentGame.coaching && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg mb-4">
              <h4 className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">
                Coaching Notes
              </h4>
              <p className="text-sm text-green-900 dark:text-green-100 whitespace-pre-wrap">
                {currentGame.coaching}
              </p>
            </div>
          )}

          {/* Constraints if available */}
          {currentGame.aiMetadata?.constraints && currentGame.aiMetadata.constraints.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Constraints
              </h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                {currentGame.aiMetadata.constraints.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Complete button */}
          <button
            onClick={() => handleGameComplete(currentGame._id, !session.games[currentGameIndex].completed)}
            className={`w-full py-3 rounded-lg font-medium transition-colors ${
              session.games[currentGameIndex].completed
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-green-100 hover:text-green-700'
            }`}
          >
            {session.games[currentGameIndex].completed ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 inline mr-2">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                </svg>
                Completed
              </>
            ) : (
              'Mark as Completed'
            )}
          </button>

          {/* Session Notes */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
                  <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
                </svg>
                Session Notes
              </h4>
              {!editingNotes && (
                <button
                  onClick={() => {
                    setNoteText(session.games[currentGameIndex].notes || '');
                    setEditingNotes(true);
                  }}
                  className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                >
                  {session.games[currentGameIndex].notes ? 'Edit' : 'Add notes'}
                </button>
              )}
            </div>

            {editingNotes ? (
              <div className="space-y-2">
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="What worked well? What to focus on next time? Any observations..."
                  rows={4}
                  className="input resize-none text-sm"
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setEditingNotes(false)}
                    className="btn-secondary text-sm py-1.5"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSaveNotes(currentGame._id, noteText)}
                    className="btn-primary text-sm py-1.5"
                  >
                    Save Notes
                  </button>
                </div>
              </div>
            ) : session.games[currentGameIndex].notes ? (
              <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                {session.games[currentGameIndex].notes}
              </p>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                No notes yet. Add notes to capture what worked and what to improve.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevGame}
          disabled={currentGameIndex === 0}
          className="btn-secondary disabled:opacity-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-1">
            <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
          </svg>
          Previous
        </button>

        {/* Game dots */}
        <div className="flex gap-2">
          {session.games.map((g, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentGameIndex(idx)}
              className={`w-3 h-3 rounded-full transition-all ${
                idx === currentGameIndex
                  ? 'bg-primary-500 scale-125'
                  : g.completed
                  ? 'bg-green-500'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
            />
          ))}
        </div>

        <button
          onClick={nextGame}
          disabled={currentGameIndex === session.games.length - 1}
          className="btn-secondary disabled:opacity-50"
        >
          Next
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 ml-1">
            <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Game list sidebar */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            All Games ({session.games.length})
          </h3>
          {editMode && (
            <button
              onClick={loadAvailableGames}
              className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
              </svg>
              Add Game
            </button>
          )}
        </div>
        <div className="space-y-2">
          {session.games.map((g, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg flex items-center gap-3 transition-colors ${
                idx === currentGameIndex
                  ? 'bg-primary-100 dark:bg-primary-900/30'
                  : 'bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {editMode && (
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => handleMoveGame(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                      <path fillRule="evenodd" d="M11.78 9.78a.75.75 0 01-1.06 0L8 7.06 5.28 9.78a.75.75 0 01-1.06-1.06l3.25-3.25a.75.75 0 011.06 0l3.25 3.25a.75.75 0 010 1.06z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleMoveGame(idx, 'down')}
                    disabled={idx === session.games.length - 1}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                      <path fillRule="evenodd" d="M4.22 6.22a.75.75 0 011.06 0L8 8.94l2.72-2.72a.75.75 0 111.06 1.06l-3.25 3.25a.75.75 0 01-1.06 0L4.22 7.28a.75.75 0 010-1.06z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              )}

              <button
                onClick={() => setCurrentGameIndex(idx)}
                className="flex-1 flex items-center gap-3 text-left"
              >
                <span className={`w-2 h-2 rounded-full ${topicColors[g.game?.topic] || 'bg-gray-400'}`} />
                <span className={`flex-1 ${g.completed ? 'line-through text-gray-400' : ''}`}>
                  {g.game?.name || 'Unknown game'}
                </span>
                {g.completed && (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 text-green-500">
                    <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 01.208 1.04l-5 7.5a.75.75 0 01-1.154.114l-3-3a.75.75 0 011.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 011.04-.207z" clipRule="evenodd" />
                  </svg>
                )}
                {g.notes && (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 text-yellow-500">
                    <path d="M3 4.75a1 1 0 011-1h8a1 1 0 011 1v6.5a1 1 0 01-1 1h-8a1 1 0 01-1-1v-6.5z" />
                  </svg>
                )}
              </button>

              {editMode && (
                <button
                  onClick={() => handleRemoveGame(g.game._id)}
                  className="p-1 text-red-400 hover:text-red-600"
                  title="Remove from session"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 000 1.5h.3l.815 8.15A1.5 1.5 0 005.357 15h5.286a1.5 1.5 0 001.492-1.35l.815-8.15h.3a.75.75 0 000-1.5H11v-.75A2.25 2.25 0 008.75 1h-1.5A2.25 2.25 0 005 3.25zm2.25-.75a.75.75 0 00-.75.75V4h3v-.75a.75.75 0 00-.75-.75h-1.5zM6.05 6a.75.75 0 01.787.713l.275 5.5a.75.75 0 01-1.498.075l-.275-5.5A.75.75 0 016.05 6zm3.9 0a.75.75 0 01.712.787l-.275 5.5a.75.75 0 01-1.498-.075l.275-5.5a.75.75 0 01.786-.711z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add Game Modal */}
      {showAddGame && (
        <div className="modal-overlay" onClick={() => setShowAddGame(false)}>
          <div className="modal-content max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Add Game to Session
              </h3>
              <button onClick={() => setShowAddGame(false)} className="btn-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              {availableGames.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No more games to add. All games are already in this session.
                </p>
              ) : (
                <div className="space-y-2">
                  {availableGames.map(game => (
                    <button
                      key={game._id}
                      onClick={() => handleAddGame(game._id)}
                      className="w-full text-left p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-3"
                    >
                      <span className={`w-2 h-2 rounded-full ${topicColors[game.topic]}`} />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">{game.name}</p>
                        {game.skills?.length > 0 && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {game.skills.slice(0, 3).map(s => `#${s}`).join(' ')}
                          </p>
                        )}
                      </div>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-gray-400">
                        <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                      </svg>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Effectiveness Rating Modal */}
      <EffectivenessRating
        isOpen={showRatingModal}
        onClose={() => {
          setShowRatingModal(false);
          setGameToRate(null);
        }}
        game={gameToRate}
        sessionId={id}
        onRated={(rating) => {
          if (rating) {
            showToast('Rating saved!', 'success');
          }
        }}
      />

      {/* Print/Share Modal */}
      <SessionPrintShare
        isOpen={showPrintShare}
        onClose={() => setShowPrintShare(false)}
        session={session}
      />

      {/* Timer Modal */}
      <Timer
        isOpen={showTimer}
        onClose={() => setShowTimer(false)}
        syncState={timerState}
        onSyncStart={handleTimerStart}
        onSyncPause={handleTimerPause}
        onSyncResume={handleTimerResume}
        onSyncStop={handleTimerStop}
      />
    </div>
  );
}
