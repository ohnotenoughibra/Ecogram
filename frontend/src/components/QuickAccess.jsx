import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import api from '../utils/api';

const topicColors = {
  offensive: 'bg-red-500',
  defensive: 'bg-blue-500',
  control: 'bg-purple-500',
  transition: 'bg-green-500'
};

export default function QuickAccess({ onSmartBuild }) {
  const navigate = useNavigate();
  const { sessions, games, fetchRecentGames } = useApp();
  const [recentGames, setRecentGames] = useState([]);
  const [todaySession, setTodaySession] = useState(null);
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('quickAccessCollapsed');
    return saved ? JSON.parse(saved) : false;
  });

  // Get favorites from games list
  const favoriteGames = games.filter(g => g.favorite).slice(0, 4);

  // Find today's session
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaySess = sessions.find(s => {
      if (!s.scheduledDate) return false;
      const scheduled = new Date(s.scheduledDate);
      return scheduled >= today && scheduled < tomorrow;
    });

    setTodaySession(todaySess);
  }, [sessions]);

  // Fetch recent games
  useEffect(() => {
    const loadRecent = async () => {
      const recent = await fetchRecentGames(4);
      setRecentGames(recent);
    };
    loadRecent();
  }, [fetchRecentGames]);

  // Save collapsed state
  useEffect(() => {
    localStorage.setItem('quickAccessCollapsed', JSON.stringify(collapsed));
  }, [collapsed]);

  // Get upcoming sessions (next 3 days)
  const upcomingSessions = sessions
    .filter(s => {
      if (!s.scheduledDate) return false;
      const scheduled = new Date(s.scheduledDate);
      const now = new Date();
      const threeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      return scheduled > now && scheduled <= threeDays;
    })
    .slice(0, 3);

  if (collapsed) {
    return (
      <div className="mb-6">
        <button
          onClick={() => setCollapsed(false)}
          className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z" clipRule="evenodd" />
          </svg>
          Show Quick Access
        </button>
      </div>
    );
  }

  return (
    <div className="mb-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Access</h2>
        <button
          onClick={() => setCollapsed(true)}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M14.78 11.78a.75.75 0 01-1.06 0L10 8.06l-3.72 3.72a.75.75 0 01-1.06-1.06l4.25-4.25a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Today's Session Banner */}
      {todaySession && (
        <div className="p-4 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold">Today's Training</span>
              </div>
              <p className="text-sm text-primary-100 mt-1">
                {todaySession.name} ({todaySession.games?.length || 0} games)
              </p>
            </div>
            <button
              onClick={() => navigate(`/session/${todaySession._id}`)}
              className="px-4 py-2 bg-white text-primary-600 rounded-lg font-medium hover:bg-primary-50 transition-colors"
            >
              Start Now
            </button>
          </div>
        </div>
      )}

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Smart Build */}
        <button
          onClick={onSmartBuild}
          className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 transition-colors text-left group"
        >
          <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-2 group-hover:bg-primary-200 dark:group-hover:bg-primary-900/50 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-primary-600 dark:text-primary-400">
              <path d="M15.98 1.804a1 1 0 00-1.96 0l-.24 1.192a1 1 0 01-.784.785l-1.192.238a1 1 0 000 1.962l1.192.238a1 1 0 01.785.785l.238 1.192a1 1 0 001.962 0l.238-1.192a1 1 0 01.785-.785l1.192-.238a1 1 0 000-1.962l-1.192-.238a1 1 0 01-.785-.785l-.238-1.192zM6.949 5.684a1 1 0 00-1.898 0l-.683 2.051a1 1 0 01-.633.633l-2.051.683a1 1 0 000 1.898l2.051.684a1 1 0 01.633.632l.683 2.051a1 1 0 001.898 0l.683-2.051a1 1 0 01.633-.633l2.051-.683a1 1 0 000-1.898l-2.051-.683a1 1 0 01-.633-.633L6.95 5.684z" />
            </svg>
          </div>
          <div className="text-sm font-medium text-gray-900 dark:text-white">Smart Build</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Auto-generate session</div>
        </button>

        {/* AI Designer */}
        <button
          onClick={() => navigate('/ai')}
          className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 transition-colors text-left group"
        >
          <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-2 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-purple-600 dark:text-purple-400">
              <path fillRule="evenodd" d="M4.25 2A2.25 2.25 0 002 4.25v11.5A2.25 2.25 0 004.25 18h11.5A2.25 2.25 0 0018 15.75V4.25A2.25 2.25 0 0015.75 2H4.25zm4.03 6.28a.75.75 0 00-1.06-1.06L4.97 9.47a.75.75 0 000 1.06l2.25 2.25a.75.75 0 001.06-1.06L6.56 10l1.72-1.72zm4.5-1.06a.75.75 0 10-1.06 1.06L13.44 10l-1.72 1.72a.75.75 0 101.06 1.06l2.25-2.25a.75.75 0 000-1.06l-2.25-2.25z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="text-sm font-medium text-gray-900 dark:text-white">AI Designer</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Create with AI</div>
        </button>

        {/* Sessions */}
        <button
          onClick={() => navigate('/sessions')}
          className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700 transition-colors text-left group"
        >
          <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-2 group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-green-600 dark:text-green-400">
              <path d="M3.75 3A1.75 1.75 0 002 4.75v3.26a3.235 3.235 0 011.75-.51h12.5c.644 0 1.245.188 1.75.51V6.75A1.75 1.75 0 0016.25 5h-4.836a.25.25 0 01-.177-.073L9.823 3.513A1.75 1.75 0 008.586 3H3.75zM3.75 9A1.75 1.75 0 002 10.75v4.5c0 .966.784 1.75 1.75 1.75h12.5A1.75 1.75 0 0018 15.25v-4.5A1.75 1.75 0 0016.25 9H3.75z" />
            </svg>
          </div>
          <div className="text-sm font-medium text-gray-900 dark:text-white">Sessions</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{sessions.length} sessions</div>
        </button>

        {/* Practice */}
        <button
          onClick={() => navigate('/practice')}
          className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-700 transition-colors text-left group"
        >
          <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-2 group-hover:bg-orange-200 dark:group-hover:bg-orange-900/50 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-orange-600 dark:text-orange-400">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="text-sm font-medium text-gray-900 dark:text-white">Practice</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Random drill</div>
        </button>
      </div>

      {/* Recent & Favorites Row */}
      {(recentGames.length > 0 || favoriteGames.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Recent Games */}
          {recentGames.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Recently Used</h3>
                <button
                  onClick={() => navigate('/recent')}
                  className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                >
                  View all
                </button>
              </div>
              <div className="space-y-2">
                {recentGames.map(game => (
                  <div
                    key={game._id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${topicColors[game.topic] || 'bg-gray-400'}`} />
                    <span className="truncate text-gray-700 dark:text-gray-300">{game.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Favorite Games */}
          {favoriteGames.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 text-yellow-500">
                    <path d="M8 1.75a.75.75 0 01.692.462l1.41 3.393 3.664.293a.75.75 0 01.428 1.317l-2.791 2.39.853 3.575a.75.75 0 01-1.12.814L8 12.093l-3.136 1.9a.75.75 0 01-1.12-.814l.852-3.574-2.79-2.39a.75.75 0 01.427-1.318l3.663-.293 1.41-3.393A.75.75 0 018 1.75z" />
                  </svg>
                  Favorites
                </h3>
                <button
                  onClick={() => navigate('/favorites')}
                  className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                >
                  View all
                </button>
              </div>
              <div className="space-y-2">
                {favoriteGames.map(game => (
                  <div
                    key={game._id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${topicColors[game.topic] || 'bg-gray-400'}`} />
                    <span className="truncate text-gray-700 dark:text-gray-300">{game.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Upcoming Sessions */}
      {upcomingSessions.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Upcoming Sessions</h3>
            <button
              onClick={() => navigate('/sessions')}
              className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
            >
              View all
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
            {upcomingSessions.map(session => (
              <button
                key={session._id}
                onClick={() => navigate(`/session/${session._id}`)}
                className="flex-shrink-0 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left min-w-[140px]"
              >
                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {session.name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {new Date(session.scheduledDate).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  })}
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {session.games?.length || 0} games
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
