import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import Loading from '../components/Loading';
import api from '../utils/api';

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

const gameTypeInfo = {
  warmup: { label: 'Warmup', icon: '🔥', color: 'bg-orange-500' },
  main: { label: 'Main', icon: '🎯', color: 'bg-blue-500' },
  cooldown: { label: 'Cooldown', icon: '🧘', color: 'bg-teal-500' }
};

export default function Stats() {
  const { stats, statsLoading, fetchStats, games, sessions } = useApp();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchStats();
  }, []);

  if (statsLoading || !stats) {
    return <Loading text="Loading statistics..." />;
  }

  const topics = ['offensive', 'defensive', 'control', 'transition'];
  const maxTopicCount = Math.max(...topics.map(t => stats.topicDistribution[t] || 0), 1);

  // Calculate game type distribution
  const gameTypeDistribution = {
    warmup: games.filter(g => g.gameType === 'warmup').length,
    main: games.filter(g => !g.gameType || g.gameType === 'main').length,
    cooldown: games.filter(g => g.gameType === 'cooldown').length
  };

  // Calculate difficulty distribution
  const difficultyDistribution = {
    beginner: games.filter(g => g.difficulty === 'beginner').length,
    intermediate: games.filter(g => !g.difficulty || g.difficulty === 'intermediate').length,
    advanced: games.filter(g => g.difficulty === 'advanced').length
  };

  // Calculate training frequency (games used in last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentlyUsedGames = games.filter(g => g.lastUsed && new Date(g.lastUsed) > thirtyDaysAgo);

  // Calculate usage by week for the last 4 weeks
  const weeklyUsage = [];
  for (let i = 0; i < 4; i++) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - (i + 1) * 7);
    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() - i * 7);
    const count = games.filter(g => {
      if (!g.lastUsed) return false;
      const used = new Date(g.lastUsed);
      return used >= weekStart && used < weekEnd;
    }).length;
    weeklyUsage.unshift({ week: `Week ${4 - i}`, count });
  }
  const maxWeeklyCount = Math.max(...weeklyUsage.map(w => w.count), 1);

  // Session stats
  const totalSessions = sessions.length;
  const completedSessions = sessions.filter(s =>
    s.games.length > 0 && s.games.every(g => g.completed)
  ).length;

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
          Training Analytics
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Track your training progress and library balance
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'activity', label: 'Activity' },
          { id: 'library', label: 'Library' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
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
        </>
      )}

      {/* Activity Tab */}
      {activeTab === 'activity' && (
        <>
          {/* Training Frequency */}
          <div className="card p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Training Frequency (Last 4 Weeks)
            </h2>
            <div className="space-y-3">
              {weeklyUsage.map((week, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{week.week}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {week.count} games used
                    </span>
                  </div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 transition-all"
                      style={{ width: `${(week.count / maxWeeklyCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                <p className="text-3xl font-bold text-primary-600">{recentlyUsedGames.length}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Games used (30 days)</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                <p className="text-3xl font-bold text-green-600">{completedSessions}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Sessions completed</p>
              </div>
            </div>
          </div>

          {/* Session Stats */}
          <div className="card p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Session Activity
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalSessions}</p>
                <p className="text-sm text-gray-500">Total Sessions</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-500">{completedSessions}</p>
                <p className="text-sm text-gray-500">Completed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-500">{totalSessions - completedSessions}</p>
                <p className="text-sm text-gray-500">In Progress</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary-500">
                  {totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0}%
                </p>
                <p className="text-sm text-gray-500">Completion Rate</p>
              </div>
            </div>
          </div>

          {/* Unused Games */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Games Needing Attention
            </h2>
            <div className="space-y-2">
              {games.filter(g => !g.lastUsed || g.usageCount === 0).slice(0, 5).map(game => (
                <div key={game._id} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className={`w-2 h-2 rounded-full ${topicColors[game.topic]}`} />
                  <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">{game.name}</span>
                  <span className="text-xs text-gray-400">Never used</span>
                </div>
              ))}
              {games.filter(g => !g.lastUsed || g.usageCount === 0).length === 0 && (
                <p className="text-center text-gray-500 py-4">All games have been used. Great work!</p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Library Tab */}
      {activeTab === 'library' && (
        <>
          {/* Game Type Distribution */}
          <div className="card p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Game Type Distribution
            </h2>
            <div className="grid grid-cols-3 gap-4 mb-4">
              {Object.entries(gameTypeInfo).map(([type, info]) => (
                <div key={type} className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-2xl mb-2 block">{info.icon}</span>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{gameTypeDistribution[type]}</p>
                  <p className="text-sm text-gray-500">{info.label}</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-500 text-center">
              Tip: Balance warmup and cooldown games for complete training sessions
            </p>
          </div>

          {/* Difficulty Distribution */}
          <div className="card p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Difficulty Distribution
            </h2>
            <div className="space-y-3">
              {[
                { key: 'beginner', label: 'Beginner', color: 'bg-green-500' },
                { key: 'intermediate', label: 'Intermediate', color: 'bg-yellow-500' },
                { key: 'advanced', label: 'Advanced', color: 'bg-red-500' }
              ].map(diff => {
                const count = difficultyDistribution[diff.key];
                const total = Object.values(difficultyDistribution).reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={diff.key}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${diff.color}`} />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {diff.label}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {count} ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${diff.color} transition-all`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Topic Distribution (from overview) */}
          <div className="card p-6">
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
                  const percentage = stats.totalGames > 0 ? Math.round((count / stats.totalGames) * 100) : 0;
                  return (
                    <div key={topic}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-full ${topicColors[topic]}`} />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {topicLabels[topic]}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {count} ({percentage}%)
                        </span>
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
          </div>
        </>
      )}
    </div>
  );
}
