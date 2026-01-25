import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ALL_POSITIONS, POSITIONS, getPositionLabel, POSITION_COLORS } from '../utils/constants';

export default function QuickClassBuilder({ isOpen, onClose, onSessionCreated }) {
  const { games, createSession, showToast } = useApp();
  const [selectedPosition, setSelectedPosition] = useState('');
  const [duration, setDuration] = useState(60); // minutes
  const [creating, setCreating] = useState(false);
  const [preview, setPreview] = useState(null);

  // Get games for selected position - search broadly
  const positionGames = useMemo(() => {
    if (!selectedPosition) return { warmup: [], main: [], cooldown: [] };

    const positionLabel = getPositionLabel(selectedPosition).toLowerCase();
    const positionWords = selectedPosition.split('-').filter(w => w.length > 2);

    const filtered = games.filter(g => {
      // Direct position match
      if (g.position === selectedPosition) return true;

      // Check aiMetadata.startPosition
      if (g.aiMetadata?.startPosition?.toLowerCase().includes(selectedPosition.replace('-', ' '))) return true;
      if (g.aiMetadata?.startPosition?.toLowerCase().includes(positionLabel)) return true;

      // Search in game content for position keywords
      const searchText = `${g.name} ${g.topPlayer || ''} ${g.bottomPlayer || ''} ${g.coaching || ''} ${(g.skills || []).join(' ')}`.toLowerCase();

      // Check for position label or position words
      if (searchText.includes(positionLabel)) return true;
      if (positionWords.some(word => searchText.includes(word))) return true;

      return false;
    });

    return {
      warmup: filtered.filter(g => g.gameType === 'warmup'),
      main: filtered.filter(g => g.gameType === 'main' || !g.gameType),
      cooldown: filtered.filter(g => g.gameType === 'cooldown')
    };
  }, [games, selectedPosition]);

  // Get ALL games as fallback when position-specific games are limited
  const allGamesByType = useMemo(() => {
    return {
      warmup: games.filter(g => g.gameType === 'warmup'),
      main: games.filter(g => g.gameType === 'main' || !g.gameType),
      cooldown: games.filter(g => g.gameType === 'cooldown')
    };
  }, [games]);

  // Calculate suggested class structure
  const suggestedClass = useMemo(() => {
    if (!selectedPosition) return null;

    // Use position-specific games, fallback to all games if not enough
    const getPoolWithFallback = (positionPool, allPool) => {
      if (positionPool.length >= 2) return positionPool;
      // Add all games as fallback, but keep position-specific first
      const combined = [...positionPool];
      allPool.forEach(g => {
        if (!combined.find(c => c._id === g._id)) {
          combined.push(g);
        }
      });
      return combined;
    };

    const allWarmups = getPoolWithFallback(positionGames.warmup, allGamesByType.warmup);
    const allMains = getPoolWithFallback(positionGames.main, allGamesByType.main);
    const allCooldowns = getPoolWithFallback(positionGames.cooldown, allGamesByType.cooldown);

    // Time allocation based on duration
    const warmupTime = Math.floor(duration * 0.15); // 15%
    const mainTime = Math.floor(duration * 0.7);    // 70%
    const cooldownTime = Math.floor(duration * 0.15); // 15%

    // Select games (prioritize position-specific, then related)
    const selectGames = (pool, count) => {
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, count);
    };

    const warmupCount = Math.max(1, Math.floor(warmupTime / 10));
    const mainCount = Math.max(2, Math.floor(mainTime / 15));
    const cooldownCount = Math.max(1, Math.floor(cooldownTime / 10));

    return {
      warmup: selectGames(allWarmups, warmupCount),
      main: selectGames(allMains, mainCount),
      cooldown: selectGames(allCooldowns, cooldownCount),
      warmupTime,
      mainTime,
      cooldownTime,
      totalGames: warmupCount + mainCount + cooldownCount
    };
  }, [selectedPosition, duration, positionGames, allGamesByType]);

  const handleGeneratePreview = () => {
    if (!suggestedClass) return;
    setPreview(suggestedClass);
  };

  const handleCreateSession = async () => {
    if (!preview) return;

    setCreating(true);
    try {
      const allGames = [
        ...preview.warmup,
        ...preview.main,
        ...preview.cooldown
      ];

      const sessionData = {
        name: `${getPositionLabel(selectedPosition)} Training - ${new Date().toLocaleDateString()}`,
        games: allGames.map((g, i) => ({
          game: g._id,
          order: i,
          completed: false
        })),
        duration,
        focusPosition: selectedPosition,
        scheduledDate: new Date()
      };

      const result = await createSession(sessionData);
      if (result.success) {
        showToast(`Class created with ${allGames.length} games!`, 'success');
        onSessionCreated?.();
        onClose();
      }
    } catch (err) {
      showToast('Failed to create session', 'error');
    } finally {
      setCreating(false);
    }
  };

  if (!isOpen) return null;

  const positionTotal = positionGames.warmup.length + positionGames.main.length + positionGames.cooldown.length;
  const allTotal = allGamesByType.warmup.length + allGamesByType.main.length + allGamesByType.cooldown.length;
  const totalAvailable = Math.max(positionTotal, allTotal);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-primary-500">
                  <path fillRule="evenodd" d="M10 1a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 1zM5.05 3.05a.75.75 0 011.06 0l1.062 1.06a.75.75 0 11-1.061 1.062L5.05 4.11a.75.75 0 010-1.06zm9.9 0a.75.75 0 010 1.06l-1.06 1.062a.75.75 0 01-1.062-1.061l1.061-1.06a.75.75 0 011.06 0z" clipRule="evenodd" />
                </svg>
                Quick Class Builder
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Build a class in seconds by position</p>
            </div>
            <button onClick={onClose} className="btn-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-4 overflow-y-auto max-h-[calc(90vh-180px)]">
          {!preview ? (
            <div className="space-y-4">
              {/* Position Selection */}
              <div>
                <label className="label">What position are you working today?</label>
                <select
                  value={selectedPosition}
                  onChange={(e) => setSelectedPosition(e.target.value)}
                  className="input"
                >
                  <option value="">Select a position...</option>
                  <optgroup label="Guard Positions">
                    {POSITIONS.guard.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Top Positions">
                    {POSITIONS.top.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Neutral">
                    {POSITIONS.neutral.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Leg Lock Positions">
                    {POSITIONS.legLocks.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Duration */}
              <div>
                <label className="label">Class Duration</label>
                <div className="flex gap-2">
                  {[45, 60, 90, 120].map(mins => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setDuration(mins)}
                      className={`flex-1 py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all ${
                        duration === mins
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {mins} min
                    </button>
                  ))}
                </div>
              </div>

              {/* Available Games */}
              {selectedPosition && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Games for {getPositionLabel(selectedPosition)}
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded">
                      <p className="text-lg font-bold text-orange-600">{positionGames.warmup.length}</p>
                      <p className="text-xs text-orange-700 dark:text-orange-400">Warmup</p>
                    </div>
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded">
                      <p className="text-lg font-bold text-blue-600">{positionGames.main.length}</p>
                      <p className="text-xs text-blue-700 dark:text-blue-400">Main</p>
                    </div>
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded">
                      <p className="text-lg font-bold text-green-600">{positionGames.cooldown.length}</p>
                      <p className="text-xs text-green-700 dark:text-green-400">Cooldown</p>
                    </div>
                  </div>
                  {positionTotal === 0 && allTotal > 0 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                      No position-specific games found. Will use your full library ({allTotal} games).
                    </p>
                  )}
                  {allTotal === 0 && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                      No games in your library. Add some games first!
                    </p>
                  )}
                </div>
              )}

              {/* Generate Button */}
              <button
                onClick={handleGeneratePreview}
                disabled={!selectedPosition || allTotal === 0}
                className="btn-primary w-full"
              >
                Generate {duration}-Minute Class
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Preview Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {getPositionLabel(selectedPosition)} Class Preview
                  </h3>
                  <p className="text-sm text-gray-500">{duration} minutes • {preview.warmup.length + preview.main.length + preview.cooldown.length} games</p>
                </div>
                <button
                  onClick={() => setPreview(null)}
                  className="text-sm text-primary-600 hover:underline"
                >
                  ← Change
                </button>
              </div>

              {/* Warmup */}
              {preview.warmup.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-orange-600 uppercase mb-2">
                    Warmup ({preview.warmupTime} min)
                  </p>
                  <div className="space-y-1">
                    {preview.warmup.map(game => (
                      <div key={game._id} className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded text-sm">
                        {game.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Main */}
              {preview.main.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-blue-600 uppercase mb-2">
                    Main Training ({preview.mainTime} min)
                  </p>
                  <div className="space-y-1">
                    {preview.main.map(game => (
                      <div key={game._id} className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
                        {game.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cooldown */}
              {preview.cooldown.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-green-600 uppercase mb-2">
                    Cooldown ({preview.cooldownTime} min)
                  </p>
                  <div className="space-y-1">
                    {preview.cooldown.map(game => (
                      <div key={game._id} className="p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm">
                        {game.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleGeneratePreview}
                  className="btn-secondary flex-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1">
                    <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39z" clipRule="evenodd" />
                  </svg>
                  Shuffle
                </button>
                <button
                  onClick={handleCreateSession}
                  disabled={creating}
                  className="btn-primary flex-1"
                >
                  {creating ? (
                    <>
                      <span className="spinner mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                      </svg>
                      Create Session
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
