import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';

// Position labels for display
const positionLabels = {
  'closed-guard': 'Closed Guard',
  'open-guard': 'Open Guard',
  'half-guard': 'Half Guard',
  'butterfly-guard': 'Butterfly Guard',
  'x-guard': 'X-Guard',
  'dlr': 'De La Riva',
  'rdlr': 'Reverse DLR',
  'spider-guard': 'Spider Guard',
  'lasso-guard': 'Lasso Guard',
  'collar-sleeve': 'Collar & Sleeve',
  'mount': 'Mount',
  'side-control': 'Side Control',
  'north-south': 'North-South',
  'knee-on-belly': 'Knee on Belly',
  'back-control': 'Back Control',
  'turtle': 'Turtle',
  'front-headlock': 'Front Headlock',
  'standing': 'Standing',
  'clinch': 'Clinch',
  'single-leg': 'Single Leg',
  'double-leg': 'Double Leg',
  '50-50': '50-50',
  'saddle': 'Saddle',
  'ashi-garami': 'Ashi Garami',
  'inside-sankaku': 'Inside Sankaku',
  'other': 'Other'
};

// Position category colors
const positionColors = {
  guard: { color: 'bg-blue-500', lightColor: 'bg-blue-100 dark:bg-blue-900/30', textColor: 'text-blue-600 dark:text-blue-400' },
  top: { color: 'bg-red-500', lightColor: 'bg-red-100 dark:bg-red-900/30', textColor: 'text-red-600 dark:text-red-400' },
  back: { color: 'bg-purple-500', lightColor: 'bg-purple-100 dark:bg-purple-900/30', textColor: 'text-purple-600 dark:text-purple-400' },
  standing: { color: 'bg-green-500', lightColor: 'bg-green-100 dark:bg-green-900/30', textColor: 'text-green-600 dark:text-green-400' },
  leglock: { color: 'bg-orange-500', lightColor: 'bg-orange-100 dark:bg-orange-900/30', textColor: 'text-orange-600 dark:text-orange-400' },
  other: { color: 'bg-gray-500', lightColor: 'bg-gray-100 dark:bg-gray-700', textColor: 'text-gray-600 dark:text-gray-400' }
};

// Categorize positions
const getPositionCategory = (position) => {
  const guardPositions = ['closed-guard', 'open-guard', 'half-guard', 'butterfly-guard', 'x-guard', 'dlr', 'rdlr', 'spider-guard', 'lasso-guard', 'collar-sleeve'];
  const topPositions = ['mount', 'side-control', 'north-south', 'knee-on-belly', 'front-headlock'];
  const backPositions = ['back-control', 'turtle'];
  const standingPositions = ['standing', 'clinch', 'single-leg', 'double-leg'];
  const leglockPositions = ['50-50', 'saddle', 'ashi-garami', 'inside-sankaku'];

  if (guardPositions.includes(position)) return 'guard';
  if (topPositions.includes(position)) return 'top';
  if (backPositions.includes(position)) return 'back';
  if (standingPositions.includes(position)) return 'standing';
  if (leglockPositions.includes(position)) return 'leglock';
  return 'other';
};

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

export default function SkillBalance({ compact = false }) {
  const { stats, fetchStats } = useApp();
  const [showDetails, setShowDetails] = useState(false);
  const [viewMode, setViewMode] = useState('topics'); // 'topics' | 'positions'

  // Fetch stats on mount
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Get data from stats
  const topicCounts = stats?.topicDistribution || { offensive: 0, defensive: 0, control: 0, transition: 0 };
  const positionCounts = stats?.positionDistribution || {};
  const totalGamesInLibrary = stats?.totalGames || 0;
  const gamesWithPositions = stats?.gamesWithPositions || 0;

  // Calculate totals
  const totalGames = Object.values(topicCounts).reduce((a, b) => a + b, 0);
  const maxCount = Math.max(...Object.values(topicCounts), 1);
  const totalPositionGames = Object.values(positionCounts).reduce((a, b) => a + b, 0);

  // Find weakest topic
  const weakestTopic = useMemo(() => {
    const entries = Object.entries(topicCounts);
    if (entries.length === 0 || totalGames === 0) return null;
    return entries.reduce((min, [topic, count]) =>
      count < min.count ? { topic, count } : min
    , { topic: entries[0][0], count: entries[0][1] }).topic;
  }, [topicCounts, totalGames]);

  // Calculate balance score for topics (0-100, 100 being perfectly balanced)
  const average = totalGames / 4;
  const variance = Object.values(topicCounts).reduce((sum, count) =>
    sum + Math.pow(count - average, 2), 0) / 4;
  const balanceScore = Math.max(0, 100 - Math.sqrt(variance) * 10);

  // Calculate balance score for positions
  const positionCount = Object.keys(positionCounts).length;
  const posAverage = totalPositionGames / Math.max(positionCount, 1);
  const posVariance = positionCount > 0
    ? Object.values(positionCounts).reduce((sum, count) =>
        sum + Math.pow(count - posAverage, 2), 0) / positionCount
    : 0;
  const positionBalanceScore = positionCount > 0
    ? Math.max(0, 100 - Math.sqrt(posVariance) * 8)
    : 0;

  // Sort positions by count for display
  const sortedPositions = Object.entries(positionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8); // Show top 8 positions

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

      {/* View Mode Toggle */}
      <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg mb-4">
        <button
          onClick={() => setViewMode('topics')}
          className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            viewMode === 'topics'
              ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          By Topic
        </button>
        <button
          onClick={() => setViewMode('positions')}
          className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            viewMode === 'positions'
              ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          By Position
        </button>
      </div>

      {/* Topics View */}
      {viewMode === 'topics' && (
        <>
          {/* Coverage indicator */}
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Games with topics</span>
              <span className={`font-medium ${
                totalGames / totalGamesInLibrary >= 0.5 ? 'text-green-600' :
                totalGames / totalGamesInLibrary >= 0.2 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {totalGames} of {totalGamesInLibrary}
              </span>
            </div>
            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-1.5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  totalGames / totalGamesInLibrary >= 0.5 ? 'bg-green-500' :
                  totalGames / totalGamesInLibrary >= 0.2 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${totalGamesInLibrary > 0 ? (totalGames / totalGamesInLibrary) * 100 : 0}%` }}
              />
            </div>
            {totalGames < totalGamesInLibrary * 0.5 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Add topics to more games for better balance tracking
              </p>
            )}
          </div>

          {/* Balance meter */}
          {totalGames > 0 && (
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
          )}

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
        </>
      )}

      {/* Positions View */}
      {viewMode === 'positions' && (
        <>
          {/* Coverage indicator */}
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Games with positions</span>
              <span className={`font-medium ${
                totalPositionGames / totalGamesInLibrary >= 0.5 ? 'text-green-600' :
                totalPositionGames / totalGamesInLibrary >= 0.2 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {totalPositionGames} of {totalGamesInLibrary}
              </span>
            </div>
            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-1.5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  totalPositionGames / totalGamesInLibrary >= 0.5 ? 'bg-green-500' :
                  totalPositionGames / totalGamesInLibrary >= 0.2 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${totalGamesInLibrary > 0 ? (totalPositionGames / totalGamesInLibrary) * 100 : 0}%` }}
              />
            </div>
            {totalPositionGames < totalGamesInLibrary * 0.5 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Add positions to more games for better balance tracking
              </p>
            )}
          </div>

          {/* Position category counts */}
          {(() => {
            const categoryCounts = Object.entries(positionCounts).reduce((acc, [pos, count]) => {
              const cat = getPositionCategory(pos);
              acc[cat] = (acc[cat] || 0) + count;
              return acc;
            }, {});
            const maxCategoryCount = Math.max(...Object.values(categoryCounts), 1);
            const categoryOrder = ['guard', 'top', 'back', 'standing', 'leglock'];
            const categoryLabels = {
              guard: { label: 'Guard', icon: '🛡️', desc: 'Bottom positions' },
              top: { label: 'Top Control', icon: '⬆️', desc: 'Dominant pins' },
              back: { label: 'Back/Turtle', icon: '🔙', desc: 'Back attacks' },
              standing: { label: 'Standing', icon: '🧍', desc: 'Takedowns' },
              leglock: { label: 'Leg Locks', icon: '🦵', desc: 'Leg entanglements' }
            };

            // Find weakest category
            const weakestCat = categoryOrder.reduce((min, cat) => {
              const count = categoryCounts[cat] || 0;
              return count < (categoryCounts[min] || Infinity) ? cat : min;
            }, categoryOrder[0]);

            return Object.keys(categoryCounts).length > 0 ? (
              <div className="space-y-3">
                {categoryOrder.map(cat => {
                  const count = categoryCounts[cat] || 0;
                  const percentage = maxCategoryCount > 0 ? (count / maxCategoryCount) * 100 : 0;
                  const colorStyle = positionColors[cat];
                  const catInfo = categoryLabels[cat];
                  const isWeakest = cat === weakestCat && totalPositionGames > 3;

                  return (
                    <div key={cat}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="flex items-center gap-2">
                          <span className="text-base">{catInfo.icon}</span>
                          <span className={`font-medium ${colorStyle.textColor}`}>{catInfo.label}</span>
                          {isWeakest && count === 0 && (
                            <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded">
                              Missing
                            </span>
                          )}
                          {isWeakest && count > 0 && (
                            <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded">
                              Needs focus
                            </span>
                          )}
                        </span>
                        <span className="text-gray-500">{count} games</span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${colorStyle.color} rounded-full transition-all duration-700 ease-out`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                <p>No position data yet</p>
                <p className="text-xs mt-1">Add positions to your games to see balance</p>
              </div>
            );
          })()}
        </>
      )}

      {/* Details section */}
      {showDetails && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 animate-fade-in">
          {viewMode === 'topics' ? (
            <>
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
            </>
          ) : (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                <strong>Position Coverage:</strong> Training across different position categories ensures you're
                prepared for all situations. Focus on categories where you have fewer games.
              </p>
              {/* Show individual positions breakdown */}
              {sortedPositions.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-500 mb-2">Individual Positions:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {sortedPositions.map(([position, count]) => {
                      const category = getPositionCategory(position);
                      const colorStyle = positionColors[category];
                      return (
                        <span
                          key={position}
                          className={`px-2 py-1 rounded text-xs ${colorStyle.lightColor} ${colorStyle.textColor}`}
                        >
                          {positionLabels[position] || position}: {count}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
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
