import { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';

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

export default function Practice() {
  const { games, markGameUsed } = useApp();
  const [currentGame, setCurrentGame] = useState(null);
  const [filterTopic, setFilterTopic] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Timer state
  const [timerDuration, setTimerDuration] = useState(180); // 3 minutes default
  const [timeRemaining, setTimeRemaining] = useState(180);
  const [isRunning, setIsRunning] = useState(false);
  const [rounds, setRounds] = useState(0);
  const audioRef = useRef(null);
  const intervalRef = useRef(null);

  // Get filtered games
  const filteredGames = games.filter(game => {
    if (filterTopic && game.topic !== filterTopic) return false;
    if (favoritesOnly && !game.favorite) return false;
    return true;
  });

  // Pick random game
  const pickRandomGame = useCallback(() => {
    if (filteredGames.length === 0) {
      setCurrentGame(null);
      return;
    }
    const randomIndex = Math.floor(Math.random() * filteredGames.length);
    const game = filteredGames[randomIndex];
    setCurrentGame(game);
    setShowDetails(false);
    markGameUsed(game._id);
  }, [filteredGames, markGameUsed]);

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
    pickRandomGame();
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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
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
      <div className="card p-4">
        <div className="flex flex-wrap gap-3">
          <select
            value={filterTopic}
            onChange={(e) => setFilterTopic(e.target.value)}
            className="input py-2 flex-1 min-w-[150px]"
          >
            <option value="">All Topics ({games.length})</option>
            <option value="offensive">Offensive ({games.filter(g => g.topic === 'offensive').length})</option>
            <option value="defensive">Defensive ({games.filter(g => g.topic === 'defensive').length})</option>
            <option value="control">Control ({games.filter(g => g.topic === 'control').length})</option>
            <option value="transition">Transition ({games.filter(g => g.topic === 'transition').length})</option>
          </select>

          <button
            onClick={() => setFavoritesOnly(!favoritesOnly)}
            className={`chip ${favoritesOnly ? 'chip-active' : ''}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 ${favoritesOnly ? 'text-yellow-400' : ''}`}>
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Favorites
          </button>

          <div className="flex items-center gap-2 text-sm text-gray-500">
            {filteredGames.length} games available
          </div>
        </div>
      </div>

      {/* Timer */}
      <div className="card p-6">
        {/* Timer display */}
        <div className="relative flex items-center justify-center mb-6">
          <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 100 100">
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
            <span className={`text-5xl font-bold ${timeRemaining === 0 ? 'text-red-500 animate-pulse' : 'text-gray-900 dark:text-white'}`}>
              {formatTime(timeRemaining)}
            </span>
            {rounds > 0 && (
              <span className="text-sm text-gray-500 mt-1">
                Round {rounds}
              </span>
            )}
          </div>
        </div>

        {/* Timer duration selector */}
        <div className="flex justify-center gap-2 mb-4">
          {[60, 120, 180, 300, 420].map(duration => (
            <button
              key={duration}
              onClick={() => setTimerDuration(duration)}
              disabled={isRunning}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                timerDuration === duration
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              } ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {duration >= 60 ? `${duration / 60}m` : `${duration}s`}
            </button>
          ))}
        </div>

        {/* Timer controls */}
        <div className="flex justify-center gap-3">
          {!isRunning ? (
            <button
              onClick={startTimer}
              disabled={filteredGames.length === 0}
              className="btn-primary px-8 py-3"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2">
                <path fillRule="evenodd" d="M2 10a8 8 0 1116 0 8 8 0 01-16 0zm6.39-2.908a.75.75 0 01.766.027l3.5 2.25a.75.75 0 010 1.262l-3.5 2.25A.75.75 0 018 12.25v-4.5a.75.75 0 01.39-.658z" clipRule="evenodd" />
              </svg>
              {timeRemaining === 0 ? 'Restart' : 'Start'}
            </button>
          ) : (
            <button
              onClick={pauseTimer}
              className="btn-secondary px-8 py-3"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2">
                <path fillRule="evenodd" d="M2 10a8 8 0 1116 0 8 8 0 01-16 0zm5-2.25A.75.75 0 017.75 7h.5a.75.75 0 01.75.75v4.5a.75.75 0 01-.75.75h-.5a.75.75 0 01-.75-.75v-4.5zm4 0a.75.75 0 01.75-.75h.5a.75.75 0 01.75.75v4.5a.75.75 0 01-.75.75h-.5a.75.75 0 01-.75-.75v-4.5z" clipRule="evenodd" />
              </svg>
              Pause
            </button>
          )}

          <button
            onClick={resetTimer}
            className="btn-secondary px-4 py-3"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0v2.43l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Game display */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Current Game</h2>
          <button
            onClick={startNewRound}
            disabled={filteredGames.length === 0}
            className="btn-primary"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-2">
              <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0v2.43l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd" />
            </svg>
            New Round
          </button>
        </div>

        {currentGame ? (
          <div className="space-y-4">
            {/* Game header */}
            <div className="flex items-start justify-between">
              <div>
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
                <button
                  onClick={() => {
                    setFilterTopic('');
                    setFavoritesOnly(false);
                  }}
                  className="text-primary-600 dark:text-primary-400 hover:underline"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div>
                <p className="mb-2">Click "New Round" to pick a random game</p>
                <p className="text-sm">Timer will start automatically</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats */}
      {rounds > 0 && (
        <div className="card p-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Session: <span className="font-bold text-gray-900 dark:text-white">{rounds}</span> rounds completed
          </p>
        </div>
      )}

      {/* Bottom padding for mobile nav */}
      <div className="h-20 lg:h-0"></div>
    </div>
  );
}
