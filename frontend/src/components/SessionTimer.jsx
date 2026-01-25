import { useState, useEffect, useRef, useCallback } from 'react';

const presets = [
  { label: '3m', seconds: 180 },
  { label: '5m', seconds: 300 },
  { label: '10m', seconds: 600 }
];

export default function SessionTimer({ onTimerEnd }) {
  const [duration, setDuration] = useState(300);
  const [timeLeft, setTimeLeft] = useState(300);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  const intervalRef = useRef(null);

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
    if (onTimerEnd) onTimerEnd();
  }, [playSound, onTimerEnd]);

  const handleStart = () => {
    setTimeLeft(duration);
    setIsRunning(true);
    setIsPaused(false);
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
    setTimeLeft(duration);
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
    setShowSettings(false);
  };

  const progress = (timeLeft / duration) * 100;
  const isWarning = timeLeft <= 30 && isRunning;

  return (
    <div className="relative">
      <div className={`card p-4 ${isWarning ? 'border-red-500 dark:border-red-500' : ''}`}>
        {/* Timer Display */}
        <div className="flex items-center gap-4">
          {/* Time and Progress */}
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <span className={`text-3xl font-mono font-bold ${
                isWarning
                  ? 'text-red-500 animate-pulse'
                  : 'text-gray-900 dark:text-white'
              }`}>
                {formatTime(timeLeft)}
              </span>

              {/* Status indicator */}
              {isRunning && !isPaused && (
                <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Running
                </span>
              )}
              {isPaused && (
                <span className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full" />
                  Paused
                </span>
              )}
            </div>

            {/* Progress bar */}
            <div className="mt-2 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ${
                  isWarning ? 'bg-red-500' : 'bg-primary-500'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {!isRunning ? (
              <>
                <button
                  onClick={handleStart}
                  className="btn-primary h-10 px-4"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                </button>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="btn-secondary h-10 px-3"
                  title="Timer settings"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M7.84 1.804A1 1 0 018.82 1h2.36a1 1 0 01.98.804l.331 1.652a6.993 6.993 0 011.929 1.115l1.598-.54a1 1 0 011.186.447l1.18 2.044a1 1 0 01-.205 1.251l-1.267 1.113a7.047 7.047 0 010 2.228l1.267 1.113a1 1 0 01.206 1.25l-1.18 2.045a1 1 0 01-1.187.447l-1.598-.54a6.993 6.993 0 01-1.929 1.115l-.33 1.652a1 1 0 01-.98.804H8.82a1 1 0 01-.98-.804l-.331-1.652a6.993 6.993 0 01-1.929-1.115l-1.598.54a1 1 0 01-1.186-.447l-1.18-2.044a1 1 0 01.205-1.251l1.267-1.114a7.05 7.05 0 010-2.227L1.821 7.773a1 1 0 01-.206-1.25l1.18-2.045a1 1 0 011.187-.447l1.598.54A6.993 6.993 0 017.51 3.456l.33-1.652zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                  </svg>
                </button>
              </>
            ) : isPaused ? (
              <>
                <button
                  onClick={handleResume}
                  className="btn-primary h-10 px-4"
                  title="Resume"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                </button>
                <button
                  onClick={handleStop}
                  className="btn-danger h-10 px-3"
                  title="Stop"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M2 10a8 8 0 1116 0 8 8 0 01-16 0zm5-2.25A.75.75 0 017.75 7h4.5a.75.75 0 01.75.75v4.5a.75.75 0 01-.75.75h-4.5a.75.75 0 01-.75-.75v-4.5z" clipRule="evenodd" />
                  </svg>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handlePause}
                  className="btn-secondary h-10 px-4"
                  title="Pause"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path d="M5.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75A.75.75 0 007.25 3h-1.5zM12.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75a.75.75 0 00-.75-.75h-1.5z" />
                  </svg>
                </button>
                <button
                  onClick={handleStop}
                  className="btn-danger h-10 px-3"
                  title="Stop"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M2 10a8 8 0 1116 0 8 8 0 01-16 0zm5-2.25A.75.75 0 017.75 7h4.5a.75.75 0 01.75.75v4.5a.75.75 0 01-.75.75h-4.5a.75.75 0 01-.75-.75v-4.5z" clipRule="evenodd" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Settings dropdown */}
        {showSettings && !isRunning && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 animate-fade-in">
            <div className="flex items-center justify-between">
              {/* Presets */}
              <div className="flex gap-2">
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

              {/* Custom input */}
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={Math.floor(duration / 60)}
                  onChange={(e) => {
                    const seconds = (parseInt(e.target.value) || 1) * 60;
                    setDuration(seconds);
                    setTimeLeft(seconds);
                  }}
                  className="input w-16 text-center text-sm"
                  min="1"
                  max="60"
                />
                <span className="text-sm text-gray-500">min</span>
              </div>

              {/* Sound toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                  className="checkbox"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">Sound</span>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
