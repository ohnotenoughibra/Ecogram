import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import api from '../utils/api';

const topics = [
  { value: '', label: 'Any Topic', color: 'bg-gray-500' },
  { value: 'offensive', label: 'Offensive', color: 'bg-red-500' },
  { value: 'defensive', label: 'Defensive', color: 'bg-blue-500' },
  { value: 'control', label: 'Control', color: 'bg-purple-500' },
  { value: 'transition', label: 'Transition', color: 'bg-green-500' },
  { value: 'competition', label: 'Competition', color: 'bg-orange-500' }
];

const positions = [
  { value: '', label: 'Any Position' },
  { value: 'guard', label: 'Guard' },
  { value: 'half-guard', label: 'Half Guard' },
  { value: 'mount', label: 'Mount' },
  { value: 'side-control', label: 'Side Control' },
  { value: 'back', label: 'Back' },
  { value: 'turtle', label: 'Turtle' },
  { value: 'standing', label: 'Standing' }
];

const difficulties = [
  { value: '', label: 'Any Level' },
  { value: 'beginner', label: 'Beginner', desc: 'Fundamental concepts' },
  { value: 'intermediate', label: 'Intermediate', desc: 'Building complexity' },
  { value: 'advanced', label: 'Advanced', desc: 'High-level details' }
];

export default function SmartSessionBuilder({ isOpen, onClose, onSessionCreated }) {
  const navigate = useNavigate();
  const { showToast, fetchSessions, games } = useApp();

  // Constraints
  const [sessionName, setSessionName] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [gameCount, setGameCount] = useState(0); // 0 = auto from duration
  const [useExactGameCount, setUseExactGameCount] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);

  // Calculate preview based on constraints
  const preview = useMemo(() => {
    let count;
    if (useExactGameCount && gameCount > 0) {
      count = gameCount;
    } else {
      count = Math.round(durationMinutes / 8);
    }
    count = Math.min(Math.max(1, count), 15);

    let warmup = 0, cooldown = 0, main = count;
    if (count > 3) {
      warmup = 1;
      main = count - 1;
    }
    if (count > 5) {
      cooldown = 1;
      main = count - 2;
    }

    // Count matching games in library
    let matchingGames = games || [];
    if (selectedTopic) {
      matchingGames = matchingGames.filter(g => g.topic === selectedTopic);
    }
    if (selectedPosition) {
      matchingGames = matchingGames.filter(g => g.position === selectedPosition);
    }
    if (selectedDifficulty) {
      matchingGames = matchingGames.filter(g => g.difficulty === selectedDifficulty);
    }

    return {
      total: count,
      warmup,
      main,
      cooldown,
      estimatedMinutes: count * 8,
      matchingGames: matchingGames.length,
      hasEnoughGames: matchingGames.length >= count
    };
  }, [durationMinutes, gameCount, useExactGameCount, selectedTopic, selectedPosition, selectedDifficulty, games]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const payload = {
        name: sessionName.trim() || undefined,
        topic: selectedTopic || undefined,
        position: selectedPosition || undefined,
        difficulty: selectedDifficulty || undefined
      };

      if (useExactGameCount && gameCount > 0) {
        payload.gameCount = gameCount;
      } else {
        payload.durationMinutes = durationMinutes;
      }

      const response = await api.post('/sessions/smart-build', payload);

      const { session, summary } = response.data;

      await fetchSessions();
      showToast(`Session created: ${summary.total} games (~${summary.estimatedMinutes} min)`, 'success');

      if (onSessionCreated) {
        onSessionCreated(session);
      }

      onClose();
      navigate(`/session/${session._id}`);
    } catch (error) {
      showToast(
        error.response?.data?.message || 'Failed to generate session',
        'error'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 text-primary-500">
                  <path d="M15.98 1.804a1 1 0 00-1.96 0l-.24 1.192a1 1 0 01-.784.785l-1.192.238a1 1 0 000 1.962l1.192.238a1 1 0 01.785.785l.238 1.192a1 1 0 001.962 0l.238-1.192a1 1 0 01.785-.785l1.192-.238a1 1 0 000-1.962l-1.192-.238a1 1 0 01-.785-.785l-.238-1.192zM6.949 5.684a1 1 0 00-1.898 0l-.683 2.051a1 1 0 01-.633.633l-2.051.683a1 1 0 000 1.898l2.051.684a1 1 0 01.633.632l.683 2.051a1 1 0 001.898 0l.683-2.051a1 1 0 01.633-.633l2.051-.683a1 1 0 000-1.898l-2.051-.683a1 1 0 01-.633-.633L6.95 5.684zM13.949 13.684a1 1 0 00-1.898 0l-.184.551a1 1 0 01-.632.633l-.551.183a1 1 0 000 1.898l.551.183a1 1 0 01.633.633l.183.551a1 1 0 001.898 0l.184-.551a1 1 0 01.632-.633l.551-.183a1 1 0 000-1.898l-.551-.184a1 1 0 01-.633-.632l-.183-.551z" />
                </svg>
                Smart Session Builder
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Set your constraints, we'll pick the games
              </p>
            </div>
            <button onClick={onClose} className="btn-icon" title="Close">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>

          {/* Session Name */}
          <div className="mb-4">
            <label className="label">Session Name (optional)</label>
            <input
              type="text"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder="Auto-generated if empty"
              className="input"
            />
          </div>

          {/* Duration / Game Count Toggle */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Session Size</label>
              <button
                onClick={() => setUseExactGameCount(!useExactGameCount)}
                className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
              >
                {useExactGameCount ? 'Use duration instead' : 'Set exact game count'}
              </button>
            </div>

            {useExactGameCount ? (
              <div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={gameCount || 5}
                    onChange={(e) => setGameCount(parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-lg font-bold text-primary-600 dark:text-primary-400 w-16 text-center">
                    {gameCount || 5} games
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  ~{(gameCount || 5) * 8} minutes estimated
                </p>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="15"
                    max="120"
                    step="5"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-lg font-bold text-primary-600 dark:text-primary-400 w-20 text-center">
                    {durationMinutes} min
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  ~{preview.total} games at ~8 min each
                </p>
              </div>
            )}
          </div>

          {/* Filters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            {/* Topic */}
            <div>
              <label className="label text-xs">Focus</label>
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="input py-2 text-sm"
              >
                {topics.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Position */}
            <div>
              <label className="label text-xs">Position</label>
              <select
                value={selectedPosition}
                onChange={(e) => setSelectedPosition(e.target.value)}
                className="input py-2 text-sm"
              >
                {positions.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            {/* Difficulty */}
            <div>
              <label className="label text-xs">Skill Level</label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="input py-2 text-sm"
              >
                {difficulties.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Preview Card */}
          <div className={`mb-6 p-4 rounded-lg border-2 ${
            preview.hasEnoughGames
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                Session Preview
              </h4>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                preview.hasEnoughGames
                  ? 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-300'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-800 dark:text-amber-300'
              }`}>
                {preview.matchingGames} matching games
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2 bg-white dark:bg-gray-800 rounded">
                <p className="text-xl font-bold text-primary-600 dark:text-primary-400">{preview.total}</p>
                <p className="text-[10px] text-gray-500 uppercase">Total</p>
              </div>
              <div className="p-2 bg-white dark:bg-gray-800 rounded">
                <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{preview.warmup}</p>
                <p className="text-[10px] text-gray-500 uppercase">Warmup</p>
              </div>
              <div className="p-2 bg-white dark:bg-gray-800 rounded">
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{preview.main}</p>
                <p className="text-[10px] text-gray-500 uppercase">Main</p>
              </div>
              <div className="p-2 bg-white dark:bg-gray-800 rounded">
                <p className="text-xl font-bold text-cyan-600 dark:text-cyan-400">{preview.cooldown}</p>
                <p className="text-[10px] text-gray-500 uppercase">Cooldown</p>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                  <path fillRule="evenodd" d="M1 8a7 7 0 1114 0A7 7 0 011 8zm7.75-4.25a.75.75 0 00-1.5 0V8c0 .414.336.75.75.75h3.25a.75.75 0 000-1.5h-2.5v-3.5z" clipRule="evenodd" />
                </svg>
                ~{preview.estimatedMinutes} min
              </span>
              {selectedTopic && (
                <span className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${topics.find(t => t.value === selectedTopic)?.color}`} />
                  {topics.find(t => t.value === selectedTopic)?.label}
                </span>
              )}
              {selectedPosition && (
                <span>{positions.find(p => p.value === selectedPosition)?.label}</span>
              )}
              {selectedDifficulty && (
                <span>{difficulties.find(d => d.value === selectedDifficulty)?.label}</span>
              )}
            </div>

            {!preview.hasEnoughGames && (
              <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                Only {preview.matchingGames} games match your filters. Some filters may be relaxed.
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={isGenerating}
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || (games?.length || 0) === 0}
              className="btn-primary flex-1 flex items-center justify-center"
            >
              {isGenerating ? (
                <>
                  <span className="spinner mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2">
                    <path d="M15.98 1.804a1 1 0 00-1.96 0l-.24 1.192a1 1 0 01-.784.785l-1.192.238a1 1 0 000 1.962l1.192.238a1 1 0 01.785.785l.238 1.192a1 1 0 001.962 0l.238-1.192a1 1 0 01.785-.785l1.192-.238a1 1 0 000-1.962l-1.192-.238a1 1 0 01-.785-.785l-.238-1.192zM6.949 5.684a1 1 0 00-1.898 0l-.683 2.051a1 1 0 01-.633.633l-2.051.683a1 1 0 000 1.898l2.051.684a1 1 0 01.633.632l.683 2.051a1 1 0 001.898 0l.683-2.051a1 1 0 01.633-.633l2.051-.683a1 1 0 000-1.898l-2.051-.683a1 1 0 01-.633-.633L6.95 5.684z" />
                  </svg>
                  Build Session
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
