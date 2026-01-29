import { useState, useEffect, useRef, useCallback } from 'react';

const DEFAULT_DRILL_DURATION = 300; // 5 minutes

const presets = [
  { label: '3m', seconds: 180 },
  { label: '5m', seconds: 300 },
  { label: '8m', seconds: 480 },
  { label: '10m', seconds: 600 }
];

export default function DrillTimer({
  games = [],
  currentGameIndex = 0,
  onGameComplete,
  onNextGame,
  onPrevGame
}) {
  const [drillDuration, setDrillDuration] = useState(DEFAULT_DRILL_DURATION);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_DRILL_DURATION);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [autoProgress, setAutoProgress] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [restDuration, setRestDuration] = useState(30); // Rest between drills
  const [isResting, setIsResting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [totalSessionTime, setTotalSessionTime] = useState(0);

  const intervalRef = useRef(null);
  const totalTimeRef = useRef(null);

  const currentGame = games[currentGameIndex]?.game;
  const totalGames = games.length;
  const completedGames = games.filter(g => g.completed).length;

  // Timer logic
  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleDrillEnd();
            return 0;
          }
          // Play warning sound at 30 seconds and 10 seconds
          if ((prev === 31 || prev === 11) && soundEnabled && !isResting) {
            playSound('warning');
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
  }, [isRunning, isPaused, soundEnabled, isResting, autoProgress]);

  // Total session timer
  useEffect(() => {
    if (isRunning && !isPaused) {
      totalTimeRef.current = setInterval(() => {
        setTotalSessionTime(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (totalTimeRef.current) {
        clearInterval(totalTimeRef.current);
      }
    };
  }, [isRunning, isPaused]);

  const playSound = useCallback((type) => {
    if (!soundEnabled) return;

    const frequencies = {
      warning: [440, 200],
      end: [880, 500],
      start: [660, 150],
      rest: [523, 300],
      complete: [784, 400]
    };

    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequencies[type]?.[0] || 440;
      gainNode.gain.value = 0.3;

      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        audioContext.close();
      }, frequencies[type]?.[1] || 200);
    } catch (e) {
      console.log('Audio not supported');
    }
  }, [soundEnabled]);

  const handleDrillEnd = useCallback(() => {
    if (isResting) {
      // Rest period ended, start next drill
      setIsResting(false);
      playSound('start');
      setTimeLeft(drillDuration);
    } else {
      // Drill ended
      playSound('end');

      // Mark game as complete
      if (onGameComplete && currentGame) {
        onGameComplete(currentGame._id, true);
      }

      // Check if there are more games
      if (currentGameIndex < totalGames - 1) {
        if (autoProgress) {
          // Start rest period before next game
          setIsResting(true);
          playSound('rest');
          setTimeLeft(restDuration);

          // Move to next game after rest starts
          if (onNextGame) {
            setTimeout(() => onNextGame(), 100);
          }
        } else {
          // Manual progression - stop timer
          setIsRunning(false);
          setIsPaused(false);
          if (onNextGame) onNextGame();
        }
      } else {
        // Session complete!
        setIsRunning(false);
        setIsPaused(false);
        playSound('complete');
      }
    }
  }, [isResting, drillDuration, restDuration, autoProgress, currentGameIndex, totalGames, currentGame, onGameComplete, onNextGame, playSound]);

  const handleStart = () => {
    setTimeLeft(drillDuration);
    setIsRunning(true);
    setIsPaused(false);
    setIsResting(false);
    playSound('start');
  };

  const handlePause = () => {
    setIsPaused(true);
  };

  const handleResume = () => {
    setIsPaused(false);
  };

  const handleStop = () => {
    setIsRunning(false);
    setIsPaused(false);
    setIsResting(false);
    setTimeLeft(drillDuration);
  };

  const handleSkip = () => {
    // Skip to next game
    if (currentGameIndex < totalGames - 1) {
      setTimeLeft(drillDuration);
      setIsResting(false);
      if (onNextGame) onNextGame();
      if (isRunning) {
        playSound('start');
      }
    }
  };

  const handlePrevDrill = () => {
    if (currentGameIndex > 0) {
      setTimeLeft(drillDuration);
      setIsResting(false);
      if (onPrevGame) onPrevGame();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = (timeLeft / (isResting ? restDuration : drillDuration)) * 100;
  const isWarning = timeLeft <= 30 && isRunning && !isResting;
  const isLast = currentGameIndex === totalGames - 1;

  if (games.length === 0) {
    return (
      <div className="card p-4 text-center text-gray-500 dark:text-gray-400">
        No games in this session. Add games to use the drill timer.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Timer Card */}
      <div className={`card p-4 ${isWarning ? 'border-red-500 dark:border-red-500 bg-red-50 dark:bg-red-900/10' : isResting ? 'border-cyan-500 dark:border-cyan-500 bg-cyan-50 dark:bg-cyan-900/10' : ''}`}>
        {/* Current Drill Info */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {isResting ? 'REST' : `DRILL ${currentGameIndex + 1}/${totalGames}`}
              </span>
              {isResting && (
                <span className="badge bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400 text-xs">
                  Next Up
                </span>
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
              {isResting ? 'Rest Period' : currentGame?.name || 'Unknown Game'}
            </h3>
          </div>

          {/* Session Stats */}
          <div className="text-right">
            <div className="text-xs text-gray-500 dark:text-gray-400">Total Time</div>
            <div className="text-sm font-mono font-medium text-gray-700 dark:text-gray-300">
              {formatTime(totalSessionTime)}
            </div>
          </div>
        </div>

        {/* Big Timer Display */}
        <div className="text-center my-6">
          <span className={`text-6xl font-mono font-bold ${
            isResting
              ? 'text-cyan-500'
              : isWarning
              ? 'text-red-500 animate-pulse'
              : 'text-gray-900 dark:text-white'
          }`}>
            {formatTime(timeLeft)}
          </span>

          {/* Status indicator */}
          <div className="mt-2 flex items-center justify-center gap-2 text-sm">
            {isRunning && !isPaused && !isResting && (
              <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Running
              </span>
            )}
            {isResting && (
              <span className="flex items-center gap-1 text-cyan-600 dark:text-cyan-400">
                <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
                Resting - Next: {games[currentGameIndex]?.game?.name}
              </span>
            )}
            {isPaused && (
              <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                <span className="w-2 h-2 bg-yellow-500 rounded-full" />
                Paused
              </span>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-4">
          <div
            className={`h-full transition-all duration-1000 ${
              isResting ? 'bg-cyan-500' : isWarning ? 'bg-red-500' : 'bg-primary-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          {/* Prev */}
          <button
            onClick={handlePrevDrill}
            disabled={currentGameIndex === 0}
            className="btn-secondary h-12 px-4 disabled:opacity-50"
            title="Previous drill"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M7.712 4.819A1.5 1.5 0 0110 6.095v2.973c.104-.131.234-.248.389-.344l6.323-3.905A1.5 1.5 0 0119 6.095v7.81a1.5 1.5 0 01-2.288 1.276l-6.323-3.905a1.505 1.505 0 01-.389-.344v2.973a1.5 1.5 0 01-2.288 1.276l-6.323-3.905a1.5 1.5 0 010-2.552l6.323-3.905z" />
            </svg>
          </button>

          {/* Main controls */}
          {!isRunning ? (
            <button
              onClick={handleStart}
              className="btn-primary h-14 px-8 text-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 mr-2">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
              Start Session
            </button>
          ) : isPaused ? (
            <>
              <button
                onClick={handleResume}
                className="btn-primary h-14 px-6"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 mr-1">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
                Resume
              </button>
              <button
                onClick={handleStop}
                className="btn-danger h-14 px-4"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
                  <path fillRule="evenodd" d="M2 10a8 8 0 1116 0 8 8 0 01-16 0zm5-2.25A.75.75 0 017.75 7h4.5a.75.75 0 01.75.75v4.5a.75.75 0 01-.75.75h-4.5a.75.75 0 01-.75-.75v-4.5z" clipRule="evenodd" />
                </svg>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handlePause}
                className="btn-secondary h-14 px-6"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 mr-1">
                  <path d="M5.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75A.75.75 0 007.25 3h-1.5zM12.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75a.75.75 0 00-.75-.75h-1.5z" />
                </svg>
                Pause
              </button>
              <button
                onClick={handleStop}
                className="btn-danger h-14 px-4"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
                  <path fillRule="evenodd" d="M2 10a8 8 0 1116 0 8 8 0 01-16 0zm5-2.25A.75.75 0 017.75 7h4.5a.75.75 0 01.75.75v4.5a.75.75 0 01-.75.75h-4.5a.75.75 0 01-.75-.75v-4.5z" clipRule="evenodd" />
                </svg>
              </button>
            </>
          )}

          {/* Skip/Next */}
          <button
            onClick={handleSkip}
            disabled={isLast}
            className="btn-secondary h-12 px-4 disabled:opacity-50"
            title="Skip to next drill"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M12.288 4.819A1.5 1.5 0 0110 6.095v2.973c-.104-.131-.234-.248-.389-.344L3.288 4.819A1.5 1.5 0 001 6.095v7.81a1.5 1.5 0 002.288 1.276l6.323-3.905c.155-.096.285-.213.389-.344v2.973a1.5 1.5 0 002.288 1.276l6.323-3.905a1.5 1.5 0 000-2.552l-6.323-3.905z" />
            </svg>
          </button>
        </div>

        {/* Settings Toggle */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M7.84 1.804A1 1 0 018.82 1h2.36a1 1 0 01.98.804l.331 1.652a6.993 6.993 0 011.929 1.115l1.598-.54a1 1 0 011.186.447l1.18 2.044a1 1 0 01-.205 1.251l-1.267 1.113a7.047 7.047 0 010 2.228l1.267 1.113a1 1 0 01.206 1.25l-1.18 2.045a1 1 0 01-1.187.447l-1.598-.54a6.993 6.993 0 01-1.929 1.115l-.33 1.652a1 1 0 01-.98.804H8.82a1 1 0 01-.98-.804l-.331-1.652a6.993 6.993 0 01-1.929-1.115l-1.598.54a1 1 0 01-1.186-.447l-1.18-2.044a1 1 0 01.205-1.251l1.267-1.114a7.05 7.05 0 010-2.227L1.821 7.773a1 1 0 01-.206-1.25l1.18-2.045a1 1 0 011.187-.447l1.598.54A6.993 6.993 0 017.51 3.456l.33-1.652zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
            Timer Settings
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className={`w-4 h-4 transition-transform ${showSettings ? 'rotate-180' : ''}`}>
              <path fillRule="evenodd" d="M4.22 6.22a.75.75 0 011.06 0L8 8.94l2.72-2.72a.75.75 0 111.06 1.06l-3.25 3.25a.75.75 0 01-1.06 0L4.22 7.28a.75.75 0 010-1.06z" clipRule="evenodd" />
            </svg>
          </button>

          {showSettings && (
            <div className="mt-4 space-y-4 animate-fade-in">
              {/* Drill Duration Presets */}
              <div>
                <label className="label text-xs">Drill Duration</label>
                <div className="flex gap-2 flex-wrap">
                  {presets.map(preset => (
                    <button
                      key={preset.seconds}
                      onClick={() => {
                        setDrillDuration(preset.seconds);
                        if (!isRunning) setTimeLeft(preset.seconds);
                      }}
                      className={`chip ${drillDuration === preset.seconds ? 'chip-active' : ''}`}
                    >
                      {preset.label}
                    </button>
                  ))}
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={Math.floor(drillDuration / 60)}
                      onChange={(e) => {
                        const seconds = (parseInt(e.target.value) || 1) * 60;
                        setDrillDuration(seconds);
                        if (!isRunning) setTimeLeft(seconds);
                      }}
                      className="input w-14 text-center text-sm"
                      min="1"
                      max="30"
                    />
                    <span className="text-xs text-gray-500">min</span>
                  </div>
                </div>
              </div>

              {/* Rest Duration */}
              <div>
                <label className="label text-xs">Rest Between Drills</label>
                <div className="flex gap-2 items-center">
                  {[15, 30, 45, 60].map(seconds => (
                    <button
                      key={seconds}
                      onClick={() => setRestDuration(seconds)}
                      className={`chip ${restDuration === seconds ? 'chip-active' : ''}`}
                    >
                      {seconds}s
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoProgress}
                    onChange={(e) => setAutoProgress(e.target.checked)}
                    className="checkbox"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Auto-progress to next drill</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={soundEnabled}
                    onChange={(e) => setSoundEnabled(e.target.checked)}
                    className="checkbox"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Sound alerts</span>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Drill Progress Overview */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Session Progress
          </h4>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {completedGames}/{totalGames} completed
          </span>
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {games.map((g, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                idx === currentGameIndex
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 ring-2 ring-primary-500'
                  : g.completed
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              {g.completed && (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                  <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 01.208 1.04l-5 7.5a.75.75 0 01-1.154.114l-3-3a.75.75 0 011.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 011.04-.207z" clipRule="evenodd" />
                </svg>
              )}
              {idx + 1}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
