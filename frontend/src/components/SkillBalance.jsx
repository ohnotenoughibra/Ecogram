import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

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

// Game suggestions for each topic
const gameSuggestions = {
  offensive: [
    { name: 'Sub Hunt', description: 'Start in top position, score points only for submissions', constraints: 'No holding positions > 5 sec' },
    { name: 'Finish or Reset', description: 'Attack from a position, if defended, reset and try different attack', constraints: 'Must attempt new sub each reset' },
    { name: 'Submission Chain', description: 'String 3 submission attempts together before partner can escape', constraints: 'Chain must flow, no pauses' },
    { name: 'First to Tap', description: 'Competitive rounds with submission-only wins', constraints: 'Time limit adds urgency' }
  ],
  defensive: [
    { name: 'Great Escape', description: 'Start in bad position, escape to neutral', constraints: 'No submissions allowed' },
    { name: 'Survival Round', description: 'Defend from mount/back for set time without getting subbed', constraints: 'Timer creates pressure' },
    { name: 'Reset Defense', description: 'Partner applies submission, you escape, immediately reapply', constraints: 'Continuous drilling' },
    { name: 'Turtle Recovery', description: 'Start in turtle, recover guard or stand up', constraints: 'Partner can attack but not submit' }
  ],
  control: [
    { name: 'Pin to Win', description: 'Score points only for maintaining positions (3 sec = 1 pt)', constraints: 'No submissions, position focus' },
    { name: 'Position Ladder', description: 'Progress through positions: side control → mount → back', constraints: 'Must control 3 sec before advancing' },
    { name: 'Pressure Cooker', description: 'Top player maintains heavy pressure, bottom tries to create space', constraints: 'Focus on weight distribution' },
    { name: 'Guard Retention', description: 'Bottom player keeps guard, top player passes', constraints: 'Reset on pass or sweep' }
  ],
  transition: [
    { name: 'Flow Roll', description: 'Continuous movement, no holding positions', constraints: 'Constant motion required' },
    { name: 'Scramble King', description: 'Start from neutral, first to establish position wins', constraints: 'Reset after each win' },
    { name: 'Chain Wrestling', description: 'String takedowns and re-shots together', constraints: 'No stopping on failed attempts' },
    { name: 'Guard to Guard', description: 'Cycle through different guard positions continuously', constraints: 'Timed transitions' }
  ]
};

export default function SkillBalance({ showSuggestions = true, compact = false }) {
  const { games } = useApp();
  const [topicCounts, setTopicCounts] = useState({});
  const [weakestTopic, setWeakestTopic] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

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

      {/* Suggestions for weakest topic */}
      {showSuggestions && weakestTopic && totalGames > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
            <span>💡</span>
            Suggested {topicInfo[weakestTopic].label} Games to Add
          </h4>
          <div className="space-y-2">
            {gameSuggestions[weakestTopic].slice(0, 2).map((suggestion, i) => (
              <GameSuggestionCard key={i} suggestion={suggestion} topic={weakestTopic} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Game suggestion card component
function GameSuggestionCard({ suggestion, topic }) {
  const info = topicInfo[topic];

  return (
    <div className={`p-3 rounded-lg ${info.lightColor} border border-transparent hover:border-gray-300 dark:hover:border-gray-600 transition-colors cursor-pointer`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={`font-medium text-sm ${info.textColor}`}>{suggestion.name}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{suggestion.description}</p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 italic">
            Constraint: {suggestion.constraints}
          </p>
        </div>
        <button className="ml-2 p-1.5 rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow transition-shadow">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 ${info.textColor}`}>
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
        </button>
      </div>
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
