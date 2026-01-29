import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Loading from '../components/Loading';

const topicLabels = {
  offensive: 'Offensive / Submissions',
  defensive: 'Defensive / Escapes',
  control: 'Control / Passing',
  transition: 'Transition / Scrambles',
  competition: 'Competition / Match Sim'
};

const topicColors = {
  offensive: { bg: 'bg-red-500', light: 'bg-red-100 dark:bg-red-900/20', text: 'text-red-600 dark:text-red-400' },
  defensive: { bg: 'bg-blue-500', light: 'bg-blue-100 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400' },
  control: { bg: 'bg-purple-500', light: 'bg-purple-100 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400' },
  transition: { bg: 'bg-green-500', light: 'bg-green-100 dark:bg-green-900/20', text: 'text-green-600 dark:text-green-400' },
  competition: { bg: 'bg-orange-500', light: 'bg-orange-100 dark:bg-orange-900/20', text: 'text-orange-600 dark:text-orange-400' }
};

const positionLabels = {
  'closed-guard': { name: 'Closed Guard', icon: '🛡️' },
  'open-guard': { name: 'Open Guard', icon: '🦶' },
  'half-guard': { name: 'Half Guard', icon: '½' },
  'mount': { name: 'Mount', icon: '⬆️' },
  'side-control': { name: 'Side Control', icon: '➡️' },
  'back-control': { name: 'Back Control', icon: '🔙' },
  'standing': { name: 'Standing', icon: '🧍' },
  'turtle': { name: 'Turtle', icon: '🐢' },
  'leg-locks': { name: 'Leg Locks', icon: '🦵' }
};

export default function Stats() {
  const { stats, statsLoading, fetchStats, games, sessions } = useApp();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [animatedBars, setAnimatedBars] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    setAnimatedBars(false);
    const timer = setTimeout(() => setAnimatedBars(true), 100);
    return () => clearTimeout(timer);
  }, [activeTab]);

  // Calculate all metrics
  const metrics = useMemo(() => {
    if (!stats) return null;

    const topics = ['offensive', 'defensive', 'control', 'transition', 'competition'];
    const totalTopics = topics.reduce((sum, t) => sum + (stats.topicDistribution[t] || 0), 0);
    const maxTopicCount = Math.max(...topics.map(t => stats.topicDistribution[t] || 0), 1);

    // Training streak
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

    // 30-day activity
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentlyUsedGames = games.filter(g => g.lastUsed && new Date(g.lastUsed) > thirtyDaysAgo);

    // Weekly usage
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

    // Effectiveness
    const gamesWithEffectiveness = games.filter(g => g.averageEffectiveness > 0);
    const topEffectiveGames = [...gamesWithEffectiveness]
      .sort((a, b) => b.averageEffectiveness - a.averageEffectiveness)
      .slice(0, 5);
    const avgEffectiveness = gamesWithEffectiveness.length > 0
      ? (gamesWithEffectiveness.reduce((sum, g) => sum + g.averageEffectiveness, 0) / gamesWithEffectiveness.length).toFixed(1)
      : 0;

    // Game type distribution
    const gameTypeDistribution = {
      warmup: games.filter(g => g.gameType === 'warmup').length,
      main: games.filter(g => !g.gameType || g.gameType === 'main').length,
      cooldown: games.filter(g => g.gameType === 'cooldown').length
    };

    // Difficulty distribution
    const difficultyDistribution = {
      beginner: games.filter(g => g.difficulty === 'beginner').length,
      intermediate: games.filter(g => !g.difficulty || g.difficulty === 'intermediate').length,
      advanced: games.filter(g => g.difficulty === 'advanced').length
    };

    // Position coverage
    const positionCoverage = {};
    Object.keys(positionLabels).forEach(pos => {
      positionCoverage[pos] = games.filter(g => g.position === pos).length;
    });

    // Balance score (0-100)
    const balanceScore = (() => {
      if (totalTopics === 0) return 0;
      const ideal = totalTopics / 4;
      const deviations = topics.map(t => Math.abs((stats.topicDistribution[t] || 0) - ideal));
      const avgDeviation = deviations.reduce((a, b) => a + b, 0) / 4;
      return Math.max(0, Math.round(100 - (avgDeviation / ideal) * 100));
    })();

    // Sessions completed
    const completedSessions = sessions.filter(s =>
      s.games.length > 0 && s.games.every(g => g.completed)
    ).length;

    return {
      topics,
      totalTopics,
      maxTopicCount,
      trainingStreak: calculateStreak(),
      recentlyUsedGames,
      weeklyUsage,
      gamesWithEffectiveness,
      topEffectiveGames,
      avgEffectiveness,
      gameTypeDistribution,
      difficultyDistribution,
      positionCoverage,
      balanceScore,
      completedSessions,
      unusedGames: games.filter(g => !g.lastUsed || g.usageCount === 0)
    };
  }, [stats, games, sessions]);

  if (statsLoading || !stats || !metrics) {
    return <Loading text="Loading analytics..." />;
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'insights', label: 'Insights', icon: '💡' },
    { id: 'progress', label: 'Progress', icon: '🎯' }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header with Streak */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 text-primary-500">
              <path d="M15.5 2A1.5 1.5 0 0014 3.5v13a1.5 1.5 0 001.5 1.5h1a1.5 1.5 0 001.5-1.5v-13A1.5 1.5 0 0016.5 2h-1zM9.5 6A1.5 1.5 0 008 7.5v9A1.5 1.5 0 009.5 18h1a1.5 1.5 0 001.5-1.5v-9A1.5 1.5 0 0010.5 6h-1zM3.5 10A1.5 1.5 0 002 11.5v5A1.5 1.5 0 003.5 18h1A1.5 1.5 0 006 16.5v-5A1.5 1.5 0 004.5 10h-1z" />
            </svg>
            Training Analytics
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Your training insights at a glance
          </p>
        </div>

        {/* Streak Badge */}
        {metrics.trainingStreak > 0 && (
          <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl ${
            metrics.trainingStreak >= 7
              ? 'bg-gradient-to-r from-orange-500 to-red-500'
              : metrics.trainingStreak >= 3
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                : 'bg-gradient-to-r from-blue-500 to-primary-500'
          } text-white shadow-lg animate-fire-pulse`}>
            <span className="text-xl">🔥</span>
            <div>
              <span className="text-lg font-bold">{metrics.trainingStreak}</span>
              <span className="text-xs ml-1 opacity-90">day streak</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <QuickStatCard
          label="Total Games"
          value={stats.totalGames}
          icon="📚"
          color="primary"
          onClick={() => navigate('/')}
        />
        <QuickStatCard
          label="Active (30d)"
          value={metrics.recentlyUsedGames.length}
          icon="🎯"
          color="green"
          trend={metrics.weeklyUsage[3]?.count > metrics.weeklyUsage[2]?.count ? 'up' : metrics.weeklyUsage[3]?.count < metrics.weeklyUsage[2]?.count ? 'down' : null}
        />
        <QuickStatCard
          label="Avg Rating"
          value={metrics.avgEffectiveness || '—'}
          icon="⭐"
          color="yellow"
          suffix="/5"
        />
        <QuickStatCard
          label="Balance"
          value={metrics.balanceScore}
          icon="⚖️"
          color={metrics.balanceScore >= 70 ? 'green' : metrics.balanceScore >= 40 ? 'yellow' : 'red'}
          suffix="%"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
              activeTab === tab.id
                ? 'bg-white dark:bg-gray-900 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6 animate-fade-in">
          {/* Topic Balance */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Topic Distribution
              </h2>
              <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                metrics.balanceScore >= 70
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : metrics.balanceScore >= 40
                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {metrics.balanceScore}% balanced
              </span>
            </div>

            <div className="space-y-4">
              {metrics.topics.map(topic => {
                const count = stats.topicDistribution[topic] || 0;
                const percentage = metrics.totalTopics > 0 ? Math.round((count / metrics.totalTopics) * 100) : 0;
                const colors = topicColors[topic];

                return (
                  <div key={topic} className="group">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${colors.bg}`} />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {topicLabels[topic]}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {count} <span className="text-xs">({percentage}%)</span>
                      </span>
                    </div>
                    <div
                      className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden cursor-pointer group-hover:h-4 transition-all"
                      onClick={() => navigate(`/?topic=${topic}`)}
                    >
                      <div
                        className={`h-full ${colors.bg} rounded-full transition-all duration-700 ease-out`}
                        style={{ width: animatedBars ? `${(count / metrics.maxTopicCount) * 100}%` : '0%' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Most Used */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span>🏆</span> Most Used
              </h3>
              {stats.mostUsed.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-6 text-sm">
                  Start training to see your most used games
                </p>
              ) : (
                <div className="space-y-3">
                  {stats.mostUsed.slice(0, 5).map((game, idx) => (
                    <div key={game._id} className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        idx === 0 ? 'bg-yellow-400 text-yellow-900' :
                        idx === 1 ? 'bg-gray-300 text-gray-700' :
                        idx === 2 ? 'bg-orange-400 text-orange-900' :
                        'bg-gray-100 dark:bg-gray-700 text-gray-500'
                      }`}>
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {game.name}
                        </p>
                        <p className="text-xs text-gray-500">{game.usageCount} uses</p>
                      </div>
                      <span className={`w-2 h-2 rounded-full ${topicColors[game.topic]?.bg || 'bg-gray-400'}`} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Rated */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span>⭐</span> Top Rated
              </h3>
              {metrics.topEffectiveGames.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-6 text-sm">
                  Rate games after sessions to see your best performers
                </p>
              ) : (
                <div className="space-y-3">
                  {metrics.topEffectiveGames.map((game, idx) => (
                    <div key={game._id} className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        idx === 0 ? 'bg-yellow-400 text-yellow-900' :
                        'bg-gray-100 dark:bg-gray-700 text-gray-500'
                      }`}>
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {game.name}
                        </p>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map(star => (
                            <svg
                              key={star}
                              className={`w-3 h-3 ${star <= Math.round(game.averageEffectiveness) ? 'text-yellow-400' : 'text-gray-300'}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                          <span className="text-xs text-gray-500 ml-1">{game.averageEffectiveness.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Activity Heatmap */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span>📅</span> Last 4 Weeks
              </h3>
              <button
                onClick={() => navigate('/goals')}
                className="text-sm text-primary-600 hover:underline"
              >
                Set Goals
              </button>
            </div>
            <TrainingCalendar games={games} />
          </div>
        </div>
      )}

      {/* Insights Tab */}
      {activeTab === 'insights' && (
        <div className="space-y-6 animate-fade-in">
          {/* Insights Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <InsightCard
              icon="🔥"
              label="Streak"
              value={metrics.trainingStreak}
              subtext={metrics.trainingStreak >= 7 ? "On fire!" : metrics.trainingStreak >= 3 ? "Keep going!" : "Build momentum"}
              color="orange"
            />
            <InsightCard
              icon="📊"
              label="Games Rated"
              value={metrics.gamesWithEffectiveness.length}
              subtext={`${stats.totalGames > 0 ? Math.round((metrics.gamesWithEffectiveness.length / stats.totalGames) * 100) : 0}% of library`}
              color="blue"
            />
            <InsightCard
              icon="🆕"
              label="Unused"
              value={metrics.unusedGames.length}
              subtext="Games to try"
              color="purple"
              onClick={() => navigate('/')}
            />
            <InsightCard
              icon="✅"
              label="Sessions Done"
              value={metrics.completedSessions}
              subtext={`of ${sessions.length} total`}
              color="green"
            />
          </div>

          {/* Weekly Activity Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Weekly Training Activity
            </h3>
            <div className="space-y-3">
              {metrics.weeklyUsage.map((week, idx) => {
                const maxCount = Math.max(...metrics.weeklyUsage.map(w => w.count), 1);
                return (
                  <div key={idx} className="flex items-center gap-4">
                    <span className="text-sm text-gray-500 w-16">{week.week}</span>
                    <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-700"
                        style={{ width: animatedBars ? `${(week.count / maxCount) * 100}%` : '0%' }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-12 text-right">
                      {week.count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recommendations */}
          <RecommendationsCard
            stats={stats}
            metrics={metrics}
            navigate={navigate}
          />

          {/* Achievements */}
          <AchievementsCard
            stats={stats}
            metrics={metrics}
            sessions={sessions}
          />
        </div>
      )}

      {/* Progress Tab */}
      {activeTab === 'progress' && (
        <div className="space-y-6 animate-fade-in">
          {/* Position Coverage */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span>🗺️</span> Position Coverage
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(positionLabels).map(([pos, info]) => {
                const count = metrics.positionCoverage[pos] || 0;
                const hasGames = count > 0;
                return (
                  <div
                    key={pos}
                    className={`p-3 rounded-xl border transition-all cursor-pointer hover:shadow-md ${
                      hasGames
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 opacity-60'
                    }`}
                    onClick={() => navigate(`/?position=${pos}`)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{info.icon}</span>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {info.name}
                      </span>
                    </div>
                    <p className={`text-lg font-bold ${hasGames ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                      {count}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Library Composition */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Game Types */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Game Types
              </h3>
              <div className="space-y-3">
                {[
                  { key: 'warmup', label: 'Warmup', icon: '🏃', color: 'orange' },
                  { key: 'main', label: 'Main', icon: '🎯', color: 'blue' },
                  { key: 'cooldown', label: 'Cooldown', icon: '🧘', color: 'teal' }
                ].map(type => {
                  const count = metrics.gameTypeDistribution[type.key];
                  const total = Object.values(metrics.gameTypeDistribution).reduce((a, b) => a + b, 0);
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={type.key} className="flex items-center gap-3">
                      <span className="text-xl">{type.icon}</span>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{type.label}</span>
                          <span className="text-sm text-gray-500">{count} ({pct}%)</span>
                        </div>
                        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-${type.color}-500 rounded-full transition-all duration-700`}
                            style={{ width: animatedBars ? `${pct}%` : '0%' }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Difficulty */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Difficulty Levels
              </h3>
              <div className="space-y-3">
                {[
                  { key: 'beginner', label: 'Beginner', icon: '🟢', color: 'green' },
                  { key: 'intermediate', label: 'Intermediate', icon: '🟡', color: 'yellow' },
                  { key: 'advanced', label: 'Advanced', icon: '🔴', color: 'red' }
                ].map(diff => {
                  const count = metrics.difficultyDistribution[diff.key];
                  const total = Object.values(metrics.difficultyDistribution).reduce((a, b) => a + b, 0);
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={diff.key} className="flex items-center gap-3">
                      <span className="text-xl">{diff.icon}</span>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{diff.label}</span>
                          <span className="text-sm text-gray-500">{count} ({pct}%)</span>
                        </div>
                        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-${diff.color}-500 rounded-full transition-all duration-700`}
                            style={{ width: animatedBars ? `${pct}%` : '0%' }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Learning Milestones */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span>🏅</span> Learning Journey
            </h3>
            <MilestonesTimeline stats={stats} metrics={metrics} sessions={sessions} />
          </div>

          {/* Skills Cloud */}
          {stats.skillsFrequency.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Top Skills & Techniques
              </h3>
              <div className="flex flex-wrap gap-2">
                {stats.skillsFrequency.map((skill, idx) => (
                  <span
                    key={skill._id}
                    className="px-3 py-1.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full text-sm font-medium"
                    style={{
                      fontSize: `${Math.max(0.75, 1 - idx * 0.03)}rem`,
                      opacity: Math.max(0.6, 1 - idx * 0.05)
                    }}
                  >
                    {skill._id}
                    <span className="text-xs ml-1 opacity-60">({skill.count})</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Sub-components

function QuickStatCard({ label, value, icon, color, trend, suffix, onClick }) {
  const colorClasses = {
    primary: 'text-primary-600 dark:text-primary-400',
    green: 'text-green-600 dark:text-green-400',
    yellow: 'text-yellow-600 dark:text-yellow-400',
    red: 'text-red-600 dark:text-red-400'
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 ${onClick ? 'cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all' : ''}`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-lg">{icon}</span>
        {trend && (
          <span className={trend === 'up' ? 'text-green-500' : 'text-red-500'}>
            {trend === 'up' ? '↑' : '↓'}
          </span>
        )}
      </div>
      <p className={`text-2xl font-bold ${colorClasses[color]}`}>
        {value}{suffix}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}

function InsightCard({ icon, label, value, subtext, color, onClick }) {
  const bgColors = {
    orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
  };

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-xl border ${bgColors[color]} ${onClick ? 'cursor-pointer hover:shadow-md transition-all' : ''}`}
    >
      <span className="text-2xl block mb-2">{icon}</span>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-xs text-gray-600 dark:text-gray-400">{label}</p>
      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{subtext}</p>
    </div>
  );
}

function TrainingCalendar({ games }) {
  const trainingDates = new Set(
    games.filter(g => g.lastUsed).map(g => new Date(g.lastUsed).toDateString())
  );

  const days = [];
  const today = new Date();

  for (let i = 27; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toDateString();
    const isTraining = trainingDates.has(dateStr);
    const isToday = i === 0;

    days.push(
      <div
        key={i}
        className={`aspect-square rounded-md flex items-center justify-center text-xs transition-all ${
          isTraining
            ? 'bg-green-500 text-white font-medium'
            : isToday
              ? 'bg-primary-100 dark:bg-primary-900/30 border-2 border-primary-500 text-primary-700 dark:text-primary-300'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
        }`}
        title={`${date.toLocaleDateString()}${isTraining ? ' - Trained!' : ''}`}
      >
        {date.getDate()}
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <div key={i} className="text-xs text-center text-gray-400">{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days}
      </div>
      <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
        <span>Less active</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm bg-gray-200 dark:bg-gray-700" />
          <div className="w-3 h-3 rounded-sm bg-green-300" />
          <div className="w-3 h-3 rounded-sm bg-green-500" />
        </div>
        <span>More active</span>
      </div>
    </div>
  );
}

function RecommendationsCard({ stats, metrics, navigate }) {
  const topics = ['offensive', 'defensive', 'control', 'transition', 'competition'];
  const recommendations = [];

  // Low topic coverage
  topics.forEach(topic => {
    const count = stats.topicDistribution[topic] || 0;
    const percentage = metrics.totalTopics > 0 ? (count / metrics.totalTopics) * 100 : 0;
    if (percentage < 15 && metrics.totalTopics > 5) {
      recommendations.push({
        type: 'topic',
        priority: 'high',
        message: `Add more ${topicLabels[topic].split('/')[0].toLowerCase()} games`,
        icon: '🎯',
        action: () => navigate('/ai')
      });
    }
  });

  // Unused games
  if (metrics.unusedGames.length > 5) {
    recommendations.push({
      type: 'unused',
      priority: 'medium',
      message: `${metrics.unusedGames.length} games never used - try them!`,
      icon: '📋',
      action: () => navigate('/')
    });
  }

  // Low warmup/cooldown
  if (metrics.gameTypeDistribution.warmup < 3) {
    recommendations.push({
      type: 'warmup',
      priority: 'medium',
      message: 'Add warmup games for complete sessions',
      icon: '🏃',
      action: () => navigate('/ai')
    });
  }

  if (recommendations.length === 0) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-green-200 dark:border-green-800 text-center">
        <span className="text-4xl block mb-2">🎉</span>
        <h3 className="text-lg font-semibold text-green-700 dark:text-green-400">
          Your training is well-balanced!
        </h3>
        <p className="text-sm text-green-600 dark:text-green-500 mt-1">
          Keep up the excellent work
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <span>💡</span> Smart Recommendations
      </h3>
      <div className="space-y-3">
        {recommendations.slice(0, 4).map((rec, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-3 p-3 rounded-xl ${
              rec.priority === 'high'
                ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
            }`}
          >
            <span className="text-xl">{rec.icon}</span>
            <p className="flex-1 text-sm text-gray-700 dark:text-gray-300">{rec.message}</p>
            {rec.action && (
              <button
                onClick={rec.action}
                className="text-xs px-3 py-1.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Go
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function AchievementsCard({ stats, metrics, sessions }) {
  const topics = ['offensive', 'defensive', 'control', 'transition', 'competition'];

  const achievements = [
    { icon: '📚', label: 'Library Builder', achieved: stats.totalGames >= 10, progress: `${Math.min(stats.totalGames, 10)}/10` },
    { icon: '⭐', label: 'Curator', achieved: stats.favoriteCount >= 5, progress: `${Math.min(stats.favoriteCount, 5)}/5` },
    { icon: '🔥', label: '7-Day Streak', achieved: metrics.trainingStreak >= 7, progress: `${Math.min(metrics.trainingStreak, 7)}/7` },
    { icon: '🏆', label: 'Session Master', achieved: metrics.completedSessions >= 10, progress: `${Math.min(metrics.completedSessions, 10)}/10` },
    { icon: '⚖️', label: 'Balanced', achieved: metrics.balanceScore >= 70, progress: `${metrics.balanceScore}%` },
    { icon: '📊', label: 'Analyst', achieved: metrics.gamesWithEffectiveness.length >= 10, progress: `${Math.min(metrics.gamesWithEffectiveness.length, 10)}/10` }
  ];

  const unlockedCount = achievements.filter(a => a.achieved).length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <span>🏅</span> Achievements
        </h3>
        <span className="text-sm text-gray-500">{unlockedCount}/{achievements.length} unlocked</span>
      </div>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {achievements.map((achievement, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-xl text-center transition-all ${
              achievement.achieved
                ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700'
                : 'bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 opacity-50'
            }`}
          >
            <span className={`text-2xl block mb-1 ${achievement.achieved ? '' : 'grayscale'}`}>
              {achievement.icon}
            </span>
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{achievement.label}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {achievement.achieved ? '✓' : achievement.progress}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function MilestonesTimeline({ stats, metrics, sessions }) {
  const topics = ['offensive', 'defensive', 'control', 'transition', 'competition'];

  const milestones = [
    { icon: '🌱', label: 'First Game', achieved: stats.totalGames >= 1 },
    { icon: '📚', label: '10 Games', achieved: stats.totalGames >= 10 },
    { icon: '✅', label: 'First Session', achieved: sessions.some(s => s.games?.every(g => g.completed)) },
    { icon: '🎨', label: 'All Topics', achieved: topics.every(t => (stats.topicDistribution[t] || 0) > 0) },
    { icon: '📖', label: '25 Games', achieved: stats.totalGames >= 25 },
    { icon: '🔥', label: '7-Day Streak', achieved: metrics.trainingStreak >= 7 },
    { icon: '🏆', label: '50 Games', achieved: stats.totalGames >= 50 }
  ];

  const lastAchieved = milestones.reduce((last, m, idx) => m.achieved ? idx : last, -1);

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

      <div className="space-y-4">
        {milestones.map((milestone, idx) => (
          <div key={idx} className="relative flex items-center gap-4">
            {/* Dot */}
            <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm ${
              milestone.achieved
                ? 'bg-green-500 text-white'
                : idx === lastAchieved + 1
                  ? 'bg-primary-100 dark:bg-primary-900/30 border-2 border-primary-500 text-primary-700'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
            }`}>
              {milestone.achieved ? '✓' : milestone.icon}
            </div>

            {/* Content */}
            <div className={`flex-1 ${milestone.achieved ? '' : 'opacity-50'}`}>
              <p className={`font-medium ${milestone.achieved ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
                {milestone.label}
              </p>
            </div>

            {/* Status */}
            {milestone.achieved && (
              <span className="text-green-500 text-sm">Completed</span>
            )}
            {!milestone.achieved && idx === lastAchieved + 1 && (
              <span className="text-primary-500 text-sm">In Progress</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
