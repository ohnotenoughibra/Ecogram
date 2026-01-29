import { useState, useEffect, useRef, useCallback } from 'react';

const presets = [
  { label: '3 min', seconds: 180 },
  { label: '5 min', seconds: 300 },
  { label: '10 min', seconds: 600 }
];

export default function Timer({
  isOpen,
  onClose,
  initialDuration = 300,
  onTimerEnd,
  syncState = null,
  onSyncStart,
  onSyncPause,
  onSyncResume,
  onSyncStop
}) {
  const [duration, setDuration] = useState(initialDuration);
  const [timeLeft, setTimeLeft] = useState(initialDuration);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [roundMode, setRoundMode] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(5);

  const intervalRef = useRef(null);
  const audioRef = useRef(null);

  // Sync with external state (for Socket.io)
  useEffect(() => {
    if (syncState) {
      if (syncState.isRunning) {
        const elapsed = Math.floor((Date.now() - syncState.startTime) / 1000);
        const remaining = Math.max(0, syncState.duration - elapsed);
        setTimeLeft(remaining);
        setIsRunning(true);
        setIsPaused(false);
      } else if (syncState.pausedAt) {
        setTimeLeft(syncState.pausedAt);
        setIsRunning(false);
        setIsPaused(true);
      }
    }
  }, [syncState]);

  // Timer logic
  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimerEnd();
            return 0;
          }
          // Play warning sound at 30 seconds
          if (prev === 31 && soundEnabled) {
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
  }, [isRunning, isPaused, soundEnabled]);

  const playSound = useCallback((type) => {
    if (!soundEnabled) return;

    const frequencies = {
      warning: [440, 200],
      end: [880, 500],
      start: [660, 150]
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

  const handleTimerEnd = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
    playSound('end');

    if (roundMode && currentRound < totalRounds) {
      // Auto-advance to next round after a brief pause
      setTimeout(() => {
        setCurrentRound(prev => prev + 1);
        setTimeLeft(duration);
        setIsRunning(true);
        playSound('start');
      }, 3000);
    } else {
      if (onTimerEnd) onTimerEnd();
    }
  }, [roundMode, currentRound, totalRounds, duration, playSound, onTimerEnd]);

  const handleStart = () => {
    if (onSyncStart) {
      onSyncStart(duration);
    } else {
      setTimeLeft(duration);
      setIsRunning(true);
      setIsPaused(false);
      playSound('start');
    }
  };

  const handlePause = () => {
    if (onSyncPause) {
      onSyncPause();
    } else {
      setIsPaused(true);
    }
  };

  const handleResume = () => {
    if (onSyncResume) {
      onSyncResume();
    } else {
      setIsPaused(false);
    }
  };

  const handleStop = () => {
    if (onSyncStop) {
      onSyncStop();
    } else {
      setIsRunning(false);
      setIsPaused(false);
      setTimeLeft(duration);
      setCurrentRound(1);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePresetClick = (seconds) => {
    setDuration(seconds);
    if (!isRunning) {
      setTimeLeft(seconds);
    }
  };

  const handleCustomDuration = (e) => {
    const value = parseInt(e.target.value) || 0;
    const seconds = value * 60;
    setDuration(seconds);
    if (!isRunning) {
      setTimeLeft(seconds);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-2xl w-full max-w-md animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Timer</h2>
          <button
            onClick={onClose}
            className="btn-icon text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        {/* Timer display */}
        <div className="p-8 text-center">
          <div className={`timer-display ${timeLeft <= 30 && isRunning ? 'text-red-500 animate-pulse' : 'text-gray-900 dark:text-white'}`}>
            {formatTime(timeLeft)}
          </div>

          {roundMode && (
            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Round {currentRound} of {totalRounds}
            </div>
          )}

          {/* Progress bar */}
          <div className="mt-4 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 transition-all duration-1000"
              style={{ width: `${(timeLeft / duration) * 100}%` }}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="p-4 space-y-4">
          {/* Main controls */}
          <div className="flex justify-center gap-4">
            {!isRunning ? (
              <button
                onClick={handleStart}
                className="btn-primary w-32 h-12 text-lg"
              >
                Start
              </button>
            ) : isPaused ? (
              <>
                <button
                  onClick={handleResume}
                  className="btn-primary w-24 h-12"
                >
                  Resume
                </button>
                <button
                  onClick={handleStop}
                  className="btn-danger w-24 h-12"
                >
                  Stop
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handlePause}
                  className="btn-secondary w-24 h-12"
                >
                  Pause
                </button>
                <button
                  onClick={handleStop}
                  className="btn-danger w-24 h-12"
                >
                  Stop
                </button>
              </>
            )}
          </div>

          {/* Presets */}
          {!isRunning && (
            <div className="flex justify-center gap-2">
              {presets.map(preset => (
                <button
                  key={preset.seconds}
                  onClick={() => handlePresetClick(preset.seconds)}
                  className={`chip ${duration === preset.seconds ? 'chip-active' : ''}`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          )}

          {/* Custom duration */}
          {!isRunning && (
            <div className="flex items-center justify-center gap-2">
              <label className="text-sm text-gray-600 dark:text-gray-400">Custom:</label>
              <input
                type="number"
                value={Math.floor(duration / 60)}
                onChange={handleCustomDuration}
                className="input w-20 text-center"
                min="1"
                max="60"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">minutes</span>
            </div>
          )}

          {/* Options */}
          <div className="flex items-center justify-center gap-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                className="checkbox"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">Sound</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={roundMode}
                onChange={(e) => setRoundMode(e.target.checked)}
                className="checkbox"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">Round Mode</span>
            </label>

            {roundMode && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={totalRounds}
                  onChange={(e) => setTotalRounds(parseInt(e.target.value) || 1)}
                  className="input w-16 text-center text-sm"
                  min="1"
                  max="20"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">rounds</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
