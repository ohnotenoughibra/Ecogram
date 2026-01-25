import { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import Loading from '../components/Loading';

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

export default function Stats() {
  const { stats, statsLoading, fetchStats } = useApp();

  useEffect(() => {
    fetchStats();
  }, []);

  if (statsLoading || !stats) {
    return <Loading text="Loading statistics..." />;
  }

  const topics = ['offensive', 'defensive', 'control', 'transition'];
  const maxTopicCount = Math.max(...topics.map(t => stats.topicDistribution[t] || 0), 1);

  // Calculate topic balance warnings
  const totalTopics = topics.reduce((sum, t) => sum + (stats.topicDistribution[t] || 0), 0);
  const getBalanceStatus = (count) => {
    if (totalTopics === 0) return 'neutral';
    const percentage = (count / totalTopics) * 100;
    if (percentage < 10) return 'low';
    if (percentage > 40) return 'high';
    return 'balanced';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 text-primary-500">
            <path d="M15.5 2A1.5 1.5 0 0014 3.5v13a1.5 1.5 0 001.5 1.5h1a1.5 1.5 0 001.5-1.5v-13A1.5 1.5 0 0016.5 2h-1zM9.5 6A1.5 1.5 0 008 7.5v9A1.5 1.5 0 009.5 18h1a1.5 1.5 0 001.5-1.5v-9A1.5 1.5 0 0010.5 6h-1zM3.5 10A1.5 1.5 0 002 11.5v5A1.5 1.5 0 003.5 18h1A1.5 1.5 0 006 16.5v-5A1.5 1.5 0 004.5 10h-1z" />
          </svg>
          Statistics
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Overview of your training game library
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Games</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalGames}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Favorites</p>
          <p className="text-2xl font-bold text-yellow-500">{stats.favoriteCount}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Used Games</p>
          <p className="text-2xl font-bold text-green-500">{stats.usedCount}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Unused Games</p>
          <p className="text-2xl font-bold text-gray-400">{stats.totalGames - stats.usedCount}</p>
        </div>
      </div>

      {/* Topic Distribution */}
      <div className="card p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Topic Distribution
        </h2>

        {stats.totalGames === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">
            No games yet. Add some games to see the distribution.
          </p>
        ) : (
          <div className="space-y-4">
            {topics.map(topic => {
              const count = stats.topicDistribution[topic] || 0;
              const percentage = totalTopics > 0 ? Math.round((count / totalTopics) * 100) : 0;
              const status = getBalanceStatus(count);

              return (
                <div key={topic}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${topicColors[topic]}`} />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {topicLabels[topic]}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {count} ({percentage}%)
                      </span>
                      {status === 'low' && (
                        <span className="badge bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs">
                          Low coverage
                        </span>
                      )}
                      {status === 'high' && (
                        <span className="badge bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs">
                          Focus area
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${topicColors[topic]} transition-all`}
                      style={{ width: `${(count / maxTopicCount) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Balance recommendations */}
        {stats.totalGames > 5 && (
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Balance Recommendations
            </h3>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              {topics.map(topic => {
                const status = getBalanceStatus(stats.topicDistribution[topic] || 0);
                if (status === 'low') {
                  return (
                    <li key={topic} className="flex items-center gap-2">
                      <span className="text-yellow-500">⚠</span>
                      Consider adding more {topicLabels[topic].toLowerCase()} games
                    </li>
                  );
                }
                return null;
              }).filter(Boolean)}
              {topics.every(t => getBalanceStatus(stats.topicDistribution[t] || 0) === 'balanced') && (
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Your library has good topic balance!
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Most Used Games */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Most Used Games
          </h2>
          {stats.mostUsed.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              No usage data yet
            </p>
          ) : (
            <div className="space-y-3">
              {stats.mostUsed.map((game, idx) => (
                <div key={game._id} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-medium text-gray-500">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {game.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {game.usageCount} uses
                    </p>
                  </div>
                  <span className={`w-2 h-2 rounded-full ${topicColors[game.topic]}`} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recently Created */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recently Created
          </h2>
          {stats.recentlyCreated.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              No games created yet
            </p>
          ) : (
            <div className="space-y-3">
              {stats.recentlyCreated.map((game) => (
                <div key={game._id} className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${topicColors[game.topic]}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {game.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(game.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Skills/Tags Cloud */}
        <div className="card p-6 md:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Top Skills & Tags
          </h2>
          {stats.skillsFrequency.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              No skills tagged yet
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {stats.skillsFrequency.map((skill, idx) => (
                <span
                  key={skill._id}
                  className="chip"
                  style={{
                    fontSize: `${Math.max(0.75, 1 - idx * 0.05)}rem`,
                    opacity: Math.max(0.5, 1 - idx * 0.05)
                  }}
                >
                  #{skill._id}
                  <span className="text-xs text-gray-400 ml-1">({skill.count})</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
