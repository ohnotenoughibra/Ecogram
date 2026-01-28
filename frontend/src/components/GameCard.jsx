import { useState, useCallback, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import api from '../utils/api';

const topicLabels = {
  offensive: 'Offensive / Submissions',
  defensive: 'Defensive / Escapes',
  control: 'Control / Passing',
  transition: 'Transition / Scrambles'
};

const topicColors = {
  offensive: 'badge-offensive',
  defensive: 'badge-defensive',
  control: 'badge-control',
  transition: 'badge-transition'
};

export default function GameCard({ game, onEdit, onDelete, selectable = true }) {
  const { selectedGames, toggleGameSelection, updateGame, markGameUsed, duplicateGame, showToast } = useApp();
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showSessionMenu, setShowSessionMenu] = useState(false);
  const [recentSessions, setRecentSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const sessionMenuRef = useRef(null);

  // Optimistic UI state
  const [optimisticFavorite, setOptimisticFavorite] = useState(null);
  const [isMarkingUsed, setIsMarkingUsed] = useState(false);

  // Use optimistic value if set, otherwise use actual value
  const isFavorite = optimisticFavorite !== null ? optimisticFavorite : game.favorite;

  // Swipe gesture state
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const cardRef = useRef(null);

  const isSelected = selectedGames.has(game._id);

  // Calculate freshness indicator
  const getFreshnessIndicator = () => {
    if (!game.lastUsed) {
      return { label: 'New', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: 'sparkle' };
    }
    const daysSinceUsed = Math.floor((Date.now() - new Date(game.lastUsed).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceUsed <= 7) {
      return { label: 'Recent', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: 'check' };
    }
    if (daysSinceUsed <= 30) {
      return { label: `${daysSinceUsed}d ago`, color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', icon: null };
    }
    return { label: 'Stale', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: 'clock' };
  };
  const freshness = getFreshnessIndicator();

  // Swipe handlers
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setIsSwiping(false);
  };

  const handleTouchMove = (e) => {
    const deltaX = e.touches[0].clientX - touchStartX.current;
    const deltaY = e.touches[0].clientY - touchStartY.current;

    // Only swipe if horizontal movement is greater than vertical
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      setIsSwiping(true);
      // Limit swipe distance
      const clampedOffset = Math.max(-80, Math.min(80, deltaX));
      setSwipeOffset(clampedOffset);
    }
  };

  const handleTouchEnd = async () => {
    if (Math.abs(swipeOffset) > 50) {
      // Swipe right to favorite, left to unfavorite
      const shouldFavorite = swipeOffset > 0;
      if (shouldFavorite !== isFavorite) {
        // Optimistically update
        setOptimisticFavorite(shouldFavorite);
        showToast(shouldFavorite ? 'Added to favorites' : 'Removed from favorites', 'success');

        try {
          const result = await updateGame(game._id, { favorite: shouldFavorite });
          if (!result.success) {
            setOptimisticFavorite(null);
          } else {
            setOptimisticFavorite(null);
          }
        } catch {
          setOptimisticFavorite(null);
        }
      }
    }
    setSwipeOffset(0);
    setIsSwiping(false);
  };

  const copyToClipboard = useCallback((e) => {
    e.stopPropagation();
    const text = `${game.name}
Topic: ${topicLabels[game.topic]}
${game.skills?.length ? `Skills: ${game.skills.map(s => '#' + s).join(' ')}` : ''}
${game.topPlayer ? `\nTop Player:\n${game.topPlayer}` : ''}
${game.bottomPlayer ? `\nBottom Player:\n${game.bottomPlayer}` : ''}
${game.coaching ? `\nCoaching Notes:\n${game.coaching}` : ''}
${game.personalNotes ? `\nPersonal Notes:\n${game.personalNotes}` : ''}`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      showToast('Copied to clipboard', 'success');
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      showToast('Failed to copy', 'error');
    });
  }, [game, showToast]);

  const handleFavoriteToggle = async (e) => {
    e.stopPropagation();
    const newValue = !isFavorite;

    // Optimistically update UI
    setOptimisticFavorite(newValue);

    try {
      const result = await updateGame(game._id, { favorite: newValue });
      if (!result.success) {
        // Revert on failure
        setOptimisticFavorite(null);
      } else {
        // Clear optimistic state once server confirms
        setOptimisticFavorite(null);
      }
    } catch {
      // Revert on error
      setOptimisticFavorite(null);
    }
  };

  const handleRatingChange = async (rating) => {
    await updateGame(game._id, { rating });
  };

  const handleMarkUsed = async (e) => {
    e.stopPropagation();
    setIsMarkingUsed(true);
    await markGameUsed(game._id);
    setIsMarkingUsed(false);
    showToast('Game marked as used', 'success');
  };

  const handleDuplicate = async (e) => {
    e.stopPropagation();
    await duplicateGame(game);
  };

  // Load recent sessions when menu opens
  const handleOpenSessionMenu = async (e) => {
    e.stopPropagation();
    setShowSessionMenu(true);
    if (recentSessions.length === 0) {
      setLoadingSessions(true);
      try {
        const response = await api.get('/sessions', { params: { limit: 5 } });
        setRecentSessions(response.data.sessions || []);
      } catch (err) {
        showToast('Failed to load sessions', 'error');
      } finally {
        setLoadingSessions(false);
      }
    }
  };

  const handleAddToSession = async (e, sessionId) => {
    e.stopPropagation();
    try {
      await api.put(`/sessions/${sessionId}/games`, { action: 'add', gameId: game._id });
      showToast('Game added to session', 'success');
      setShowSessionMenu(false);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to add game', 'error');
    }
  };

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sessionMenuRef.current && !sessionMenuRef.current.contains(e.target)) {
        setShowSessionMenu(false);
      }
    };
    if (showSessionMenu) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showSessionMenu]);

  const StarRating = ({ rating, onChange }) => (
    <div className="flex gap-0.5" onClick={(e) => e.stopPropagation()}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onChange(star === rating ? 0 : star);
          }}
          className={`star ${star <= rating ? 'star-filled' : 'star-empty'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="pointer-events-none">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );

  return (
    <div
      ref={cardRef}
      className={`card card-hover p-4 cursor-pointer relative group overflow-hidden ${isSelected ? 'ring-2 ring-primary-500' : ''}`}
      onClick={() => !isSwiping && setIsExpanded(!isExpanded)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: `translateX(${swipeOffset}px)`,
        transition: isSwiping ? 'none' : 'transform 0.2s ease-out'
      }}
    >
      {/* Swipe action indicators */}
      {swipeOffset !== 0 && (
        <>
          {/* Favorite indicator (right swipe) */}
          <div
            className={`absolute left-0 top-0 bottom-0 w-20 flex items-center justify-center transition-opacity ${
              swipeOffset > 30 ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ transform: 'translateX(-100%)' }}
          >
            <div className="bg-yellow-400 rounded-full p-3">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 text-white">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
          </div>
          {/* Unfavorite indicator (left swipe) */}
          <div
            className={`absolute right-0 top-0 bottom-0 w-20 flex items-center justify-center transition-opacity ${
              swipeOffset < -30 ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ transform: 'translateX(100%)' }}
          >
            <div className="bg-gray-400 rounded-full p-3">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 text-white">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
          </div>
        </>
      )}
      {/* Quick Actions - visible on hover when collapsed */}
      {!isExpanded && (
        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-surface-dark rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(game);
            }}
            className="p-1.5 text-gray-500 hover:text-primary-500 rounded transition-colors"
            title="Edit"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
              <path d="M13.488 2.513a1.75 1.75 0 00-2.475 0L6.75 6.774a2.75 2.75 0 00-.596.892l-.848 2.047a.75.75 0 00.98.98l2.047-.848a2.75 2.75 0 00.892-.596l4.261-4.262a1.75 1.75 0 000-2.474z" />
              <path d="M4.75 3.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h6.5c.69 0 1.25-.56 1.25-1.25V9A.75.75 0 0114 9v2.25A2.75 2.75 0 0111.25 14h-6.5A2.75 2.75 0 012 11.25v-6.5A2.75 2.75 0 014.75 2H7a.75.75 0 010 1.5H4.75z" />
            </svg>
          </button>
          <button
            onClick={handleDuplicate}
            className="p-1.5 text-gray-500 hover:text-primary-500 rounded transition-colors"
            title="Duplicate"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
              <path d="M5.5 3.5A1.5 1.5 0 017 2h2.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 01.439 1.061V9.5A1.5 1.5 0 0112 11h-.5v-2.5A2.5 2.5 0 009 6H5.5v-2.5z" />
              <path d="M4 6a1.5 1.5 0 00-1.5 1.5v5A1.5 1.5 0 004 14h5a1.5 1.5 0 001.5-1.5V11H9a2.5 2.5 0 01-2.5-2.5V6H4z" />
              <path d="M7 8.25a.75.75 0 01.75-.75h2.5a.75.75 0 010 1.5h-2.5A.75.75 0 017 8.25z" />
            </svg>
          </button>
          <button
            onClick={copyToClipboard}
            className="p-1.5 text-gray-500 hover:text-primary-500 rounded transition-colors"
            title="Copy to clipboard"
          >
            {copied ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 text-green-500">
                <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 01.208 1.04l-5 7.5a.75.75 0 01-1.154.114l-3-3a.75.75 0 011.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 011.04-.207z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M10.986 3H12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h1.014A2.25 2.25 0 017.25 1h1.5a2.25 2.25 0 012.236 2zM9.5 4v-.75a.75.75 0 00-.75-.75h-1.5a.75.75 0 00-.75.75V4h3z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
      )}

      <div className="flex items-start gap-3">
        {selectable && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              toggleGameSelection(game._id);
            }}
            className="checkbox mt-1"
          />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                  {game.name}
                </h3>
                {game.videoUrl && (
                  <span className="text-red-500" title="Has video reference">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                      <path d="M3 4.75A2.75 2.75 0 015.75 2h4.5A2.75 2.75 0 0113 4.75v.5h.25a.75.75 0 01.64 1.14l-2.5 4.06a.75.75 0 01-.64.36H5.25a.75.75 0 01-.64-.36l-2.5-4.06A.75.75 0 012.75 5.25H3v-.5z" />
                      <path d="M3 8.354V11.25A2.75 2.75 0 005.75 14h4.5A2.75 2.75 0 0013 11.25V8.354l-1.572 2.555A2.25 2.25 0 019.51 12h-3.02a2.25 2.25 0 01-1.918-1.091L3 8.354z" />
                    </svg>
                  </span>
                )}
                {game.averageEffectiveness > 0 && (
                  <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-0.5" title="Effectiveness rating">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                      <path fillRule="evenodd" d="M8 1.75a.75.75 0 01.692.462l1.41 3.393 3.664.293a.75.75 0 01.428 1.317l-2.791 2.39.853 3.575a.75.75 0 01-1.12.814L8 12.093l-3.136 1.9a.75.75 0 01-1.12-.814l.852-3.574-2.79-2.39a.75.75 0 01.427-1.318l3.663-.293 1.41-3.393A.75.75 0 018 1.75z" clipRule="evenodd" />
                    </svg>
                    {game.averageEffectiveness.toFixed(1)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <span className={`badge ${topicColors[game.topic]}`}>
                  {topicLabels[game.topic]}
                </span>
                {/* Freshness indicator */}
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${freshness.color}`}>
                  {freshness.icon === 'sparkle' && (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                      <path d="M7.628 1.099a.75.75 0 01.744 0l1.97 1.127 2.229.224a.75.75 0 01.603.603l.224 2.229 1.127 1.97a.75.75 0 010 .744l-1.127 1.97-.224 2.229a.75.75 0 01-.603.603l-2.229.224-1.97 1.127a.75.75 0 01-.744 0l-1.97-1.127-2.229-.224a.75.75 0 01-.603-.603l-.224-2.229L1.475 8.87a.75.75 0 010-.744l1.127-1.97.224-2.229a.75.75 0 01.603-.603l2.229-.224L7.628 1.1z" />
                    </svg>
                  )}
                  {freshness.icon === 'check' && (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                      <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 01.208 1.04l-5 7.5a.75.75 0 01-1.154.114l-3-3a.75.75 0 011.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 011.04-.207z" clipRule="evenodd" />
                    </svg>
                  )}
                  {freshness.icon === 'clock' && (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                      <path fillRule="evenodd" d="M1 8a7 7 0 1114 0A7 7 0 011 8zm7.75-4.25a.75.75 0 00-1.5 0V8c0 .414.336.75.75.75h3.25a.75.75 0 000-1.5h-2.5v-3.5z" clipRule="evenodd" />
                    </svg>
                  )}
                  {freshness.label}
                </span>
              </div>
            </div>

            <button
              onClick={handleFavoriteToggle}
              className={`p-1 rounded-full transition-colors ${
                isFavorite
                  ? 'text-yellow-400 hover:text-yellow-500'
                  : 'text-gray-300 hover:text-yellow-400 dark:text-gray-600'
              }`}
              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          </div>

          {/* Skills tags */}
          {game.skills && game.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {game.skills.slice(0, isExpanded ? undefined : 3).map((skill, idx) => (
                <span key={idx} className="chip text-xs">
                  #{skill}
                </span>
              ))}
              {!isExpanded && game.skills.length > 3 && (
                <span className="text-xs text-gray-400">+{game.skills.length - 3} more</span>
              )}
            </div>
          )}

          {/* Rating */}
          <div className="mb-2">
            <StarRating rating={game.rating || 0} onChange={handleRatingChange} />
          </div>

          {/* Expanded content */}
          {isExpanded && (
            <div className="mt-4 space-y-4 animate-fade-in">
              {game.topPlayer && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Top Player
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                    {game.topPlayer}
                  </p>
                </div>
              )}

              {game.bottomPlayer && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Bottom Player
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                    {game.bottomPlayer}
                  </p>
                </div>
              )}

              {game.coaching && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Coaching Notes
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                    {game.coaching}
                  </p>
                </div>
              )}

              {game.personalNotes && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-yellow-700 dark:text-yellow-300 mb-1 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path d="M10 1a6 6 0 00-3.815 10.631C7.237 12.5 8 13.443 8 14.456v.644a.75.75 0 00.572.729 6.016 6.016 0 002.856 0A.75.75 0 0012 15.1v-.644c0-1.013.762-1.957 1.815-2.825A6 6 0 0010 1zM8.863 17.414a.75.75 0 00-.226 1.483 9.066 9.066 0 002.726 0 .75.75 0 00-.226-1.483 7.553 7.553 0 01-2.274 0z" />
                    </svg>
                    Personal Notes
                  </h4>
                  <p className="text-sm text-yellow-600 dark:text-yellow-400 whitespace-pre-wrap">
                    {game.personalNotes}
                  </p>
                </div>
              )}

              {/* Video Reference */}
              {game.videoUrl && (
                <div className="flex items-center gap-2">
                  <a
                    href={game.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-sm font-medium"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                      <path d="M3.25 4A2.25 2.25 0 001 6.25v7.5A2.25 2.25 0 003.25 16h7.5A2.25 2.25 0 0013 13.75v-7.5A2.25 2.25 0 0010.75 4h-7.5zM19 4.75a.75.75 0 00-1.28-.53l-3 3a.75.75 0 00-.22.53v4.5c0 .199.079.39.22.53l3 3a.75.75 0 001.28-.53V4.75z" />
                    </svg>
                    Watch Video Reference
                  </a>
                </div>
              )}

              {/* Effectiveness Rating */}
              {game.averageEffectiveness > 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-green-500">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                  </svg>
                  <span>
                    Effectiveness: {game.averageEffectiveness.toFixed(1)}/5
                    <span className="text-gray-400 ml-1">
                      ({game.effectivenessRatings?.length || 0} ratings)
                    </span>
                  </span>
                </div>
              )}

              {/* AI Generated metadata */}
              {game.aiGenerated && game.aiMetadata && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <span className="badge bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 mb-2">
                    AI Generated
                  </span>

                  {game.aiMetadata.startPosition && (
                    <div className="mt-2">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Start Position
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {game.aiMetadata.startPosition}
                      </p>
                    </div>
                  )}

                  {game.aiMetadata.constraints && game.aiMetadata.constraints.length > 0 && (
                    <div className="mt-2">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Constraints
                      </h4>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc list-inside">
                        {game.aiMetadata.constraints.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {game.aiMetadata.progressions && game.aiMetadata.progressions.length > 0 && (
                    <div className="mt-2">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Progressions
                      </h4>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 list-decimal list-inside">
                        {game.aiMetadata.progressions.map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Meta info */}
              <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-800">
                <span>
                  Used {game.usageCount || 0} times
                  {game.lastUsed && ` • Last: ${new Date(game.lastUsed).toLocaleDateString()}`}
                </span>
                <span>
                  Created {new Date(game.createdAt).toLocaleDateString()}
                </span>
              </div>

              {/* Actions - organized in groups */}
              <div className="space-y-3 pt-2">
                {/* Primary Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(game);
                    }}
                    className="btn-primary text-sm flex-1 flex items-center justify-center gap-1.5"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                      <path d="M13.488 2.513a1.75 1.75 0 00-2.475 0L6.75 6.774a2.75 2.75 0 00-.596.892l-.848 2.047a.75.75 0 00.98.98l2.047-.848a2.75 2.75 0 00.892-.596l4.261-4.262a1.75 1.75 0 000-2.474z" />
                      <path d="M4.75 3.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h6.5c.69 0 1.25-.56 1.25-1.25V9A.75.75 0 0114 9v2.25A2.75 2.75 0 0111.25 14h-6.5A2.75 2.75 0 012 11.25v-6.5A2.75 2.75 0 014.75 2H7a.75.75 0 010 1.5H4.75z" />
                    </svg>
                    Edit
                  </button>
                  <button
                    onClick={handleMarkUsed}
                    disabled={isMarkingUsed}
                    className="btn-secondary text-sm flex-1 flex items-center justify-center gap-1.5 disabled:opacity-50"
                    title="Mark this game as used in a session"
                  >
                    {isMarkingUsed ? (
                      <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 01.208 1.04l-5 7.5a.75.75 0 01-1.154.114l-3-3a.75.75 0 011.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 011.04-.207z" clipRule="evenodd" />
                      </svg>
                    )}
                    {isMarkingUsed ? 'Marking...' : 'Mark Used'}
                  </button>
                </div>

                {/* Secondary Actions - Quick Actions Row */}
                <div className="flex items-center gap-1 p-1.5 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  {/* Duplicate - Creates a copy of the game */}
                  <button
                    onClick={handleDuplicate}
                    className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-white dark:hover:bg-gray-700 rounded transition-colors"
                    title="Create a copy of this game"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                      <path d="M5.5 3.5A1.5 1.5 0 017 2h2.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 01.439 1.061V9.5A1.5 1.5 0 0112 11h-.5v-2.5A2.5 2.5 0 009 6H5.5v-2.5z" />
                      <path d="M4 6a1.5 1.5 0 00-1.5 1.5v5A1.5 1.5 0 004 14h5a1.5 1.5 0 001.5-1.5V11H9a2.5 2.5 0 01-2.5-2.5V6H4z" />
                      <path d="M7 8.25a.75.75 0 01.75-.75h2.5a.75.75 0 010 1.5h-2.5A.75.75 0 017 8.25z" />
                    </svg>
                    Duplicate
                  </button>

                  <div className="w-px h-5 bg-gray-200 dark:bg-gray-700" />

                  {/* Add to Session */}
                  <div className="relative flex-1" ref={sessionMenuRef}>
                    <button
                      onClick={handleOpenSessionMenu}
                      className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-white dark:hover:bg-gray-700 rounded transition-colors"
                      title="Add to a training session"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                        <path d="M3.5 2A1.5 1.5 0 002 3.5v9A1.5 1.5 0 003.5 14h9a1.5 1.5 0 001.5-1.5v-7A1.5 1.5 0 0012.5 4H9.621a1.5 1.5 0 01-1.06-.44L7.439 2.44A1.5 1.5 0 006.38 2H3.5zM8.75 6.75a.75.75 0 00-1.5 0v1.5h-1.5a.75.75 0 000 1.5h1.5v1.5a.75.75 0 001.5 0v-1.5h1.5a.75.75 0 000-1.5h-1.5v-1.5z" />
                      </svg>
                      Add to Session
                    </button>
                    {showSessionMenu && (
                      <div className="absolute bottom-full right-0 mb-1 w-48 bg-white dark:bg-surface-dark rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 animate-fade-in">
                        <div className="p-2">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2 py-1">
                            Select Session
                          </p>
                          {loadingSessions ? (
                            <div className="px-2 py-3 text-center">
                              <span className="spinner" />
                            </div>
                          ) : recentSessions.length === 0 ? (
                            <p className="px-2 py-2 text-sm text-gray-500 dark:text-gray-400">
                              No sessions yet
                            </p>
                          ) : (
                            recentSessions.map(session => (
                              <button
                                key={session._id}
                                onClick={(e) => handleAddToSession(e, session._id)}
                                className="w-full text-left px-2 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded truncate"
                              >
                                {session.name}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="w-px h-5 bg-gray-200 dark:bg-gray-700" />

                  {/* Copy to Clipboard */}
                  <button
                    onClick={copyToClipboard}
                    className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-white dark:hover:bg-gray-700 rounded transition-colors"
                    title="Copy game details to clipboard"
                  >
                    {copied ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 text-green-500">
                          <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 01.208 1.04l-5 7.5a.75.75 0 01-1.154.114l-3-3a.75.75 0 011.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 011.04-.207z" clipRule="evenodd" />
                        </svg>
                        <span className="text-green-500">Copied!</span>
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                          <path fillRule="evenodd" d="M10.986 3H12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h1.014A2.25 2.25 0 017.25 1h1.5a2.25 2.25 0 012.236 2zM9.5 4v-.75a.75.75 0 00-.75-.75h-1.5a.75.75 0 00-.75.75V4h3z" clipRule="evenodd" />
                        </svg>
                        Copy
                      </>
                    )}
                  </button>
                </div>

                {/* Danger Zone */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(game);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Delete game"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                    <path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 000 1.5h.3l.815 8.15A1.5 1.5 0 005.357 15h5.285a1.5 1.5 0 001.493-1.35l.815-8.15h.3a.75.75 0 000-1.5H11v-.75A2.25 2.25 0 008.75 1h-1.5A2.25 2.25 0 005 3.25zm2.25-.75a.75.75 0 00-.75.75V4h3v-.75a.75.75 0 00-.75-.75h-1.5zM6.05 6a.75.75 0 01.787.713l.275 5.5a.75.75 0 01-1.498.075l-.275-5.5A.75.75 0 016.05 6zm3.9 0a.75.75 0 01.712.787l-.275 5.5a.75.75 0 01-1.498-.075l.275-5.5a.75.75 0 01.786-.711z" clipRule="evenodd" />
                  </svg>
                  Delete Game
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
