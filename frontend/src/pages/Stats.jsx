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

  // Calculate effectiveness stats
  const gamesWithEffectiveness = games.filter(g => g.averageEffectiveness > 0);
  const topEffectiveGames = [...gamesWithEffectiveness]
    .sort((a, b) => b.averageEffectiveness - a.averageEffectiveness)
    .slice(0, 5);
  const avgEffectiveness = gamesWithEffectiveness.length > 0
    ? (gamesWithEffectiveness.reduce((sum, g) => sum + g.averageEffectiveness, 0) / gamesWithEffectiveness.length).toFixed(1)
    : 0;

  // Calculate training streak (consecutive days with activity)
  const calculateStreak = () => {
    const sortedDates = games
      .filter(g => g.lastUsed)
      .map(g => new Date(g.lastUsed).toDateString())
      .filter((date, idx, arr) => arr.indexOf(date) === idx)
      .sort((a, b) => new Date(b) - new Date(a));

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const dateStr of sortedDates) {
      const date = new Date(dateStr);
      date.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((currentDate - date) / (1000 * 60 * 60 * 24));

      if (diffDays <= 1) {
        streak++;
        currentDate = date;
      } else {
        break;
      }
    }
    return streak;
  };
  const trainingStreak = calculateStreak();

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

  // Training recommendations based on data
  const getRecommendations = () => {
    const recommendations = [];

    // Low topic coverage
    topics.forEach(topic => {
      const status = getBalanceStatus(stats.topicDistribution[topic] || 0);
      if (status === 'low') {
        recommendations.push({
          type: 'topic',
          priority: 'high',
          message: `Train more ${topicLabels[topic].toLowerCase()} - only ${stats.topicDistribution[topic] || 0} games`,
          icon: '🎯'
        });
      }
    });

    // Unused games
    const unusedCount = games.filter(g => !g.lastUsed).length;
    if (unusedCount > 5) {
      recommendations.push({
        type: 'unused',
        priority: 'medium',
        message: `${unusedCount} games have never been used - try them out!`,
        icon: '📋'
      });
    }

    // Low warmup/cooldown
    if (gameTypeDistribution.warmup < 3) {
      recommendations.push({
        type: 'warmup',
        priority: 'medium',
        message: 'Add more warmup games for complete sessions',
        icon: '🔥'
      });
    }

    // High effectiveness games to use more
    if (topEffectiveGames.length > 0) {
      recommendations.push({
        type: 'effective',
        priority: 'low',
        message: `Your top effective drill: "${topEffectiveGames[0].name}" (${topEffectiveGames[0].averageEffectiveness}/5)`,
        icon: '⭐'
      });
    }

    return recommendations.slice(0, 4);
  };
  const recommendations = getRecommendations();

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
          { id: 'library', label: 'Library' },
          { id: 'insights', label: 'Insights' }
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

      {/* Insights Tab */}
      {activeTab === 'insights' && (
        <>
          {/* Training Streak & Quick Stats with Animations */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="card p-4 text-center group hover:scale-105 transition-transform cursor-pointer" onClick={() => window.location.href = '/goals'}>
              <div className="text-3xl mb-1 group-hover:animate-bounce">🔥</div>
              <p className="text-2xl font-bold text-orange-500">{trainingStreak}</p>
              <p className="text-sm text-gray-500">Day Streak</p>
              {trainingStreak >= 7 && <span className="text-xs text-orange-500 mt-1 block">On fire!</span>}
            </div>
            <div className="card p-4 text-center group hover:scale-105 transition-transform">
              <div className="text-3xl mb-1">⭐</div>
              <p className="text-2xl font-bold text-yellow-500">{avgEffectiveness}</p>
              <p className="text-sm text-gray-500">Avg Effectiveness</p>
              <div className="flex justify-center gap-0.5 mt-1">
                {[1, 2, 3, 4, 5].map(s => (
                  <div key={s} className={`w-1.5 h-1.5 rounded-full ${parseFloat(avgEffectiveness) >= s ? 'bg-yellow-400' : 'bg-gray-300 dark:bg-gray-600'}`} />
                ))}
              </div>
            </div>
            <div className="card p-4 text-center group hover:scale-105 transition-transform">
              <div className="text-3xl mb-1">📊</div>
              <p className="text-2xl font-bold text-primary-500">{gamesWithEffectiveness.length}</p>
              <p className="text-sm text-gray-500">Games Rated</p>
              <p className="text-xs text-gray-400 mt-1">{stats.totalGames > 0 ? Math.round((gamesWithEffectiveness.length / stats.totalGames) * 100) : 0}% of library</p>
            </div>
            <div className="card p-4 text-center group hover:scale-105 transition-transform">
              <div className="text-3xl mb-1">🎯</div>
              <p className="text-2xl font-bold text-green-500">{recentlyUsedGames.length}</p>
              <p className="text-sm text-gray-500">Active (30d)</p>
              <p className="text-xs text-gray-400 mt-1">{stats.totalGames > 0 ? Math.round((recentlyUsedGames.length / stats.totalGames) * 100) : 0}% utilization</p>
            </div>
          </div>

          {/* Weekly Training Calendar */}
          <div className="card p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-primary-500">
                  <path fillRule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z" clipRule="evenodd" />
                </svg>
                Last 4 Weeks
              </h2>
              <a href="/goals" className="text-sm text-primary-600 hover:underline">Set Goals</a>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <div key={i} className="text-xs text-center text-gray-400 mb-1">{day}</div>
              ))}
              {(() => {
                const days = [];
                const today = new Date();
                const trainingDates = new Set(
                  games.filter(g => g.lastUsed)
                    .map(g => new Date(g.lastUsed).toDateString())
                );
                for (let i = 27; i >= 0; i--) {
                  const date = new Date(today);
                  date.setDate(date.getDate() - i);
                  const dateStr = date.toDateString();
                  const isTraining = trainingDates.has(dateStr);
                  const isToday = date.toDateString() === today.toDateString();
                  days.push(
                    <div
                      key={i}
                      className={`aspect-square rounded-sm flex items-center justify-center text-xs transition-all cursor-pointer hover:scale-110 ${
                        isTraining
                          ? 'bg-green-500 text-white font-medium'
                          : isToday
                          ? 'bg-primary-100 dark:bg-primary-900/30 border-2 border-primary-500'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                      }`}
                      title={`${date.toLocaleDateString()}${isTraining ? ' - Trained!' : ''}`}
                    >
                      {date.getDate()}
                    </div>
                  );
                }
                return days;
              })()}
            </div>
            <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
              <span>Less</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-sm bg-gray-200 dark:bg-gray-700" />
                <div className="w-3 h-3 rounded-sm bg-green-200" />
                <div className="w-3 h-3 rounded-sm bg-green-400" />
                <div className="w-3 h-3 rounded-sm bg-green-600" />
              </div>
              <span>More</span>
            </div>
          </div>

          {/* Training Recommendations with Actions */}
          <div className="card p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-primary-500">
                <path d="M10 1a6 6 0 00-3.815 10.631C7.237 12.5 8 13.443 8 14.456v.644a.75.75 0 00.572.729 6.016 6.016 0 002.856 0A.75.75 0 0012 15.1v-.644c0-1.013.762-1.957 1.815-2.825A6 6 0 0010 1zM8.863 17.414a.75.75 0 00-.226 1.483 9.066 9.066 0 002.726 0 .75.75 0 00-.226-1.483 7.553 7.553 0 01-2.274 0z" />
              </svg>
              Smart Recommendations
            </h2>
            {recommendations.length === 0 ? (
              <div className="text-center py-6 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <span className="text-4xl mb-2 block animate-bounce">🎉</span>
                <p className="text-green-700 dark:text-green-400 font-medium">
                  Amazing! Your training is perfectly balanced.
                </p>
                <p className="text-sm text-green-600 dark:text-green-500 mt-1">
                  Keep up the great work!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 p-4 rounded-lg transition-all hover:shadow-md ${
                      rec.priority === 'high'
                        ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                        : rec.priority === 'medium'
                        ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                        : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <span className="text-2xl">{rec.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {rec.message}
                      </p>
                      <span className={`text-xs ${
                        rec.priority === 'high'
                          ? 'text-red-600 dark:text-red-400'
                          : rec.priority === 'medium'
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-gray-500'
                      }`}>
                        {rec.priority === 'high' ? 'High priority' : rec.priority === 'medium' ? 'Suggested' : 'Tip'}
                      </span>
                    </div>
                    {rec.type === 'topic' && (
                      <button
                        onClick={() => window.location.href = `/?topic=${rec.topic || rec.message.split(' ')[2]}`}
                        className="btn-secondary text-xs py-1 px-3"
                      >
                        View Games
                      </button>
                    )}
                    {rec.type === 'unused' && (
                      <button
                        onClick={() => window.location.href = '/'}
                        className="btn-secondary text-xs py-1 px-3"
                      >
                        Explore
                      </button>
                    )}
                    {rec.type === 'warmup' && (
                      <button
                        onClick={() => window.location.href = '/ai'}
                        className="btn-secondary text-xs py-1 px-3"
                      >
                        Create
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Personal Achievements */}
          <div className="card p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-yellow-500">
                <path fillRule="evenodd" d="M10 1c-1.828 0-3.623.149-5.371.435a.75.75 0 00-.629.74v.387c-.827.157-1.642.345-2.445.564a.75.75 0 00-.552.698 5 5 0 004.503 5.152 6 6 0 002.946 1.822A6.451 6.451 0 017.768 13H7.5A1.5 1.5 0 006 14.5V17h-.75C4.56 17 4 17.56 4 18.25c0 .414.336.75.75.75h10.5a.75.75 0 00.75-.75c0-.69-.56-1.25-1.25-1.25H14v-2.5a1.5 1.5 0 00-1.5-1.5h-.268a6.453 6.453 0 01-.684-2.202 6 6 0 002.946-1.822 5 5 0 004.503-5.152.75.75 0 00-.552-.698A31.804 31.804 0 0016 2.562v-.387a.75.75 0 00-.629-.74A33.227 33.227 0 0010 1zM2.525 4.422C3.012 4.3 3.504 4.19 4 4.09V5c0 .74.134 1.448.38 2.103a3.503 3.503 0 01-1.855-2.68zm14.95 0a3.503 3.503 0 01-1.854 2.68C15.866 6.449 16 5.74 16 5v-.91c.496.099.988.21 1.475.332z" clipRule="evenodd" />
              </svg>
              Personal Achievements
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { icon: '📚', label: 'Library Builder', value: stats.totalGames, threshold: 10, achieved: stats.totalGames >= 10 },
                { icon: '⭐', label: 'Curator', value: stats.favoriteCount, threshold: 5, achieved: stats.favoriteCount >= 5 },
                { icon: '🔥', label: 'Consistent', value: trainingStreak, threshold: 7, achieved: trainingStreak >= 7 },
                { icon: '🏆', label: 'Completionist', value: completedSessions, threshold: 10, achieved: completedSessions >= 10 },
                { icon: '🎯', label: 'Balanced', value: topics.filter(t => getBalanceStatus(stats.topicDistribution[t] || 0) !== 'low').length, threshold: 4, achieved: topics.every(t => getBalanceStatus(stats.topicDistribution[t] || 0) !== 'low') },
                { icon: '📊', label: 'Analyst', value: gamesWithEffectiveness.length, threshold: 10, achieved: gamesWithEffectiveness.length >= 10 },
                { icon: '💪', label: 'Active User', value: recentlyUsedGames.length, threshold: 15, achieved: recentlyUsedGames.length >= 15 },
                { icon: '🚀', label: 'Power User', value: sessions.length, threshold: 20, achieved: sessions.length >= 20 }
              ].map((achievement, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg text-center transition-all ${
                    achievement.achieved
                      ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700'
                      : 'bg-gray-50 dark:bg-gray-800 opacity-50'
                  }`}
                >
                  <span className={`text-2xl block mb-1 ${achievement.achieved ? '' : 'grayscale'}`}>{achievement.icon}</span>
                  <p className="text-xs font-medium text-gray-900 dark:text-white">{achievement.label}</p>
                  <p className="text-xs text-gray-500">
                    {achievement.achieved ? 'Unlocked!' : `${achievement.value}/${achievement.threshold}`}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Most Effective Games */}
          <div className="card p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Top Performing Drills
              </h2>
              {topEffectiveGames.length > 0 && (
                <button
                  onClick={() => window.location.href = '/sessions'}
                  className="text-sm text-primary-600 hover:underline"
                >
                  Build Session
                </button>
              )}
            </div>
            {topEffectiveGames.length === 0 ? (
              <div className="text-center py-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="text-3xl block mb-2">⭐</span>
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  No effectiveness data yet
                </p>
                <p className="text-sm text-gray-500">
                  Rate drills after training sessions to see your top performers
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {topEffectiveGames.map((game, idx) => (
                  <div key={game._id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      idx === 0 ? 'bg-yellow-400 text-yellow-900' :
                      idx === 1 ? 'bg-gray-300 text-gray-700' :
                      idx === 2 ? 'bg-orange-400 text-orange-900' :
                      'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {game.name}
                      </p>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <svg
                            key={star}
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 16 16"
                            fill="currentColor"
                            className={`w-3 h-3 ${
                              star <= Math.round(game.averageEffectiveness)
                                ? 'text-yellow-400'
                                : 'text-gray-300 dark:text-gray-600'
                            }`}
                          >
                            <path d="M8 1.75a.75.75 0 01.692.462l1.41 3.393 3.664.293a.75.75 0 01.428 1.317l-2.791 2.39.853 3.575a.75.75 0 01-1.12.814L8 12.093l-3.136 1.9a.75.75 0 01-1.12-.814l.852-3.574-2.79-2.39a.75.75 0 01.427-1.318l3.663-.293 1.41-3.393A.75.75 0 018 1.75z" />
                          </svg>
                        ))}
                        <span className="text-xs text-gray-500 ml-1">
                          {game.averageEffectiveness.toFixed(1)} ({game.effectivenessRatings?.length || 0} ratings)
                        </span>
                      </div>
                    </div>
                    <span className={`w-2 h-2 rounded-full ${topicColors[game.topic]}`} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                onClick={() => window.location.href = '/sessions'}
                className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors text-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 mx-auto mb-2 text-primary-600">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium text-primary-700 dark:text-primary-300">New Session</span>
              </button>
              <button
                onClick={() => window.location.href = '/ai'}
                className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors text-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 mx-auto mb-2 text-purple-600">
                  <path d="M10 1a6 6 0 00-3.815 10.631C7.237 12.5 8 13.443 8 14.456v.644a.75.75 0 00.572.729 6.016 6.016 0 002.856 0A.75.75 0 0012 15.1v-.644c0-1.013.762-1.957 1.815-2.825A6 6 0 0010 1z" />
                </svg>
                <span className="text-sm font-medium text-purple-700 dark:text-purple-300">AI Designer</span>
              </button>
              <button
                onClick={() => window.location.href = '/goals'}
                className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors text-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 mx-auto mb-2 text-green-600">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium text-green-700 dark:text-green-300">Set Goals</span>
              </button>
              <button
                onClick={() => window.location.href = '/competition'}
                className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors text-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 mx-auto mb-2 text-yellow-600">
                  <path fillRule="evenodd" d="M10 1c-1.828 0-3.623.149-5.371.435a.75.75 0 00-.629.74v.387c-.827.157-1.642.345-2.445.564a.75.75 0 00-.552.698 5 5 0 004.503 5.152 6 6 0 002.946 1.822A6.451 6.451 0 017.768 13H7.5A1.5 1.5 0 006 14.5V17h-.75C4.56 17 4 17.56 4 18.25c0 .414.336.75.75.75h10.5a.75.75 0 00.75-.75c0-.69-.56-1.25-1.25-1.25H14v-2.5a1.5 1.5 0 00-1.5-1.5h-.268a6.453 6.453 0 01-.684-2.202 6 6 0 002.946-1.822 5 5 0 004.503-5.152.75.75 0 00-.552-.698A31.804 31.804 0 0016 2.562v-.387a.75.75 0 00-.629-.74A33.227 33.227 0 0010 1z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Comp Prep</span>
              </button>
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
