import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { getPositionLabel } from '../utils/constants';
import api from '../utils/api';

// Topics with descriptions based on CLA (Constraints-Led Approach) principles
const topicInfo = {
  offensive: {
    label: 'Offensive',
    color: 'bg-red-500',
    lightColor: 'bg-red-100 dark:bg-red-900/30',
    textColor: 'text-red-600 dark:text-red-400',
    icon: '⚔️',
    description: 'Submissions, attacks, finishing sequences',
    claFocus: 'Action-oriented constraints that encourage attacking behavior'
  },
  defensive: {
    label: 'Defensive',
    color: 'bg-blue-500',
    lightColor: 'bg-blue-100 dark:bg-blue-900/30',
    textColor: 'text-blue-600 dark:text-blue-400',
    icon: '🛡️',
    description: 'Escapes, survival, defensive postures',
    claFocus: 'Recovery and escape constraints under pressure'
  },
  control: {
    label: 'Control',
    color: 'bg-purple-500',
    lightColor: 'bg-purple-100 dark:bg-purple-900/30',
    textColor: 'text-purple-600 dark:text-purple-400',
    icon: '🎯',
    description: 'Pins, pressure, position maintenance',
    claFocus: 'Stability constraints and positional dominance'
  },
  transition: {
    label: 'Transition',
    color: 'bg-green-500',
    lightColor: 'bg-green-100 dark:bg-green-900/30',
    textColor: 'text-green-600 dark:text-green-400',
    icon: '🔄',
    description: 'Scrambles, movement chains, flow',
    claFocus: 'Dynamic constraints promoting adaptability'
  }
};

// Position categories for analysis
const POSITION_CATEGORIES = {
  guard: ['closed-guard', 'half-guard', 'butterfly', 'open-guard', 'de-la-riva', 'spider', 'lasso', 'x-guard', 'slx', 'deep-half', 'rubber-guard', 'z-guard', 'k-guard'],
  top: ['mount', 'side-control', 'knee-on-belly', 'north-south', 'back-control', 'crucifix'],
  standing: ['standing', 'clinch', 'wrestling'],
  legLocks: ['ashi-garami', 'outside-ashi', 'inside-sankaku', '50-50', 'saddle', 'single-leg-x']
};

// Modern grappling meta - techniques/positions currently dominant
const META_TECHNIQUES = {
  legLocks: ['heel hook', 'inside heel hook', 'outside heel hook', 'knee bar', 'toe hold', 'ashi garami', 'saddle', 'honey hole', 'inside sankaku', '50-50', 'outside ashi', 'backside 50-50'],
  modernGuards: ['k-guard', 'matrix', 'reverse de la riva', 'squid guard', 'collar sleeve', 'body lock guard'],
  wrestling: ['front headlock', 'guillotine', 'darce', 'anaconda', 'arm-in guillotine', 'single leg', 'double leg', 'body lock takedown', 'snap down', 'duck under', 'arm drag'],
  backAttacks: ['body triangle', 'rear naked choke', 'short choke', 'arm trap', 'straight jacket'],
  modernPassing: ['body lock pass', 'over under', 'leg drag', 'knee cut', 'smash pass', 'float pass', 'long step'],
  submissions: ['armbar', 'triangle', 'kimura', 'omoplata', 'straight ankle', 'calf slicer', 'neck crank']
};

// Dynamic game suggestion templates based on position + topic combinations
const SUGGESTION_TEMPLATES = {
  // Guard positions
  'guard-offensive': [
    { name: 'Sweep or Submit', desc: 'From guard, must either sweep or submit within time limit', constraint: 'No stalling, constant attacks' },
    { name: 'Guard Attack Chain', desc: 'String 3 attack attempts together before resetting', constraint: 'Must flow between attacks' },
    { name: 'Triangle Hunter', desc: 'Only triangle variations allowed from guard', constraint: 'Work entries from different angles' }
  ],
  'guard-defensive': [
    { name: 'Guard Retention Battle', desc: 'Retain guard against aggressive passing for set time', constraint: 'Must recover within 3 seconds of pass' },
    { name: 'Submission Defense', desc: 'Defend submissions from guard without conceding position', constraint: 'Partner attacks, you survive' }
  ],
  'guard-control': [
    { name: 'Guard Lock', desc: 'Control partner in closed guard, prevent any escape attempts', constraint: 'Points for time in control' },
    { name: 'Frame Master', desc: 'Maintain frames and distance in open guard', constraint: 'No gripping allowed' }
  ],
  'guard-transition': [
    { name: 'Guard Flow', desc: 'Cycle through 5 different guard types without reset', constraint: 'Continuous movement required' },
    { name: 'Sweep to Pass', desc: 'Sweep from guard then immediately pass their guard', constraint: 'Full sequence required' }
  ],

  // Top positions
  'top-offensive': [
    { name: 'Submission Hunt', desc: 'From top position, score points only for submission attempts', constraint: 'Must attack within 10 seconds' },
    { name: 'Mounted Finisher', desc: 'Work submissions from mount progressively', constraint: 'Armbar → Triangle → Choke chain' }
  ],
  'top-control': [
    { name: 'Pin to Win', desc: 'Score points only for maintaining positions (3 sec = 1 pt)', constraint: 'No submissions, position focus' },
    { name: 'Position Ladder', desc: 'Progress through positions: side control → mount → back', constraint: 'Must control 3 sec before advancing' },
    { name: 'Pressure Cooker', desc: 'Top player maintains heavy pressure, bottom tries to create space', constraint: 'Focus on weight distribution' }
  ],
  'top-defensive': [
    { name: 'Recover from Scramble', desc: 'When position is threatened, recover to dominant position', constraint: 'No giving up position completely' }
  ],
  'top-transition': [
    { name: 'Position Cycling', desc: 'Flow between all top positions without losing control', constraint: 'Constant transitions' },
    { name: 'Pass to Submit', desc: 'Pass guard directly into submission attempt', constraint: 'No settling in position' }
  ],

  // Standing
  'standing-offensive': [
    { name: 'Takedown Only', desc: 'First to takedown wins, reset after each', constraint: 'No pulling guard' },
    { name: 'Chain Wrestling', desc: 'String 3 takedown attempts together', constraint: 'Continuous attacks required' }
  ],
  'standing-defensive': [
    { name: 'Sprawl Master', desc: 'Defend all takedowns for set time', constraint: 'Must sprawl or counter' },
    { name: 'Underhook Battle', desc: 'Maintain defensive underhook against offense', constraint: 'Position over takedown' }
  ],
  'standing-control': [
    { name: 'Clinch Control', desc: 'Maintain dominant clinch position for time', constraint: 'Score for clinch dominance' },
    { name: 'Wall Work', desc: 'Control partner against wall/cage', constraint: 'Positioning focus' }
  ],
  'standing-transition': [
    { name: 'Level Change Game', desc: 'Work level changes and shots without completing takedowns', constraint: 'Focus on movement' },
    { name: 'Takedown to Pass', desc: 'Complete takedown directly into guard pass', constraint: 'No pause between' }
  ],

  // Leg locks
  'legLocks-offensive': [
    { name: 'Leg Lock Hunt', desc: 'Enter leg entanglement and attack submissions', constraint: 'Must attempt finish within 15 sec' },
    { name: 'Heel Hook Chain', desc: 'Work inside/outside heel hook transitions', constraint: 'Flow between positions' },
    { name: 'Ashi Entry Drill', desc: 'Multiple entries into ashi garami from different positions', constraint: 'Focus on clean entries' }
  ],
  'legLocks-defensive': [
    { name: 'Leg Lock Escape', desc: 'Escape from various leg entanglements safely', constraint: 'No submissions, escape only' },
    { name: 'Boot Defense', desc: 'Defend heel hooks using boot and rotation', constraint: 'Technical escape required' }
  ],
  'legLocks-control': [
    { name: 'Position Before Submission', desc: 'Establish and maintain leg entanglement control', constraint: 'Control 5 sec before attacking' },
    { name: 'Saddle Lock', desc: 'Maintain inside sankaku/saddle position', constraint: 'Points for time in position' }
  ],
  'legLocks-transition': [
    { name: 'Leg Lock Flow', desc: 'Transition between all leg lock positions', constraint: '50-50 → Ashi → Saddle cycle' },
    { name: 'Guard to Legs', desc: 'Enter leg entanglements from various guards', constraint: 'Work different entries' }
  ]
};

// Helper to get the best topic for a position category
const getTopicForSuggestion = (positionCategory, weakestTopic) => {
  return weakestTopic || 'offensive';
};

export default function SkillBalance({ showSuggestions = true, compact = false }) {
  const { games } = useApp();
  const [topicCounts, setTopicCounts] = useState({});
  const [weakestTopic, setWeakestTopic] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // AI-powered suggestions state
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsSource, setSuggestionsSource] = useState('');
  const excludedIds = useRef(new Set()); // Track shown suggestions to never repeat
  const hasFetchedInitial = useRef(false);

  // Analyze games by position category
  const positionAnalysis = useMemo(() => {
    const analysis = {
      guard: { count: 0, games: [] },
      top: { count: 0, games: [] },
      standing: { count: 0, games: [] },
      legLocks: { count: 0, games: [] }
    };

    games.forEach(game => {
      const gameText = [
        game.name || '',
        game.position || '',
        game.topPlayer || '',
        game.bottomPlayer || '',
        ...(game.techniques || []),
        game.aiMetadata?.startPosition || '',
        game.aiMetadata?.description || ''
      ].join(' ').toLowerCase();

      // Check each position category
      Object.entries(POSITION_CATEGORIES).forEach(([category, positions]) => {
        const hasPosition = positions.some(pos =>
          gameText.includes(pos.replace(/-/g, ' ')) ||
          gameText.includes(pos.replace(/-/g, '')) ||
          game.position === pos
        );
        if (hasPosition) {
          analysis[category].count++;
          analysis[category].games.push(game);
        }
      });
    });

    // Find weakest position category
    const entries = Object.entries(analysis);
    const weakestPosition = entries.reduce((min, [cat, data]) =>
      data.count < min.count ? { category: cat, count: data.count } : min
    , { category: entries[0][0], count: entries[0][1].count });

    return { ...analysis, weakestPosition };
  }, [games]);

  // Check for meta technique coverage
  const metaCoverage = useMemo(() => {
    const coverage = {};
    Object.entries(META_TECHNIQUES).forEach(([category, techniques]) => {
      const found = techniques.filter(tech => {
        return games.some(game => {
          const gameText = [
            game.name || '',
            game.topPlayer || '',
            game.bottomPlayer || '',
            ...(game.techniques || []),
            game.aiMetadata?.description || ''
          ].join(' ').toLowerCase();
          return gameText.includes(tech.toLowerCase());
        });
      });
      coverage[category] = {
        total: techniques.length,
        covered: found.length,
        missing: techniques.filter(t => !found.includes(t))
      };
    });
    return coverage;
  }, [games]);

  // Fetch AI-powered suggestions from backend
  const fetchAiSuggestions = useCallback(async () => {
    if (games.length === 0) return;

    setSuggestionsLoading(true);
    try {
      const response = await api.post('/ai/smart-suggestions', {
        excludeIds: Array.from(excludedIds.current)
      });

      const { suggestions, source } = response.data;
      setSuggestionsSource(source);

      // Transform suggestions to match component format
      const formattedSuggestions = suggestions.map((s, i) => {
        // Generate a unique ID for tracking
        const suggestionId = `${s.name}-${Date.now()}-${i}`;
        excludedIds.current.add(suggestionId);

        return {
          id: suggestionId,
          name: s.name,
          description: s.description,
          prompt: s.prompt,
          constraints: s.prompt?.substring(0, 100) || s.description,
          category: s.position || 'various',
          topic: s.topic || 'transition',
          type: s.type || 'gap',
          reasoning: s.reasoning,
          basedOn: s.basedOn
        };
      });

      setAiSuggestions(formattedSuggestions);
    } catch (err) {
      console.error('Failed to fetch AI suggestions:', err);
      // Fall back to local suggestions on error
      setAiSuggestions(generateLocalFallback());
      setSuggestionsSource('local-fallback');
    } finally {
      setSuggestionsLoading(false);
    }
  }, [games]);

  // Generate local fallback suggestions
  const generateLocalFallback = () => {
    const weakPos = positionAnalysis.weakestPosition?.category || 'guard';
    const topic = weakestTopic || 'offensive';
    const templateKey = `${weakPos}-${topic}`;
    const templates = SUGGESTION_TEMPLATES[templateKey] || SUGGESTION_TEMPLATES[`${weakPos}-offensive`] || [];

    return templates.slice(0, 3).map((t, i) => ({
      id: `fallback-${Date.now()}-${i}`,
      name: t.name,
      description: t.desc,
      prompt: `${t.name}: ${t.desc}. Constraint: ${t.constraint}`,
      constraints: t.constraint,
      category: weakPos,
      topic: topic,
      type: 'position'
    }));
  };

  // Fetch suggestions on mount (once) and when games change significantly
  useEffect(() => {
    if (showSuggestions && games.length > 0 && !hasFetchedInitial.current) {
      hasFetchedInitial.current = true;
      fetchAiSuggestions();
    }
  }, [games.length, showSuggestions, fetchAiSuggestions]);

  const handleRefreshSuggestions = useCallback(() => {
    fetchAiSuggestions();
  }, [fetchAiSuggestions]);

  useEffect(() => {
    // Count games by topic
    const counts = { offensive: 0, defensive: 0, control: 0, transition: 0 };
    games.forEach(game => {
      if (game.topic && counts.hasOwnProperty(game.topic)) {
        counts[game.topic]++;
      }
    });
    setTopicCounts(counts);

    // Find weakest topic
    const entries = Object.entries(counts);
    if (entries.length > 0) {
      const weakest = entries.reduce((min, [topic, count]) =>
        count < min.count ? { topic, count } : min
      , { topic: entries[0][0], count: entries[0][1] });
      setWeakestTopic(weakest.topic);
    }
  }, [games]);

  const totalGames = Object.values(topicCounts).reduce((a, b) => a + b, 0);
  const maxCount = Math.max(...Object.values(topicCounts), 1);

  // Calculate balance score (0-100, 100 being perfectly balanced)
  const average = totalGames / 4;
  const variance = Object.values(topicCounts).reduce((sum, count) =>
    sum + Math.pow(count - average, 2), 0) / 4;
  const balanceScore = Math.max(0, 100 - Math.sqrt(variance) * 10);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          {Object.entries(topicInfo).map(([key, info]) => (
            <div
              key={key}
              className={`w-2 h-8 rounded-full ${info.color}`}
              style={{
                opacity: topicCounts[key] ? Math.max(0.3, topicCounts[key] / maxCount) : 0.2
              }}
              title={`${info.label}: ${topicCounts[key] || 0} games`}
            />
          ))}
        </div>
        <span className="text-xs text-gray-500">
          {Math.round(balanceScore)}% balanced
        </span>
      </div>
    );
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-primary-500">
            <path fillRule="evenodd" d="M10 2a.75.75 0 01.75.75v.258a33.186 33.186 0 016.668.83.75.75 0 01-.336 1.461 31.28 31.28 0 00-1.103-.232l1.702 7.545a.75.75 0 01-.387.832A4.981 4.981 0 0115 14c-.825 0-1.606-.2-2.294-.556a.75.75 0 01-.387-.832l1.77-7.849a31.743 31.743 0 00-3.339-.254v11.505l6.418 1.069a.75.75 0 11-.246 1.48l-6.172-1.029a.75.75 0 01-.378-.146l-.016.006-.016-.006a.75.75 0 01-.378.146l-6.172 1.03a.75.75 0 01-.246-1.481L10 16.014V5.509a31.743 31.743 0 00-3.339.254l1.77 7.85a.75.75 0 01-.387.83A4.981 4.981 0 015 14c-.825 0-1.606-.2-2.294-.556a.75.75 0 01-.387-.832l1.702-7.545a31.28 31.28 0 00-1.103.232.75.75 0 11-.336-1.462 33.186 33.186 0 016.668-.829V2.75A.75.75 0 0110 2zM5 12.758l-1.145-5.072a29.411 29.411 0 012.29 0L5 12.758zm10 0l-1.145-5.072a29.411 29.411 0 012.29 0L15 12.758z" clipRule="evenodd" />
          </svg>
          Training Balance
        </h3>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
        >
          {showDetails ? 'Hide details' : 'Show details'}
        </button>
      </div>

      {/* Balance meter */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600 dark:text-gray-400">Balance Score</span>
          <span className={`font-medium ${
            balanceScore >= 70 ? 'text-green-600' :
            balanceScore >= 40 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {Math.round(balanceScore)}%
          </span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              balanceScore >= 70 ? 'bg-green-500' :
              balanceScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${balanceScore}%` }}
          />
        </div>
      </div>

      {/* Topic bars */}
      <div className="space-y-3">
        {Object.entries(topicInfo).map(([key, info]) => {
          const count = topicCounts[key] || 0;
          const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
          const isWeakest = key === weakestTopic && totalGames > 0;

          return (
            <div key={key}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="flex items-center gap-2">
                  <span>{info.icon}</span>
                  <span className={`font-medium ${info.textColor}`}>{info.label}</span>
                  {isWeakest && (
                    <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded">
                      Needs focus
                    </span>
                  )}
                </span>
                <span className="text-gray-500">{count} games</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${info.color} rounded-full transition-all duration-700 ease-out`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Details section */}
      {showDetails && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 animate-fade-in">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            <strong>Constraints-Led Approach:</strong> A balanced training library helps develop
            well-rounded grappling skills. Each topic targets different aspects of your game.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(topicInfo).map(([key, info]) => (
              <div key={key} className={`p-2 rounded-lg ${info.lightColor}`}>
                <p className={`text-xs font-medium ${info.textColor}`}>{info.label}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">{info.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI-powered suggestions */}
      {showSuggestions && totalGames > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <span>💡</span>
              Suggested Games to Add
              {suggestionsSource === 'claude' && (
                <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded font-normal">
                  AI
                </span>
              )}
            </h4>
            <button
              onClick={handleRefreshSuggestions}
              disabled={suggestionsLoading}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              title="Get fresh AI suggestions"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className={`w-4 h-4 text-gray-500 ${suggestionsLoading ? 'animate-spin' : ''}`}
              >
                <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0v2.43l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Position/Meta coverage insight */}
          <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="text-gray-500">Library gaps:</span>
              {positionAnalysis.weakestPosition.count < 3 && (
                <span className="px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded">
                  {positionAnalysis.weakestPosition.category} ({positionAnalysis.weakestPosition.count})
                </span>
              )}
              {weakestTopic && topicCounts[weakestTopic] < 3 && (
                <span className={`px-1.5 py-0.5 rounded ${topicInfo[weakestTopic].lightColor} ${topicInfo[weakestTopic].textColor}`}>
                  {topicInfo[weakestTopic].label} ({topicCounts[weakestTopic]})
                </span>
              )}
              {Object.entries(metaCoverage).filter(([_, d]) => d.covered === 0).slice(0, 2).map(([cat]) => (
                <span key={cat} className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded">
                  {cat.replace(/([A-Z])/g, ' $1').trim()}
                </span>
              ))}
            </div>
          </div>

          {/* Loading state */}
          {suggestionsLoading && aiSuggestions.length === 0 && (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-1" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                </div>
              ))}
            </div>
          )}

          {/* Suggestions */}
          {aiSuggestions.length > 0 && (
            <div className="space-y-2">
              {aiSuggestions.map((suggestion) => (
                <AiGameSuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  onAddedToLibrary={() => {
                    // Mark as added and potentially refresh
                    excludedIds.current.add(suggestion.name.toLowerCase());
                  }}
                />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!suggestionsLoading && aiSuggestions.length === 0 && (
            <div className="text-center py-4 text-sm text-gray-500">
              <p>Click refresh to get AI-powered suggestions</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Game suggestion card component with AI generation
function GameSuggestionCard({ suggestion, topic }) {
  const { createGame, showToast, fetchGames } = useApp();
  const info = topicInfo[topic];
  const [generating, setGenerating] = useState(false);
  const [generatedGame, setGeneratedGame] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [adding, setAdding] = useState(false);

  const generateGame = async () => {
    setGenerating(true);
    try {
      const prompt = `${suggestion.name}: ${suggestion.description}. Key constraint: ${suggestion.constraints}`;
      const response = await api.post('/ai/generate', { prompt });
      const game = {
        ...response.data.game,
        topic: topic // Ensure correct topic
      };
      setGeneratedGame(game);
      setShowPreview(true);
    } catch (err) {
      showToast('Failed to generate game', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleAddToLibrary = async () => {
    if (!generatedGame) return;
    setAdding(true);
    try {
      const result = await createGame(generatedGame);
      if (result.success) {
        showToast(`"${generatedGame.name}" added to library!`, 'success');
        setShowPreview(false);
        setGeneratedGame(null);
        fetchGames();
      }
    } catch (err) {
      showToast('Failed to add game', 'error');
    } finally {
      setAdding(false);
    }
  };

  return (
    <>
      <div className={`p-3 rounded-lg ${info.lightColor} border border-transparent hover:border-gray-300 dark:hover:border-gray-600 transition-colors`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className={`font-medium text-sm ${info.textColor}`}>{suggestion.name}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{suggestion.description}</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 italic">
              Constraint: {suggestion.constraints}
            </p>
          </div>
          <button
            onClick={generateGame}
            disabled={generating}
            className="ml-2 p-1.5 rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow transition-shadow disabled:opacity-50"
            title="Generate with AI"
          >
            {generating ? (
              <span className="w-4 h-4 block border-2 border-gray-300 border-t-primary-500 rounded-full animate-spin" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 ${info.textColor}`}>
                <path d="M10 1a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 1zM5.05 3.05a.75.75 0 011.06 0l1.062 1.06A.75.75 0 116.11 5.173L5.05 4.11a.75.75 0 010-1.06zm9.9 0a.75.75 0 010 1.06l-1.06 1.062a.75.75 0 01-1.062-1.061l1.061-1.06a.75.75 0 011.06 0zM3 8a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 013 8zm11 0a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 0114 8z" />
                <path fillRule="evenodd" d="M10 5a3 3 0 100 6 3 3 0 000-6z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Quick Preview Modal */}
      {showPreview && generatedGame && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowPreview(false)}>
          <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className={`p-4 ${info.lightColor} border-b border-gray-200 dark:border-gray-700`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${info.color}`} />
                  <span className={`text-sm font-medium ${info.textColor}`}>
                    {info.label} Game
                  </span>
                </div>
                <span className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 px-2 py-0.5 rounded">
                  AI Generated
                </span>
              </div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white mt-2">
                {generatedGame.name}
              </h3>
            </div>

            <div className="p-4 overflow-y-auto max-h-[50vh]">
              {/* Start Position */}
              {generatedGame.aiMetadata?.startPosition && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-500 mb-1">Start Position</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{generatedGame.aiMetadata.startPosition}</p>
                </div>
              )}

              {/* Players */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">Top Player</p>
                  <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-3">{generatedGame.topPlayer}</p>
                </div>
                <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-1">Bottom Player</p>
                  <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-3">{generatedGame.bottomPlayer}</p>
                </div>
              </div>

              {/* Constraints */}
              {generatedGame.aiMetadata?.constraints && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-500 mb-1">Constraints</p>
                  <div className="flex flex-wrap gap-1">
                    {generatedGame.aiMetadata.constraints.slice(0, 4).map((c, i) => (
                      <span key={i} className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Coaching */}
              {generatedGame.coaching && (
                <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">Coaching Notes</p>
                  <p className="text-xs text-gray-700 dark:text-gray-300">{generatedGame.coaching}</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-3">
              <button
                onClick={() => {
                  setShowPreview(false);
                  setGeneratedGame(null);
                }}
                className="btn-secondary flex-1"
              >
                Discard
              </button>
              <button
                onClick={generateGame}
                disabled={generating}
                className="btn-ghost px-3"
                title="Regenerate"
              >
                {generating ? (
                  <span className="w-4 h-4 block border-2 border-gray-300 border-t-primary-500 rounded-full animate-spin" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0v2.43l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
              <button
                onClick={handleAddToLibrary}
                disabled={adding}
                className="btn-primary flex-1"
              >
                {adding ? (
                  <>
                    <span className="w-4 h-4 mr-2 block border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                    Add to Library
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Dynamic game suggestion card component with AI generation
function DynamicGameSuggestionCard({ suggestion }) {
  const { createGame, showToast, fetchGames } = useApp();
  const [generating, setGenerating] = useState(false);
  const [generatedGame, setGeneratedGame] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [adding, setAdding] = useState(false);

  // Get color based on suggestion type
  const getColors = () => {
    if (suggestion.type === 'meta') {
      return {
        lightColor: 'bg-purple-100 dark:bg-purple-900/30',
        textColor: 'text-purple-600 dark:text-purple-400',
        color: 'bg-purple-500'
      };
    }
    if (suggestion.type === 'foundational') {
      return {
        lightColor: 'bg-green-100 dark:bg-green-900/30',
        textColor: 'text-green-600 dark:text-green-400',
        color: 'bg-green-500'
      };
    }
    // Position-based - use topic color
    const topic = suggestion.topic || 'offensive';
    return topicInfo[topic] || topicInfo.offensive;
  };

  const colors = getColors();

  const generateGame = async () => {
    setGenerating(true);
    try {
      const prompt = suggestion.metaTechnique
        ? `Create a BJJ training game focused on ${suggestion.metaTechnique}. ${suggestion.description}. Key constraint: ${suggestion.constraints}`
        : `${suggestion.name}: ${suggestion.description}. Key constraint: ${suggestion.constraints}. Position focus: ${suggestion.category}`;

      const response = await api.post('/ai/generate', { prompt });
      const game = {
        ...response.data.game,
        topic: suggestion.topic || 'offensive'
      };
      setGeneratedGame(game);
      setShowPreview(true);
    } catch (err) {
      showToast('Failed to generate game', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleAddToLibrary = async () => {
    if (!generatedGame) return;
    setAdding(true);
    try {
      const result = await createGame(generatedGame);
      if (result.success) {
        showToast(`"${generatedGame.name}" added to library!`, 'success');
        setShowPreview(false);
        setGeneratedGame(null);
        fetchGames();
      }
    } catch (err) {
      showToast('Failed to add game', 'error');
    } finally {
      setAdding(false);
    }
  };

  return (
    <>
      <div className={`p-3 rounded-lg ${colors.lightColor} border border-transparent hover:border-gray-300 dark:hover:border-gray-600 transition-colors`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className={`font-medium text-sm ${colors.textColor}`}>{suggestion.name}</p>
              {suggestion.type === 'meta' && (
                <span className="text-[10px] px-1.5 py-0.5 bg-purple-200 dark:bg-purple-800 text-purple-700 dark:text-purple-300 rounded">
                  META
                </span>
              )}
              {suggestion.type === 'position' && (
                <span className="text-[10px] px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                  {suggestion.category}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">{suggestion.description}</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 italic">
              Constraint: {suggestion.constraints}
            </p>
          </div>
          <button
            onClick={generateGame}
            disabled={generating}
            className="ml-2 p-1.5 rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow transition-shadow disabled:opacity-50"
            title="Generate with AI"
          >
            {generating ? (
              <span className="w-4 h-4 block border-2 border-gray-300 border-t-primary-500 rounded-full animate-spin" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 ${colors.textColor}`}>
                <path d="M10 1a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 1zM5.05 3.05a.75.75 0 011.06 0l1.062 1.06A.75.75 0 116.11 5.173L5.05 4.11a.75.75 0 010-1.06zm9.9 0a.75.75 0 010 1.06l-1.06 1.062a.75.75 0 01-1.062-1.061l1.061-1.06a.75.75 0 011.06 0zM3 8a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 013 8zm11 0a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 0114 8z" />
                <path fillRule="evenodd" d="M10 5a3 3 0 100 6 3 3 0 000-6z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Quick Preview Modal */}
      {showPreview && generatedGame && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowPreview(false)}>
          <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className={`p-4 ${colors.lightColor} border-b border-gray-200 dark:border-gray-700`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${colors.color}`} />
                  <span className={`text-sm font-medium ${colors.textColor}`}>
                    {suggestion.type === 'meta' ? 'Meta Technique' : suggestion.category} Game
                  </span>
                </div>
                <span className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 px-2 py-0.5 rounded">
                  AI Generated
                </span>
              </div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white mt-2">
                {generatedGame.name}
              </h3>
            </div>

            <div className="p-4 overflow-y-auto max-h-[50vh]">
              {/* Start Position */}
              {generatedGame.aiMetadata?.startPosition && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-500 mb-1">Start Position</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{generatedGame.aiMetadata.startPosition}</p>
                </div>
              )}

              {/* Players */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">Top Player</p>
                  <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-3">{generatedGame.topPlayer}</p>
                </div>
                <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-1">Bottom Player</p>
                  <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-3">{generatedGame.bottomPlayer}</p>
                </div>
              </div>

              {/* Constraints */}
              {generatedGame.aiMetadata?.constraints && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-500 mb-1">Constraints</p>
                  <div className="flex flex-wrap gap-1">
                    {generatedGame.aiMetadata.constraints.slice(0, 4).map((c, i) => (
                      <span key={i} className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Coaching */}
              {generatedGame.coaching && (
                <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">Coaching Notes</p>
                  <p className="text-xs text-gray-700 dark:text-gray-300">{generatedGame.coaching}</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-3">
              <button
                onClick={() => {
                  setShowPreview(false);
                  setGeneratedGame(null);
                }}
                className="btn-secondary flex-1"
              >
                Discard
              </button>
              <button
                onClick={generateGame}
                disabled={generating}
                className="btn-ghost px-3"
                title="Regenerate"
              >
                {generating ? (
                  <span className="w-4 h-4 block border-2 border-gray-300 border-t-primary-500 rounded-full animate-spin" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0v2.43l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
              <button
                onClick={handleAddToLibrary}
                disabled={adding}
                className="btn-primary flex-1"
              >
                {adding ? (
                  <>
                    <span className="w-4 h-4 mr-2 block border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                    Add to Library
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// AI-powered game suggestion card with prompt-based generation
function AiGameSuggestionCard({ suggestion, onAddedToLibrary }) {
  const { createGame, showToast, fetchGames } = useApp();
  const [generating, setGenerating] = useState(false);
  const [generatedGame, setGeneratedGame] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [adding, setAdding] = useState(false);

  // Get color based on suggestion type
  const getColors = () => {
    const typeColors = {
      meta: {
        lightColor: 'bg-purple-100 dark:bg-purple-900/30',
        textColor: 'text-purple-600 dark:text-purple-400',
        color: 'bg-purple-500',
        label: 'META'
      },
      gap: {
        lightColor: 'bg-orange-100 dark:bg-orange-900/30',
        textColor: 'text-orange-600 dark:text-orange-400',
        color: 'bg-orange-500',
        label: 'GAP'
      },
      variation: {
        lightColor: 'bg-blue-100 dark:bg-blue-900/30',
        textColor: 'text-blue-600 dark:text-blue-400',
        color: 'bg-blue-500',
        label: 'VARIATION'
      },
      complement: {
        lightColor: 'bg-green-100 dark:bg-green-900/30',
        textColor: 'text-green-600 dark:text-green-400',
        color: 'bg-green-500',
        label: 'COMPLEMENT'
      },
      progression: {
        lightColor: 'bg-indigo-100 dark:bg-indigo-900/30',
        textColor: 'text-indigo-600 dark:text-indigo-400',
        color: 'bg-indigo-500',
        label: 'PROGRESSION'
      }
    };

    return typeColors[suggestion.type] || {
      lightColor: 'bg-gray-100 dark:bg-gray-800',
      textColor: 'text-gray-600 dark:text-gray-400',
      color: 'bg-gray-500',
      label: suggestion.type?.toUpperCase() || 'SUGGESTION'
    };
  };

  const colors = getColors();

  const generateGame = async () => {
    setGenerating(true);
    try {
      // Use the prompt from AI suggestions
      const prompt = suggestion.prompt || `${suggestion.name}: ${suggestion.description}`;
      const response = await api.post('/ai/generate', { prompt });
      const game = {
        ...response.data.game,
        topic: suggestion.topic || 'transition'
      };
      setGeneratedGame(game);
      setShowPreview(true);
    } catch (err) {
      showToast('Failed to generate game', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleAddToLibrary = async () => {
    if (!generatedGame) return;
    setAdding(true);
    try {
      const result = await createGame(generatedGame);
      if (result.success) {
        showToast(`"${generatedGame.name}" added to library!`, 'success');
        setShowPreview(false);
        setGeneratedGame(null);
        fetchGames();
        onAddedToLibrary?.();
      }
    } catch (err) {
      showToast('Failed to add game', 'error');
    } finally {
      setAdding(false);
    }
  };

  return (
    <>
      <div className={`p-3 rounded-lg ${colors.lightColor} border border-transparent hover:border-gray-300 dark:hover:border-gray-600 transition-colors`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className={`font-medium text-sm ${colors.textColor}`}>{suggestion.name}</p>
              <span className={`text-[10px] px-1.5 py-0.5 ${colors.lightColor} ${colors.textColor} rounded border border-current/20`}>
                {colors.label}
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">{suggestion.description}</p>
            {suggestion.reasoning && (
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 italic">
                {suggestion.reasoning}
              </p>
            )}
            {suggestion.basedOn && (
              <p className="text-[10px] text-gray-400 mt-1">
                Based on: {suggestion.basedOn}
              </p>
            )}
          </div>
          <button
            onClick={generateGame}
            disabled={generating}
            className="ml-2 p-1.5 rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow transition-shadow disabled:opacity-50"
            title="Generate with AI"
          >
            {generating ? (
              <span className="w-4 h-4 block border-2 border-gray-300 border-t-primary-500 rounded-full animate-spin" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 ${colors.textColor}`}>
                <path d="M10 1a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 1zM5.05 3.05a.75.75 0 011.06 0l1.062 1.06A.75.75 0 116.11 5.173L5.05 4.11a.75.75 0 010-1.06zm9.9 0a.75.75 0 010 1.06l-1.06 1.062a.75.75 0 01-1.062-1.061l1.061-1.06a.75.75 0 011.06 0zM3 8a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 013 8zm11 0a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 0114 8z" />
                <path fillRule="evenodd" d="M10 5a3 3 0 100 6 3 3 0 000-6z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Quick Preview Modal */}
      {showPreview && generatedGame && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowPreview(false)}>
          <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className={`p-4 ${colors.lightColor} border-b border-gray-200 dark:border-gray-700`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${colors.color}`} />
                  <span className={`text-sm font-medium ${colors.textColor}`}>
                    {colors.label} Game
                  </span>
                </div>
                <span className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 px-2 py-0.5 rounded">
                  AI Generated
                </span>
              </div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white mt-2">
                {generatedGame.name}
              </h3>
            </div>

            <div className="p-4 overflow-y-auto max-h-[50vh]">
              {/* Start Position */}
              {generatedGame.aiMetadata?.startPosition && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-500 mb-1">Start Position</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{generatedGame.aiMetadata.startPosition}</p>
                </div>
              )}

              {/* Players */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">Top Player</p>
                  <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-3">{generatedGame.topPlayer}</p>
                </div>
                <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-1">Bottom Player</p>
                  <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-3">{generatedGame.bottomPlayer}</p>
                </div>
              </div>

              {/* Constraints */}
              {generatedGame.aiMetadata?.constraints && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-500 mb-1">Constraints</p>
                  <div className="flex flex-wrap gap-1">
                    {generatedGame.aiMetadata.constraints.slice(0, 4).map((c, i) => (
                      <span key={i} className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Coaching */}
              {generatedGame.coaching && (
                <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">Coaching Notes</p>
                  <p className="text-xs text-gray-700 dark:text-gray-300">{generatedGame.coaching}</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-3">
              <button
                onClick={() => {
                  setShowPreview(false);
                  setGeneratedGame(null);
                }}
                className="btn-secondary flex-1"
              >
                Discard
              </button>
              <button
                onClick={generateGame}
                disabled={generating}
                className="btn-ghost px-3"
                title="Regenerate"
              >
                {generating ? (
                  <span className="w-4 h-4 block border-2 border-gray-300 border-t-primary-500 rounded-full animate-spin" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0v2.43l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
              <button
                onClick={handleAddToLibrary}
                disabled={adding}
                className="btn-primary flex-1"
              >
                {adding ? (
                  <>
                    <span className="w-4 h-4 mr-2 block border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                    Add to Library
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Quick balance indicator for headers
export function BalanceIndicator({ games }) {
  const counts = { offensive: 0, defensive: 0, control: 0, transition: 0 };
  games?.forEach(game => {
    if (game.topic && counts.hasOwnProperty(game.topic)) {
      counts[game.topic]++;
    }
  });

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const average = total / 4;
  const variance = Object.values(counts).reduce((sum, count) =>
    sum + Math.pow(count - average, 2), 0) / 4;
  const balanceScore = Math.max(0, 100 - Math.sqrt(variance) * 10);

  return (
    <div className="flex items-center gap-1.5" title={`Training Balance: ${Math.round(balanceScore)}%`}>
      <div className="flex gap-0.5">
        {Object.entries(topicInfo).map(([key, info]) => (
          <div
            key={key}
            className={`w-1.5 h-4 rounded-sm ${info.color}`}
            style={{ opacity: counts[key] ? Math.max(0.4, counts[key] / Math.max(...Object.values(counts), 1)) : 0.2 }}
          />
        ))}
      </div>
    </div>
  );
}
