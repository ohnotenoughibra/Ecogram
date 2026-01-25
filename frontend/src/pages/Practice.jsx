import { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';

// Custom hook for swipe detection
function useSwipe(onSwipeLeft, onSwipeRight) {
  const touchStart = useRef(null);
  const touchEnd = useRef(null);
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    touchEnd.current = null;
    touchStart.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e) => {
    touchEnd.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStart.current || !touchEnd.current) return;
    const distance = touchStart.current - touchEnd.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe && onSwipeLeft) onSwipeLeft();
    if (isRightSwipe && onSwipeRight) onSwipeRight();
  };

  return { onTouchStart, onTouchMove, onTouchEnd };
}

const topicLabels = {
  offensive: 'Offensive / Submissions',
  defensive: 'Defensive / Escapes',
  control: 'Control / Passing',
  transition: 'Transition / Scrambles'
};

const topicColors = {
  offensive: 'bg-red-500',
  defensive: 'bg-blue-500',
  control: 'bg-purple-500',
  transition: 'bg-green-500'
};

const gameTypeInfo = {
  warmup: { label: 'Warmup', icon: '🔥', color: 'bg-orange-500' },
  main: { label: 'Main', icon: '🎯', color: 'bg-blue-500' },
  cooldown: { label: 'Cooldown', icon: '🧘', color: 'bg-teal-500' }
};

export default function Practice() {
  const { games, markGameUsed, showToast, createSession } = useApp();
  const [currentGame, setCurrentGame] = useState(null);
  const [filterTopic, setFilterTopic] = useState('');
  const [filterGameType, setFilterGameType] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  // Timer state
  const [timerDuration, setTimerDuration] = useState(180); // 3 minutes default
  const [timeRemaining, setTimeRemaining] = useState(180);
  const [isRunning, setIsRunning] = useState(false);
  const [rounds, setRounds] = useState(0);
  const audioRef = useRef(null);
  const intervalRef = useRef(null);

  // Session history - track games played this practice session
  const [sessionHistory, setSessionHistory] = useState([]);
  const [skippedGames, setSkippedGames] = useState(new Set());

  // Get filtered games (excluding skipped ones)
  const filteredGames = games.filter(game => {
    if (filterTopic && game.topic !== filterTopic) return false;
    if (filterGameType && game.gameType !== filterGameType) return false;
    if (favoritesOnly && !game.favorite) return false;
    if (skippedGames.has(game._id)) return false;
    return true;
  });

  // Pick random game
  const pickRandomGame = useCallback((addToHistory = false) => {
    if (filteredGames.length === 0) {
      setCurrentGame(null);
      return null;
    }
    const randomIndex = Math.floor(Math.random() * filteredGames.length);
    const game = filteredGames[randomIndex];
    setCurrentGame(game);
    setShowDetails(false);
    if (addToHistory) {
      setSessionHistory(prev => [...prev, game]);
      markGameUsed(game._id);
    }
    return game;
  }, [filteredGames, markGameUsed]);

  // Skip current game and get a new one
  const skipGame = useCallback(() => {
    if (currentGame) {
      setSkippedGames(prev => new Set([...prev, currentGame._id]));
      showToast('Game skipped', 'info');
    }
    // Pick a new game (filteredGames will be updated on next render)
    const availableGames = filteredGames.filter(g => g._id !== currentGame?._id);
    if (availableGames.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableGames.length);
      const game = availableGames[randomIndex];
      setCurrentGame(game);
      setShowDetails(false);
    } else {
      setCurrentGame(null);
      showToast('No more games available', 'info');
    }
  }, [currentGame, filteredGames, showToast]);

  // Clear skipped games
  const clearSkipped = useCallback(() => {
    setSkippedGames(new Set());
    showToast('Skipped games cleared', 'success');
  }, [showToast]);

  // Save current session history as a session
  const saveAsSession = useCallback(async () => {
    if (sessionHistory.length === 0) {
      showToast('No games to save', 'error');
      return;
    }

    const name = prompt('Session name:', `Practice ${new Date().toLocaleDateString()}`);
    if (!name) return;

    try {
      const gameIds = sessionHistory.map(g => g._id);
      const result = await createSession({ name, gameIds });
      if (result.success) {
        showToast(`Session "${name}" saved with ${sessionHistory.length} games`, 'success');
      }
    } catch (error) {
      showToast('Failed to save session', 'error');
    }
  }, [sessionHistory, createSession, showToast]);

  // Timer functions
  const startTimer = useCallback(() => {
    setIsRunning(true);
  }, []);

  const pauseTimer = useCallback(() => {
    setIsRunning(false);
  }, []);

  const resetTimer = useCallback(() => {
    setIsRunning(false);
    setTimeRemaining(timerDuration);
  }, [timerDuration]);

  const startNewRound = useCallback(() => {
    pickRandomGame(true); // Add to history
    setTimeRemaining(timerDuration);
    setIsRunning(true);
    setRounds(prev => prev + 1);
  }, [pickRandomGame, timerDuration]);

  // Timer effect
  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            // Play sound
            if (audioRef.current) {
              audioRef.current.play().catch(() => {});
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeRemaining]);

  // Update timeRemaining when duration changes
  useEffect(() => {
    if (!isRunning) {
      setTimeRemaining(timerDuration);
    }
  }, [timerDuration, isRunning]);

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Timer progress percentage
  const progress = (timeRemaining / timerDuration) * 100;
  const progressColor = timeRemaining <= 10 ? 'text-red-500' : timeRemaining <= 30 ? 'text-yellow-500' : 'text-primary-500';

  // Copy game to clipboard
  const copyGameToClipboard = useCallback(() => {
    if (!currentGame) return;

    const text = `${currentGame.name}
Topic: ${topicLabels[currentGame.topic]}
${currentGame.skills?.length ? `Skills: ${currentGame.skills.map(s => '#' + s).join(' ')}` : ''}
${currentGame.topPlayer ? `\nTop Player:\n${currentGame.topPlayer}` : ''}
${currentGame.bottomPlayer ? `\nBottom Player:\n${currentGame.bottomPlayer}` : ''}
${currentGame.coaching ? `\nCoaching Notes:\n${currentGame.coaching}` : ''}`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      showToast('Game copied to clipboard', 'success');
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      showToast('Failed to copy', 'error');
    });
  }, [currentGame, showToast]);

  // Swipe handlers for mobile
  const swipeHandlers = useSwipe(
    () => filteredGames.length > 0 && startNewRound(), // Swipe left = new round
    () => setShowDetails(prev => !prev) // Swipe right = toggle details
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Audio element for timer end sound */}
      <audio ref={audioRef} preload="auto">
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleVEpNYzn7IVEGRx4zfKDQhQOZLrshk0hF1yt7INHHRRkseqOUCMRZbXvjUkgC2ax8YtMIBBptPCKSx8OaLXyjkoeDmi28Y5LHw5otfCOSx8OaLXwjksfDWm28I1JHg1otfCOSx4NabXwjkkeDmi28I5KHg5otfCOSR4OaLbwjkkeDWm28I1JHg1otfCOSR4NaLXwjkkeDWi28I5JHQ1ptvCNSR4NaLbwjUkeDWi18I1KHg1otvCOSR4NaLXwjkkeDWm18I5JHQ5otvCNSR4NaLbwjUkeDWm28I1JHg1otfCOSR4NabXwjUkeDWi28I5JHQ5ptvCNSR4NaLbwjUkeDWm28I1JHw1otfCOSR4NaLXwjkkeDWm18I5JHQ1otfCOSh0OaLXwjUkeDWm28I1JHg1ptfCNSR4NaLXwjkkdDWm28I5JHQ5otfCNSR4NaLXwjkkeDWm28I5JHQ1ptvCNSR4NaLXwjUkeDmi28I1JHg5otfCNSR4OaLXwjUoeDWm28I1JHg1otfCNSR4NaLXwjUkeDWi18I5JHg1ptfCNSR4OaLXwjkkdDWm28I1JHg1otvCNSR4OaLXwjUkeDmi28I5JHQ1ptvCOSR4NaLXwjUkeDWi28I5JHQ5otfCOSR4NaLXwjkkdDWm18I5JHg1otvCNSR4OaLXwjUkeDWi28I5KHg1ptfCNSR4NaLXwjkkdDWi28I1JHg1ptvCNSR4NabXwjUkeDWi28I5JHQ5ptvCNSR4OaLXwjUkeDWi18I5JHg5otfCOSR4NaLXwjkkeDWi28I1JHg1ptvCOSR4NaLXwjkkeDWi28I5JHQ5ptvCNSR4NaLXwjkkdDmi28I5JHg1otvCNSR0OaLXwjUoeDWm28I5JHg1otfCNSR4NaLbwjUkeDWm18I5JHg1ptvCNSR4NaLXwjkkdDmi28I1JHg5otfCNSR4OaLXwjkkdDWm28I5JHQ1ptvCNSR4NaLXwjkkeDWm28I5JHQ1ptvCOSR4NaLXwjUkeDWm28I5JHQ1otvCNSR4OaLXwjUkeDWi28I5JHg1ptvCOSR4NaLXwjUkeDWm28I5JHQ5otfCNSR4OaLXwjUkeDWi28I5JHQ1ptvCNSR4OaLbwjUkeDWi28I5JHQ1ptvCNSR4NaLXwjUkeDWm28I1JHg1ptvCOSR4NaLXwjkkeDmi28I5JHQ5ptvCNSR4NaLXwjUkeDWm28I5JHQ1ptvCNSR4OaLXwjUkeDWi28I5JHQ5ptvCNSR4OaLbwjUkeDWi28I1JHw1ptvCOSR4NaLXwjUkeDWm28I5JHQ1otvCNSR4OaLXwjUkeDWi28I5JHQ5ptvCNSR4OaLXwjUkeDWm28I1JHg1ptvCOSR4NaLXwjkkeDWi28I5KHQ5otvCNSR4OaLXwjUkeDWi28I5JHQ5otvCNSR4NaLXwjUkeDWm28I5JHQ1otvCNSR4OaLXwjUkeDWi28I5KHQ5ptvCNSR4OaLXwjUkeDWi28I1JHg1ptvCNSR4OaLbwjUkeDWi28I5JHQ5ptvCNSR4OaLXwjUkeDWi28I5JHg1otvCNSR4OaLXwjkkeDWi28I5JHg1ptvCNSR4NaLXwjUkeDWi28I5JHQ5otvCNSR4NaLXwjkkeDWm28I5JHQ1otvCOSR4NaLXwjUkeDWm28I5JHg1otvCNSR4NaLXwjUkdDWm28I1JHg5ptvCNSR4NaLXwjUkeDWi28I5JHg1ptvCNSR4OaLXwjkkdDWm28I5JHg1otvCNSR0OaLXwjUkeDWi18I5JHQ1otvCNSR4OaLXwjkkeDWm28I5JHQ1otvCNSR4OaLXwjUkeDWm28I5JHg1otvCOSR4NaLXwjUoeDWi28I1JHg1ptvCNSR4NaLXwjkkdDWm28I5JHQ5ptvCNSR4OaLXwjUkeDWm28I5JHQ5otvCNSR4NaLXwjkkeDWi28I5JHQ1ptvCNSR4OaLXwjUkeDWm28I5JHQ5ptvCNSR4OaLbwjUkeDWi28I5JHQ1ptvCNSR4OaLXwjkkeDWi28I5JHQ1ptvCOSR4OaLXwjUkeDWm28I5JHQ1otvCNSR4OaLXwjkkdDWm28I5JHQ1otvCNSR4OaLXwjUkeDWi28I5JHQ==" type="audio/wav" />
      </audio>

      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Quick Practice
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Random game with timer
        </p>
      </div>

      {/* Filters */}
      <div className="card p-3 sm:p-4">
        <div className="flex flex-wrap gap-2 sm:gap-3 mb-3">
          <select
            value={filterTopic}
            onChange={(e) => setFilterTopic(e.target.value)}
            className="input py-2 flex-1 min-w-[120px] text-sm sm:text-base"
          >
            <option value="">All Topics</option>
            <option value="offensive">Offensive ({games.filter(g => g.topic === 'offensive').length})</option>
            <option value="defensive">Defensive ({games.filter(g => g.topic === 'defensive').length})</option>
            <option value="control">Control ({games.filter(g => g.topic === 'control').length})</option>
            <option value="transition">Transition ({games.filter(g => g.topic === 'transition').length})</option>
          </select>

          <button
            onClick={() => setFavoritesOnly(!favoritesOnly)}
            className={`chip text-sm ${favoritesOnly ? 'chip-active' : ''}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 ${favoritesOnly ? 'text-yellow-400' : ''}`}>
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="hidden sm:inline">Favorites</span>
          </button>
        </div>

        {/* Game Type Filter - horizontal scroll on mobile */}
        <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 sm:flex-wrap">
          <button
            onClick={() => setFilterGameType('')}
            className={`chip text-xs sm:text-sm flex-shrink-0 ${filterGameType === '' ? 'chip-active' : ''}`}
          >
            All
          </button>
          {Object.entries(gameTypeInfo).map(([value, info]) => (
            <button
              key={value}
              onClick={() => setFilterGameType(value)}
              className={`chip text-xs sm:text-sm flex-shrink-0 ${filterGameType === value ? 'chip-active' : ''}`}
            >
              <span>{info.icon}</span>
              <span>{info.label}</span>
              <span className="text-xs text-gray-400 hidden sm:inline">
                ({games.filter(g => (g.gameType || 'main') === value).length})
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-end gap-2 text-xs sm:text-sm text-gray-500 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          {filteredGames.length} games available
        </div>
      </div>

      {/* Timer */}
      <div className="card p-4 sm:p-6">
        {/* Timer display - smaller on mobile */}
        <div className="relative flex items-center justify-center mb-4 sm:mb-6">
          <svg className="w-36 h-36 sm:w-48 sm:h-48 transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              className="text-gray-200 dark:text-gray-700"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
              className={`${progressColor} transition-all duration-1000`}
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className={`text-4xl sm:text-5xl font-bold ${timeRemaining === 0 ? 'text-red-500 animate-pulse' : 'text-gray-900 dark:text-white'}`}>
              {formatTime(timeRemaining)}
            </span>
            {rounds > 0 && (
              <span className="text-xs sm:text-sm text-gray-500 mt-1">
                Round {rounds}
              </span>
            )}
          </div>
        </div>

        {/* Timer duration selector - scrollable on mobile */}
        <div className="flex justify-start sm:justify-center gap-1.5 sm:gap-2 mb-4 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          {[60, 120, 180, 300, 420].map(duration => (
            <button
              key={duration}
              onClick={() => setTimerDuration(duration)}
              disabled={isRunning}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                timerDuration === duration
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              } ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {duration >= 60 ? `${duration / 60}m` : `${duration}s`}
            </button>
          ))}
        </div>

        {/* Timer controls - responsive */}
        <div className="flex justify-center gap-2 sm:gap-3">
          {!isRunning ? (
            <button
              onClick={startTimer}
              disabled={filteredGames.length === 0}
              className="btn-primary px-6 sm:px-8 py-2.5 sm:py-3"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-1 sm:mr-2">
                <path fillRule="evenodd" d="M2 10a8 8 0 1116 0 8 8 0 01-16 0zm6.39-2.908a.75.75 0 01.766.027l3.5 2.25a.75.75 0 010 1.262l-3.5 2.25A.75.75 0 018 12.25v-4.5a.75.75 0 01.39-.658z" clipRule="evenodd" />
              </svg>
              {timeRemaining === 0 ? 'Restart' : 'Start'}
            </button>
          ) : (
            <button
              onClick={pauseTimer}
              className="btn-secondary px-6 sm:px-8 py-2.5 sm:py-3"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-1 sm:mr-2">
                <path fillRule="evenodd" d="M2 10a8 8 0 1116 0 8 8 0 01-16 0zm5-2.25A.75.75 0 017.75 7h.5a.75.75 0 01.75.75v4.5a.75.75 0 01-.75.75h-.5a.75.75 0 01-.75-.75v-4.5zm4 0a.75.75 0 01.75-.75h.5a.75.75 0 01.75.75v4.5a.75.75 0 01-.75.75h-.5a.75.75 0 01-.75-.75v-4.5z" clipRule="evenodd" />
              </svg>
              Pause
            </button>
          )}

          <button
            onClick={resetTimer}
            className="btn-secondary px-3 sm:px-4 py-2.5 sm:py-3"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0v2.43l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Game display */}
      <div
        className="card p-4 select-none"
        {...swipeHandlers}
      >
        {/* Header - stacks on small screens */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Current Game</h2>
          <div className="flex gap-2 flex-wrap justify-end">
            {currentGame && (
              <>
                <button
                  onClick={copyGameToClipboard}
                  className="btn-secondary px-2.5 sm:px-3 py-2"
                  title="Copy game details"
                >
                  {copied ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-green-500">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
                      <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z" />
                    </svg>
                  )}
                </button>
                <button
                  onClick={skipGame}
                  className="btn-secondary px-2.5 sm:px-3 py-2"
                  title="Skip this game"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path d="M15.28 9.47a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L13.19 10 9.97 6.78a.75.75 0 011.06-1.06l4.25 4.25zM6.03 5.22l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L8.19 10 4.97 6.78a.75.75 0 011.06-1.06z" />
                  </svg>
                </button>
              </>
            )}
            <button
              onClick={startNewRound}
              disabled={filteredGames.length === 0}
              className="btn-primary py-2 text-sm sm:text-base"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1 sm:mr-2">
                <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0v2.43l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd" />
              </svg>
              New Round
            </button>
          </div>
        </div>

        {currentGame ? (
          <div className="space-y-4">
            {/* Game header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {currentGame.gameType && currentGame.gameType !== 'main' && (
                    <span className="text-sm px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800">
                      {gameTypeInfo[currentGame.gameType]?.icon} {gameTypeInfo[currentGame.gameType]?.label}
                    </span>
                  )}
                  {currentGame.difficulty && currentGame.difficulty !== 'intermediate' && (
                    <span className={`text-xs px-2 py-0.5 rounded-full text-white ${
                      currentGame.difficulty === 'beginner' ? 'bg-green-500' : 'bg-red-500'
                    }`}>
                      {currentGame.difficulty}
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {currentGame.name}
                </h3>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`w-3 h-3 rounded-full ${topicColors[currentGame.topic]}`}></span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {topicLabels[currentGame.topic]}
                  </span>
                </div>
              </div>
              {currentGame.favorite && (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 text-yellow-400">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              )}
            </div>

            {/* Skills */}
            {currentGame.skills && currentGame.skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {currentGame.skills.map((skill, idx) => (
                  <span key={idx} className="chip text-sm">
                    #{skill}
                  </span>
                ))}
              </div>
            )}

            {/* Toggle details button */}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full btn-secondary"
            >
              {showDetails ? 'Hide Details' : 'Show Details'}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className={`w-4 h-4 ml-2 transition-transform ${showDetails ? 'rotate-180' : ''}`}
              >
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            </button>

            {/* Details */}
            {showDetails && (
              <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700 animate-fade-in">
                {currentGame.topPlayer && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Top Player
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                      {currentGame.topPlayer}
                    </p>
                  </div>
                )}

                {currentGame.bottomPlayer && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Bottom Player
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                      {currentGame.bottomPlayer}
                    </p>
                  </div>
                )}

                {currentGame.coaching && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Coaching Notes
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                      {currentGame.coaching}
                    </p>
                  </div>
                )}

                {currentGame.aiGenerated && currentGame.aiMetadata && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <span className="badge bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 mb-2">
                      AI Generated
                    </span>

                    {currentGame.aiMetadata.startPosition && (
                      <div className="mt-2">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Start Position
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {currentGame.aiMetadata.startPosition}
                        </p>
                      </div>
                    )}

                    {currentGame.aiMetadata.constraints && currentGame.aiMetadata.constraints.length > 0 && (
                      <div className="mt-2">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Constraints
                        </h4>
                        <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc list-inside">
                          {currentGame.aiMetadata.constraints.map((c, i) => (
                            <li key={i}>{c}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {filteredGames.length === 0 ? (
              <div>
                <p className="mb-2">No games match your filters</p>
                <div className="flex flex-col gap-2 items-center">
                  <button
                    onClick={() => {
                      setFilterTopic('');
                      setFilterGameType('');
                      setFavoritesOnly(false);
                    }}
                    className="text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    Clear filters
                  </button>
                  {skippedGames.size > 0 && (
                    <button
                      onClick={clearSkipped}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Clear {skippedGames.size} skipped games
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 005.427-.63 48.05 48.05 0 00.582-4.717.532.532 0 00-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.96.401v0a.656.656 0 00.658-.663 48.422 48.422 0 00-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 01-.61-.58v0z" />
                </svg>
                <p className="mb-2 font-medium">Ready to practice?</p>
                <p className="text-sm mb-4">Click "New Round" to pick a random game and start the timer</p>
                <p className="text-xs text-gray-400 lg:hidden">Swipe left for new game, right to toggle details</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Session History & Actions */}
      {(sessionHistory.length > 0 || skippedGames.size > 0) && (
        <div className="card p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
              Session: {sessionHistory.length} games
            </h3>
            <div className="flex gap-2 flex-wrap">
              {skippedGames.size > 0 && (
                <button
                  onClick={clearSkipped}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Clear {skippedGames.size} skipped
                </button>
              )}
              <button
                onClick={saveAsSession}
                disabled={sessionHistory.length === 0}
                className="btn-secondary text-xs sm:text-sm py-1 sm:py-1.5 disabled:opacity-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1">
                  <path fillRule="evenodd" d="M3.75 3A1.75 1.75 0 002 4.75v3.26a3.235 3.235 0 011.75-.51h12.5c.644 0 1.245.188 1.75.51V6.75A1.75 1.75 0 0016.25 5h-4.836a.25.25 0 01-.177-.073L9.823 3.513A1.75 1.75 0 008.586 3H3.75zM3.75 9A1.75 1.75 0 002 10.75v4.5c0 .966.784 1.75 1.75 1.75h12.5A1.75 1.75 0 0018 15.25v-4.5A1.75 1.75 0 0016.25 9H3.75z" clipRule="evenodd" />
                </svg>
                Save
              </button>
            </div>
          </div>

          {/* Games list */}
          {sessionHistory.length > 0 && (
            <div className="space-y-1 max-h-32 sm:max-h-40 overflow-y-auto">
              {sessionHistory.map((game, idx) => (
                <div
                  key={`${game._id}-${idx}`}
                  className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 py-1"
                >
                  <span className="text-xs text-gray-400 w-5">{idx + 1}.</span>
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${topicColors[game.topic]}`} />
                  <span className="truncate">{game.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
