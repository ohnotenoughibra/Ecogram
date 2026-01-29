import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useApp } from '../context/AppContext';

// Icons for session actions
const sessionIcons = {
  addToSession: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
    </svg>
  ),
  createSession: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path d="M3.75 3A1.75 1.75 0 002 4.75v3.26a3.235 3.235 0 011.75-.51h12.5c.644 0 1.245.188 1.75.51V6.75A1.75 1.75 0 0016.25 5h-4.836a.25.25 0 01-.177-.073L9.823 3.513A1.75 1.75 0 008.586 3H3.75zM3.75 9A1.75 1.75 0 002 10.75v4.5c0 .966.784 1.75 1.75 1.75h12.5A1.75 1.75 0 0018 15.25v-4.5A1.75 1.75 0 0016.25 9H3.75z" />
    </svg>
  )
};

const iconMap = {
  fire: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M13.5 4.938a7 7 0 11-9.006 1.737c.202-.257.59-.218.793.039.278.352.594.672.943.954.332.269.786-.049.773-.476a5.977 5.977 0 01.572-2.759 6.026 6.026 0 012.486-2.665c.247-.14.55-.016.677.238A6.967 6.967 0 0013.5 4.938zM14 12a4 4 0 01-8 0 4 4 0 018 0zm-4-2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 10z" clipRule="evenodd" />
    </svg>
  ),
  target: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M10 1a.75.75 0 01.75.75v1.5a6.5 6.5 0 016 6h1.5a.75.75 0 010 1.5h-1.5a6.5 6.5 0 01-6 6v1.5a.75.75 0 01-1.5 0v-1.5a6.5 6.5 0 01-6-6H1.75a.75.75 0 010-1.5h1.5a6.5 6.5 0 016-6v-1.5A.75.75 0 0110 1zm-4 9a4 4 0 118 0 4 4 0 01-8 0zm4-2a2 2 0 100 4 2 2 0 000-4z" clipRule="evenodd" />
    </svg>
  ),
  sparkles: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path d="M10 1a.75.75 0 01.65.38l1.95 3.4 3.75.9a.75.75 0 01.4 1.23l-2.6 2.87.45 3.85a.75.75 0 01-1.07.8L10 12.62l-3.53 1.81a.75.75 0 01-1.07-.8l.45-3.85-2.6-2.87a.75.75 0 01.4-1.23l3.75-.9 1.95-3.4A.75.75 0 0110 1z" />
    </svg>
  ),
  star: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
    </svg>
  ),
  heart: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 01-1.162-.682 22.045 22.045 0 01-2.582-1.9C4.045 12.733 2 10.352 2 7.5a4.5 4.5 0 018-2.828A4.5 4.5 0 0118 7.5c0 2.852-2.044 5.233-3.885 6.82a22.049 22.049 0 01-3.744 2.582l-.019.01-.005.003h-.002a.739.739 0 01-.69.001l-.002-.001z" />
    </svg>
  ),
  lightbulb: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path d="M10 1a6 6 0 00-3.815 10.631C7.237 12.5 8 13.443 8 14.456v.644a.75.75 0 00.572.729 6.016 6.016 0 002.856 0A.75.75 0 0012 15.1v-.644c0-1.013.762-1.957 1.815-2.825A6 6 0 0010 1zM8.863 17.414a.75.75 0 00-.226 1.483 9.066 9.066 0 002.726 0 .75.75 0 00-.226-1.483 7.553 7.553 0 01-2.274 0z" />
    </svg>
  ),
  trophy: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M10 1c-1.828 0-3.623.149-5.371.435a.75.75 0 00-.629.74v.387c-.827.157-1.642.345-2.445.564a.75.75 0 00-.552.698 5 5 0 004.503 5.152 6 6 0 002.946 1.822A6.451 6.451 0 017.768 13H7.5A1.5 1.5 0 006 14.5V17h-.75C4.56 17 4 17.56 4 18.25c0 .414.336.75.75.75h10.5a.75.75 0 00.75-.75c0-.69-.56-1.25-1.25-1.25H14v-2.5a1.5 1.5 0 00-1.5-1.5h-.268a6.453 6.453 0 01-.684-2.202 6 6 0 002.946-1.822 5 5 0 004.503-5.152.75.75 0 00-.552-.698A31.804 31.804 0 0016 2.562v-.387a.75.75 0 00-.629-.74A33.227 33.227 0 0010 1zM2.525 4.422C3.012 4.3 3.504 4.19 4 4.09V5c0 .74.134 1.448.38 2.103a3.503 3.503 0 01-1.855-2.68zm14.95 0a3.503 3.503 0 01-1.854 2.68C15.866 6.449 16 5.74 16 5v-.91c.496.099.988.21 1.475.332z" clipRule="evenodd" />
    </svg>
  ),
  clipboard: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M15.988 3.012A2.25 2.25 0 0118 5.25v6.5A2.25 2.25 0 0115.75 14H13.5V7A2.5 2.5 0 0011 4.5H8.128a2.252 2.252 0 011.884-1.488A2.25 2.25 0 0112.25 1h1.5a2.25 2.25 0 012.238 2.012zM11.5 3.25a.75.75 0 01.75-.75h1.5a.75.75 0 01.75.75v.25h-3v-.25z" clipRule="evenodd" />
      <path fillRule="evenodd" d="M2 7a1 1 0 011-1h8a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V7zm2 3.25a.75.75 0 01.75-.75h4.5a.75.75 0 010 1.5h-4.5a.75.75 0 01-.75-.75zm0 3.5a.75.75 0 01.75-.75h4.5a.75.75 0 010 1.5h-4.5a.75.75 0 01-.75-.75z" clipRule="evenodd" />
    </svg>
  ),
  rocket: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M4.606 12.97a.75.75 0 01-.134 1.051 2.494 2.494 0 00-.93 2.437 2.494 2.494 0 002.437-.93.75.75 0 111.186.918 3.995 3.995 0 01-4.482 1.332.75.75 0 01-.461-.461 3.994 3.994 0 011.332-4.482.75.75 0 011.052.134z" clipRule="evenodd" />
      <path fillRule="evenodd" d="M15.232 1.768a3.75 3.75 0 00-5.304 0l-5.08 5.08a6.623 6.623 0 00-1.912 5.58l.03.173a.75.75 0 00.902.68l.174-.029a6.623 6.623 0 005.58-1.912l5.08-5.08a3.75 3.75 0 000-5.304zM12.404 4.11a2.25 2.25 0 113.182 3.182l-.707.707-3.182-3.182.707-.707z" clipRule="evenodd" />
    </svg>
  )
};

const topicColors = {
  offensive: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', icon: 'text-red-500' },
  defensive: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', icon: 'text-blue-500' },
  control: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400', icon: 'text-purple-500' },
  transition: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', icon: 'text-green-500' }
};

const priorityStyles = {
  high: {
    card: 'bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800',
    icon: 'text-orange-500',
    badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400'
  },
  medium: {
    card: 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800',
    icon: 'text-blue-500',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400'
  },
  low: {
    card: 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700',
    icon: 'text-gray-500',
    badge: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
  }
};

export default function TrainingRecommendations({ onFilterChange, compact = false }) {
  const navigate = useNavigate();
  const { showToast, setFilters, markGameUsed, sessions, fetchSessions, createSession } = useApp();
  const [recommendations, setRecommendations] = useState([]);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(() => {
    const saved = localStorage.getItem('dismissedRecommendations');
    return saved ? JSON.parse(saved) : [];
  });
  const [expanded, setExpanded] = useState(!compact);

  // Session picker state
  const [showSessionPicker, setShowSessionPicker] = useState(false);
  const [selectedGameForSession, setSelectedGameForSession] = useState(null);
  const [addingToSession, setAddingToSession] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const [showNewSessionInput, setShowNewSessionInput] = useState(false);

  const fetchRecommendations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/games/recommendations');
      setRecommendations(response.data.recommendations);
      setInsights(response.data.insights);
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecommendations();
    // Refresh recommendations every 5 minutes
    const interval = setInterval(fetchRecommendations, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchRecommendations]);

  // Clear old dismissed items (older than 24 hours)
  useEffect(() => {
    const now = Date.now();
    const validDismissed = dismissed.filter(d => now - d.timestamp < 24 * 60 * 60 * 1000);
    if (validDismissed.length !== dismissed.length) {
      setDismissed(validDismissed);
      localStorage.setItem('dismissedRecommendations', JSON.stringify(validDismissed));
    }
  }, [dismissed]);

  const handleDismiss = (index) => {
    const rec = recommendations[index];
    const newDismissed = [...dismissed, { type: rec.type, timestamp: Date.now() }];
    setDismissed(newDismissed);
    localStorage.setItem('dismissedRecommendations', JSON.stringify(newDismissed));
  };

  // Open session picker for a game
  const handleOpenSessionPicker = (game, rec) => {
    setSelectedGameForSession({ game, rec });
    setShowSessionPicker(true);
    setShowNewSessionInput(false);
    setNewSessionName('');
    // Fetch latest sessions
    if (fetchSessions) {
      fetchSessions();
    }
  };

  // Add game to existing session
  const handleAddToExistingSession = async (sessionId) => {
    if (!selectedGameForSession?.game?._id) return;

    setAddingToSession(true);
    try {
      await api.put(`/sessions/${sessionId}/games`, {
        action: 'add',
        gameId: selectedGameForSession.game._id
      });
      showToast('Game added to session!', 'success');
      setShowSessionPicker(false);
      setSelectedGameForSession(null);
      fetchRecommendations();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to add game', 'error');
    } finally {
      setAddingToSession(false);
    }
  };

  // Create new session with the game
  const handleCreateNewSessionWithGame = async () => {
    if (!selectedGameForSession?.game?._id || !newSessionName.trim()) return;

    setAddingToSession(true);
    try {
      const sessionData = {
        name: newSessionName.trim(),
        gameIds: [selectedGameForSession.game._id]
      };
      await createSession(sessionData);
      showToast('Session created with game!', 'success');
      setShowSessionPicker(false);
      setSelectedGameForSession(null);
      setNewSessionName('');
      fetchRecommendations();
    } catch (err) {
      showToast('Failed to create session', 'error');
    } finally {
      setAddingToSession(false);
    }
  };

  const handleAction = async (rec) => {
    const { action } = rec;
    if (!action) return;

    switch (action.type) {
      case 'create_game':
        navigate('/?new=true');
        break;
      case 'quick_session':
        navigate('/sessions');
        break;
      case 'filter_topic':
        if (onFilterChange) {
          onFilterChange({ topic: action.topic });
        } else {
          setFilters(prev => ({ ...prev, topic: action.topic }));
        }
        showToast(`Filtering by ${action.topic}`, 'info');
        break;
      case 'ai_generate':
        navigate(`/ai?topic=${action.topic}`);
        break;
      case 'use_game':
        if (action.gameId) {
          await markGameUsed(action.gameId);
          showToast('Game marked as used!', 'success');
          fetchRecommendations();
        }
        break;
      case 'create_session':
        navigate('/sessions');
        break;
      default:
        break;
    }
  };

  const visibleRecommendations = recommendations.filter(rec => {
    return !dismissed.some(d => d.type === rec.type);
  });

  if (loading) {
    return (
      <div className="card p-4 mb-6 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div className="flex-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (visibleRecommendations.length === 0) {
    return null;
  }

  // Compact mode shows just a summary
  if (compact && !expanded) {
    const highPriority = visibleRecommendations.filter(r => r.priority === 'high');
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full card p-3 mb-4 flex items-center justify-between hover:shadow-md transition-shadow"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            highPriority.length > 0 ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-blue-100 dark:bg-blue-900/30'
          }`}>
            <span className={highPriority.length > 0 ? 'text-orange-500' : 'text-blue-500'}>
              {iconMap.lightbulb}
            </span>
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {visibleRecommendations.length} Training {visibleRecommendations.length === 1 ? 'Tip' : 'Tips'}
            </p>
            <p className="text-xs text-gray-500">
              {highPriority.length > 0 ? `${highPriority.length} high priority` : 'Tap to see suggestions'}
            </p>
          </div>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-gray-400">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>
    );
  }

  return (
    <div className="mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white">
            {iconMap.lightbulb}
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              Smart Training Tips
            </h2>
            {insights && (
              <p className="text-xs text-gray-500">
                {insights.trainingStreak > 0 && (
                  <span className="text-orange-500 font-medium">{insights.trainingStreak} day streak</span>
                )}
                {insights.trainingStreak > 0 && insights.gamesUsedThisWeek > 0 && ' · '}
                {insights.gamesUsedThisWeek > 0 && (
                  <span>{insights.gamesUsedThisWeek} games this week</span>
                )}
              </p>
            )}
          </div>
        </div>
        {compact && (
          <button
            onClick={() => setExpanded(false)}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M14.77 12.79a.75.75 0 01-1.06-.02L10 8.832 6.29 12.77a.75.75 0 11-1.08-1.04l4.25-4.5a.75.75 0 011.08 0l4.25 4.5a.75.75 0 01-.02 1.06z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>

      {/* Recommendations */}
      <div className="space-y-2">
        {visibleRecommendations.slice(0, compact ? 2 : 4).map((rec, index) => {
          const styles = priorityStyles[rec.priority] || priorityStyles.low;
          const topicStyle = rec.topic ? topicColors[rec.topic] : null;

          return (
            <div
              key={`${rec.type}-${index}`}
              className={`relative card p-3 border transition-all hover:shadow-md ${styles.card}`}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  topicStyle ? topicStyle.bg : 'bg-white dark:bg-gray-900'
                }`}>
                  <span className={topicStyle ? topicStyle.icon : styles.icon}>
                    {iconMap[rec.icon] || iconMap.lightbulb}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {rec.title}
                    </h3>
                    {rec.priority === 'high' && (
                      <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${styles.badge}`}>
                        Important
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                    {rec.message}
                  </p>

                  {/* Action Buttons */}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {rec.action && (
                      <button
                        onClick={() => handleAction(rec)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                      >
                        {rec.action.label}
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                          <path fillRule="evenodd" d="M2 8a.75.75 0 01.75-.75h8.69L8.22 4.03a.75.75 0 011.06-1.06l4.5 4.5a.75.75 0 010 1.06l-4.5 4.5a.75.75 0 01-1.06-1.06l3.22-3.22H2.75A.75.75 0 012 8z" clipRule="evenodd" />
                        </svg>
                      </button>
                    )}
                    {/* Session actions for game-specific recommendations */}
                    {rec.game && (
                      <button
                        onClick={() => handleOpenSessionPicker(rec.game, rec)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 border-l border-gray-200 dark:border-gray-600 pl-2"
                      >
                        {sessionIcons.addToSession}
                        Add to Session
                      </button>
                    )}
                    {/* For topic-based recommendations, offer to create a focused session */}
                    {rec.type === 'neglected_topic' && rec.topic && (
                      <button
                        onClick={() => navigate(`/sessions?focus=${rec.topic}`)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 border-l border-gray-200 dark:border-gray-600 pl-2"
                      >
                        {sessionIcons.createSession}
                        Create {rec.topic} Session
                      </button>
                    )}
                  </div>
                </div>

                {/* Dismiss Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDismiss(index);
                  }}
                  className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Dismiss"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                    <path d="M5.28 4.22a.75.75 0 00-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 101.06 1.06L8 9.06l2.72 2.72a.75.75 0 101.06-1.06L9.06 8l2.72-2.72a.75.75 0 00-1.06-1.06L8 6.94 5.28 4.22z" />
                  </svg>
                </button>
              </div>

              {/* Streak indicator for training reminders */}
              {rec.type === 'streak_celebration' && rec.streak >= 7 && (
                <div className="mt-2 flex items-center gap-1">
                  {[...Array(Math.min(rec.streak, 7))].map((_, i) => (
                    <div
                      key={i}
                      className="w-4 h-4 rounded-full bg-orange-400 flex items-center justify-center text-white text-[8px]"
                    >
                      {i + 1}
                    </div>
                  ))}
                  {rec.streak > 7 && (
                    <span className="text-xs text-orange-500 ml-1">+{rec.streak - 7}</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* View More */}
      {visibleRecommendations.length > (compact ? 2 : 4) && (
        <button
          onClick={() => navigate('/stats?tab=insights')}
          className="w-full mt-2 p-2 text-xs text-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          View all {visibleRecommendations.length} recommendations
        </button>
      )}

      {/* Quick Stats */}
      {!compact && insights && insights.totalGames > 0 && (
        <div className="mt-4 grid grid-cols-4 gap-2">
          <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-lg font-bold text-gray-900 dark:text-white">{insights.totalGames}</p>
            <p className="text-[10px] text-gray-500">Total</p>
          </div>
          <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-lg font-bold text-green-500">{insights.gamesUsedThisWeek}</p>
            <p className="text-[10px] text-gray-500">This Week</p>
          </div>
          <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-lg font-bold text-orange-500">{insights.trainingStreak}</p>
            <p className="text-[10px] text-gray-500">Streak</p>
          </div>
          <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-lg font-bold text-blue-500">{insights.neverUsedCount}</p>
            <p className="text-[10px] text-gray-500">Unused</p>
          </div>
        </div>
      )}

      {/* Session Picker Modal */}
      {showSessionPicker && selectedGameForSession && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowSessionPicker(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-sm w-full max-h-[80vh] overflow-hidden shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">Add to Session</h3>
              <p className="text-sm text-gray-500 mt-1">
                Add "{selectedGameForSession.game.name}" to a session
              </p>
            </div>

            <div className="p-4 max-h-[50vh] overflow-y-auto">
              {/* Existing Sessions */}
              {sessions && sessions.length > 0 ? (
                <div className="space-y-2 mb-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Existing Sessions</p>
                  {sessions.filter(s => !s.isTemplate).slice(0, 5).map(session => (
                    <button
                      key={session._id}
                      onClick={() => handleAddToExistingSession(session._id)}
                      disabled={addingToSession}
                      className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors disabled:opacity-50"
                    >
                      <p className="font-medium text-gray-900 dark:text-white text-sm">{session.name}</p>
                      <p className="text-xs text-gray-500">
                        {session.games?.length || 0} games
                        {session.scheduledDate && ` • ${new Date(session.scheduledDate).toLocaleDateString()}`}
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No sessions yet</p>
              )}

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">or</span>
                </div>
              </div>

              {/* Create New Session */}
              {showNewSessionInput ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newSessionName}
                    onChange={e => setNewSessionName(e.target.value)}
                    placeholder="Session name..."
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowNewSessionInput(false)}
                      className="flex-1 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateNewSessionWithGame}
                      disabled={!newSessionName.trim() || addingToSession}
                      className="flex-1 px-3 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
                    >
                      {addingToSession ? 'Creating...' : 'Create'}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowNewSessionInput(true)}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors text-gray-600 dark:text-gray-400 hover:text-primary-600"
                >
                  {sessionIcons.addToSession}
                  <span className="text-sm font-medium">Create New Session</span>
                </button>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <button
                onClick={() => setShowSessionPicker(false)}
                className="w-full px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
