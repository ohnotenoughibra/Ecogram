import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import Timer from '../components/Timer';
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
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          All Games
        </h3>
        <div className="space-y-2">
          {session.games.map((g, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentGameIndex(idx)}
              className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${
                idx === currentGameIndex
                  ? 'bg-primary-100 dark:bg-primary-900/30'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
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
            </button>
          ))}
        </div>
      </div>

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
