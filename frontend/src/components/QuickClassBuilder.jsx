import { useState, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { ALL_POSITIONS, POSITIONS, getPositionLabel, POSITION_COLORS } from '../utils/constants';

// Position chains - positions that naturally flow together in training
const POSITION_CHAINS = {
  // Guard positions chain
  'closed-guard': ['half-guard', 'butterfly', 'open-guard', 'mount', 'back-control'],
  'half-guard': ['closed-guard', 'deep-half', 'knee-shield', 'side-control', 'back-control'],
  'butterfly': ['x-guard', 'slx', 'closed-guard', 'standing'],
  'open-guard': ['de-la-riva', 'spider', 'lasso', 'collar-sleeve', 'standing'],
  'de-la-riva': ['berimbolo', 'x-guard', 'back-control', 'single-leg-x'],
  'spider': ['lasso', 'triangle', 'omoplata', 'sweep'],
  'x-guard': ['slx', 'single-leg-x', 'leg-entanglement', 'sweep'],
  'slx': ['x-guard', 'single-leg-x', 'leg-entanglement', 'heel-hook'],
  'single-leg-x': ['ashi-garami', 'outside-ashi', 'heel-hook', '50-50'],
  // Leg lock positions
  'ashi-garami': ['outside-ashi', 'inside-sankaku', '50-50', 'heel-hook', 'knee-bar'],
  'outside-ashi': ['ashi-garami', 'saddle', 'heel-hook', 'knee-bar'],
  'inside-sankaku': ['saddle', 'honey-hole', 'heel-hook', '50-50'],
  '50-50': ['ashi-garami', 'heel-hook', 'back-step', 'leg-drag'],
  // Top positions chain
  'mount': ['s-mount', 'technical-mount', 'back-control', 'armbar', 'cross-collar'],
  'side-control': ['mount', 'knee-on-belly', 'north-south', 'back-control'],
  'knee-on-belly': ['mount', 'side-control', 'armbar', 'back-take'],
  'north-south': ['side-control', 'kimura', 'armbar', 'back-control'],
  'back-control': ['rear-naked-choke', 'armbar', 'mount', 'turtle'],
  // Neutral
  'standing': ['takedown', 'guard-pull', 'clinch', 'wrestling', 'judo'],
  'turtle': ['back-control', 'front-headlock', 'crucifix', 'clock-choke']
};

// Modern grappling meta - techniques that are currently dominant
const META_TECHNIQUES = [
  // Leg locks (Danaher Death Squad influence)
  'heel-hook', 'inside-heel-hook', 'outside-heel-hook', 'knee-bar', 'toe-hold',
  'ashi-garami', 'saddle', 'honey-hole', 'inside-sankaku', '50-50', 'outside-ashi',
  // Modern guard systems
  'k-guard', 'z-guard', 'reverse-de-la-riva', 'matrix', 'mirroring', 'body-lock',
  // Wrestling integration
  'front-headlock', 'guillotine', 'darce', 'anaconda', 'arm-in-guillotine',
  'single-leg', 'double-leg', 'body-lock-takedown', 'snap-down',
  // Back attacks
  'body-triangle', 'rear-naked-choke', 'short-choke', 'arm-trap',
  // Modern passing
  'body-lock-pass', 'over-under', 'leg-drag', 'knee-cut', 'smash-pass',
  // Submission chains
  'armbar', 'triangle', 'kimura', 'omoplata', 'straight-ankle'
];

export default function QuickClassBuilder({ isOpen, onClose, onSessionCreated }) {
  const { games, createSession, showToast } = useApp();
  const [selectedPosition, setSelectedPosition] = useState('');
  const [duration, setDuration] = useState(60); // minutes
  const [creating, setCreating] = useState(false);
  const [preview, setPreview] = useState(null);

  // Track recently suggested games to ensure variety
  const recentlyUsed = useRef(new Set());

  // Get games for selected position - search broadly
  const positionGames = useMemo(() => {
    if (!selectedPosition) return { warmup: [], main: [], cooldown: [] };

    const positionLabel = getPositionLabel(selectedPosition).toLowerCase();
    const positionWords = selectedPosition.split('-').filter(w => w.length > 1);

    const filtered = games.filter(g => {
      // Direct position match
      if (g.position === selectedPosition) return true;

      // Check aiMetadata.startPosition
      const aiPosition = g.aiMetadata?.startPosition?.toLowerCase() || '';
      if (aiPosition.includes(selectedPosition.replace(/-/g, ' '))) return true;
      if (aiPosition.includes(positionLabel)) return true;

      // Search in ALL game content for position keywords
      const searchText = [
        g.name || '',
        g.topPlayer || '',
        g.bottomPlayer || '',
        g.coaching || '',
        ...(g.skills || []),
        ...(g.techniques || []),
        g.aiMetadata?.description || ''
      ].join(' ').toLowerCase();

      // Check for position label (e.g. "half guard", "closed guard")
      if (searchText.includes(positionLabel)) return true;

      // Check for any position word (e.g. "guard", "mount", "half")
      if (positionWords.some(word => searchText.includes(word))) return true;

      return false;
    });

    return {
      warmup: filtered.filter(g => g.gameType === 'warmup'),
      main: filtered.filter(g => g.gameType === 'main' || !g.gameType),
      cooldown: filtered.filter(g => g.gameType === 'cooldown')
    };
  }, [games, selectedPosition]);

  // Get ALL games categorized by type AND by training area for balanced classes
  const allGamesByType = useMemo(() => {
    return {
      warmup: games.filter(g => g.gameType === 'warmup'),
      main: games.filter(g => g.gameType === 'main' || !g.gameType),
      cooldown: games.filter(g => g.gameType === 'cooldown')
    };
  }, [games]);

  // Categorize games by training area for balanced class building
  const gamesByArea = useMemo(() => {
    const categorize = (game) => {
      const searchText = [
        game.name || '',
        game.topPlayer || '',
        game.bottomPlayer || '',
        game.coaching || '',
        game.topic || '',
        ...(game.skills || []),
        ...(game.techniques || []),
        game.position || '',
        game.aiMetadata?.startPosition || '',
        game.aiMetadata?.description || ''
      ].join(' ').toLowerCase();

      // Standing / Takedowns
      if (searchText.match(/standing|takedown|wrestling|clinch|single.?leg|double.?leg|snap.?down|arm.?drag|judo|throw/)) {
        return 'standing';
      }
      // Passing
      if (searchText.match(/pass|passing|torreando|knee.?cut|smash|over.?under|leg.?drag|stack|body.?lock.?pass/)) {
        return 'passing';
      }
      // Pinning / Control
      if (searchText.match(/mount|side.?control|north.?south|knee.?on|pin|control|pressure|back.?control|crossface/)) {
        return 'pinning';
      }
      // Submissions
      if (searchText.match(/submit|submission|armbar|triangle|kimura|choke|heel.?hook|knee.?bar|guillotine|rnc|strangle|tap|ankle|toe.?hold/)) {
        return 'submitting';
      }
      // Guard / Defensive
      if (searchText.match(/guard|sweep|retain|escape|defensive|recover/)) {
        return 'guard';
      }
      // Default - check topic
      if (game.topic === 'offensive') return 'submitting';
      if (game.topic === 'control') return 'pinning';
      if (game.topic === 'transition') return 'passing';
      if (game.topic === 'defensive') return 'guard';

      return 'general';
    };

    const areas = {
      standing: [],
      passing: [],
      pinning: [],
      submitting: [],
      guard: [],
      general: []
    };

    games.forEach(g => {
      const area = categorize(g);
      areas[area].push(g);
    });

    return areas;
  }, [games]);

  // Score a game's relevance to the selected position (higher = more relevant)
  const scoreGameRelevance = (game, position) => {
    let score = 0;
    const positionLabel = getPositionLabel(position).toLowerCase();
    const positionWords = position.split('-').filter(w => w.length > 1);
    const relatedPositions = POSITION_CHAINS[position] || [];

    const searchText = [
      game.name || '',
      game.topPlayer || '',
      game.bottomPlayer || '',
      game.coaching || '',
      ...(game.skills || []),
      ...(game.techniques || []),
      game.position || '',
      game.aiMetadata?.startPosition || '',
      game.aiMetadata?.description || ''
    ].join(' ').toLowerCase();

    // Direct position match = highest score
    if (game.position === position) score += 100;
    if (searchText.includes(positionLabel)) score += 80;

    // Position word matches
    positionWords.forEach(word => {
      if (searchText.includes(word)) score += 30;
    });

    // Related position matches (position chains)
    relatedPositions.forEach(relPos => {
      if (searchText.includes(relPos.replace(/-/g, ' '))) score += 40;
      if (searchText.includes(relPos.replace(/-/g, ''))) score += 35;
    });

    // Meta technique bonus - games with modern techniques score higher
    META_TECHNIQUES.forEach(tech => {
      if (searchText.includes(tech.replace(/-/g, ' ')) || searchText.includes(tech.replace(/-/g, ''))) {
        score += 15;
      }
    });

    // Penalty for recently used (ensures variety)
    if (recentlyUsed.current.has(game._id)) {
      score -= 50;
    }

    // Small random factor to ensure variety even with equal scores
    score += Math.random() * 20;

    return score;
  };

  // Get games sorted by relevance to position
  const getRelevantGames = (pool, position, count, exclude = []) => {
    const available = pool.filter(g => !exclude.find(e => e._id === g._id));

    // Score all games
    const scored = available.map(g => ({
      game: g,
      score: scoreGameRelevance(g, position)
    }));

    // Sort by score (highest first) with some randomization in the top tier
    scored.sort((a, b) => b.score - a.score);

    // Take top candidates (more than needed) and randomly select from them
    const topCandidates = scored.slice(0, Math.min(count * 3, scored.length));
    const shuffled = [...topCandidates].sort(() => Math.random() - 0.5);

    return shuffled.slice(0, count).map(s => s.game);
  };

  // Generate class structure - called fresh each time (for shuffle to work)
  const generateClass = () => {
    if (!selectedPosition || games.length === 0) return null;

    // Pick multiple games from pool, avoiding duplicates (simple version for warmup/cooldown)
    const pickMultiple = (pool, count, exclude = []) => {
      const available = pool.filter(g => !exclude.find(e => e._id === g._id));
      const shuffled = [...available].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, count);
    };

    // Time allocation based on duration
    const warmupTime = Math.floor(duration * 0.15); // 15%
    const mainTime = Math.floor(duration * 0.7);    // 70%
    const cooldownTime = Math.floor(duration * 0.15); // 15%

    // Build BALANCED main training section with position awareness
    const mainGames = [];
    const relatedPositions = POSITION_CHAINS[selectedPosition] || [];

    // 1. Add position-specific games first using smart relevance scoring
    const positionRelevantGames = getRelevantGames(
      [...positionGames.main, ...allGamesByType.main],
      selectedPosition,
      3,
      mainGames
    );
    mainGames.push(...positionRelevantGames);

    // 2. Add games from related positions (position chain)
    if (relatedPositions.length > 0) {
      const relatedPool = allGamesByType.main.filter(g => {
        const gameText = [
          g.name || '',
          g.position || '',
          ...(g.techniques || []),
          g.aiMetadata?.startPosition || ''
        ].join(' ').toLowerCase();

        return relatedPositions.some(rp =>
          gameText.includes(rp.replace(/-/g, ' ')) ||
          gameText.includes(rp.replace(/-/g, ''))
        );
      });

      if (relatedPool.length > 0) {
        const relatedGames = getRelevantGames(relatedPool, selectedPosition, 2, mainGames);
        mainGames.push(...relatedGames);
      }
    }

    // 3. Build balanced class: Standing -> Passing -> Pinning -> Submitting
    const areas = ['standing', 'passing', 'pinning', 'submitting'];
    const gamesPerArea = Math.max(1, Math.floor((duration - 20) / 25));

    areas.forEach(area => {
      // Check if we already have games from this area
      const existingInArea = mainGames.filter(g =>
        gamesByArea[area].find(ag => ag._id === g._id)
      ).length;

      // Only add if we don't have enough from this area
      if (existingInArea < gamesPerArea && gamesByArea[area].length > 0) {
        const needed = gamesPerArea - existingInArea;
        const areaGames = getRelevantGames(gamesByArea[area], selectedPosition, needed, mainGames);
        mainGames.push(...areaGames);
      }
    });

    // 4. If still need more games, add from guard and general pools
    const targetMainCount = Math.max(4, Math.floor(mainTime / 10));
    if (mainGames.length < targetMainCount) {
      const guardAndGeneral = [...gamesByArea.guard, ...gamesByArea.general];
      if (guardAndGeneral.length > 0) {
        const moreGames = getRelevantGames(
          guardAndGeneral,
          selectedPosition,
          targetMainCount - mainGames.length,
          mainGames
        );
        mainGames.push(...moreGames);
      }
    }

    // 5. If STILL not enough, add any remaining main games from full library
    if (mainGames.length < 2 && allGamesByType.main.length > 0) {
      const fallbackGames = pickMultiple(allGamesByType.main, Math.max(3, targetMainCount), mainGames);
      mainGames.push(...fallbackGames);
    }

    // Get warmup and cooldown - also position-aware
    const warmupCount = Math.max(1, Math.floor(warmupTime / 10));
    const cooldownCount = Math.max(1, Math.floor(cooldownTime / 10));
    const warmupGames = allGamesByType.warmup.length > 0
      ? getRelevantGames(allGamesByType.warmup, selectedPosition, warmupCount, [])
      : [];
    const cooldownGames = pickMultiple(allGamesByType.cooldown, cooldownCount, []);

    // Track these games as recently used for variety next time
    [...warmupGames, ...mainGames, ...cooldownGames].forEach(g => {
      recentlyUsed.current.add(g._id);
    });

    // Clear old entries if set gets too large (keep last 50)
    if (recentlyUsed.current.size > 50) {
      const entries = Array.from(recentlyUsed.current);
      recentlyUsed.current = new Set(entries.slice(-30));
    }

    return {
      warmup: warmupGames,
      main: mainGames,
      cooldown: cooldownGames,
      warmupTime,
      mainTime,
      cooldownTime,
      totalGames: warmupGames.length + mainGames.length + cooldownGames.length,
      areas: {
        standing: mainGames.filter(g => gamesByArea.standing.find(sg => sg._id === g._id)).length,
        passing: mainGames.filter(g => gamesByArea.passing.find(sg => sg._id === g._id)).length,
        pinning: mainGames.filter(g => gamesByArea.pinning.find(sg => sg._id === g._id)).length,
        submitting: mainGames.filter(g => gamesByArea.submitting.find(sg => sg._id === g._id)).length,
      },
      // Include meta info for display
      positionChain: relatedPositions.slice(0, 4)
    };
  };

  const handleGeneratePreview = () => {
    const newClass = generateClass();
    if (newClass && newClass.main.length > 0) {
      setPreview(newClass);
    } else if (games.length === 0) {
      showToast('No games in your library. Add some games first!', 'error');
    } else {
      showToast('Could not generate class. Try a different position.', 'error');
    }
  };

  const handleShuffle = () => {
    // Clear recently used to get completely fresh suggestions
    recentlyUsed.current.clear();
    const newClass = generateClass();
    if (newClass) {
      setPreview(newClass);
      showToast('Fresh class generated!', 'success');
    }
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

      // Backend expects gameIds (array of IDs), not games (array of objects)
      const sessionData = {
        name: `${getPositionLabel(selectedPosition)} Training - ${new Date().toLocaleDateString()}`,
        gameIds: allGames.map(g => g._id),
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
            <button onClick={onClose} className="btn-icon" title="Close">
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

              {/* Position Flow - shows related positions */}
              {preview.positionChain && preview.positionChain.length > 0 && (
                <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                  <p className="text-xs text-primary-600 dark:text-primary-400 mb-1.5">Position Flow</p>
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-xs font-medium text-primary-700 dark:text-primary-300 bg-primary-100 dark:bg-primary-800/50 px-2 py-0.5 rounded">
                      {getPositionLabel(selectedPosition)}
                    </span>
                    <span className="text-primary-400">→</span>
                    {preview.positionChain.map((pos, i) => (
                      <span key={pos} className="text-xs text-primary-600 dark:text-primary-400">
                        {pos.replace(/-/g, ' ')}{i < preview.positionChain.length - 1 ? ' · ' : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Balance Indicator */}
              {preview.areas && (
                <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-500 mb-2">Class Balance</p>
                  <div className="flex gap-1">
                    <div className={`flex-1 text-center p-1.5 rounded text-xs ${preview.areas.standing > 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-700'}`}>
                      Standing {preview.areas.standing > 0 && `(${preview.areas.standing})`}
                    </div>
                    <div className={`flex-1 text-center p-1.5 rounded text-xs ${preview.areas.passing > 0 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-700'}`}>
                      Passing {preview.areas.passing > 0 && `(${preview.areas.passing})`}
                    </div>
                    <div className={`flex-1 text-center p-1.5 rounded text-xs ${preview.areas.pinning > 0 ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-700'}`}>
                      Pinning {preview.areas.pinning > 0 && `(${preview.areas.pinning})`}
                    </div>
                    <div className={`flex-1 text-center p-1.5 rounded text-xs ${preview.areas.submitting > 0 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-700'}`}>
                      Subs {preview.areas.submitting > 0 && `(${preview.areas.submitting})`}
                    </div>
                  </div>
                </div>
              )}

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
                  onClick={handleShuffle}
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
