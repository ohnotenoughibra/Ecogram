import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const playlistDefinitions = [
  {
    id: 'not-trained-30',
    name: 'Not Trained in 30+ Days',
    description: 'Games you haven\'t used recently',
    icon: '😴',
    color: 'from-orange-500 to-red-500',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-200 dark:border-orange-800',
    filter: (games) => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return games.filter(g => g.lastUsed && new Date(g.lastUsed) < thirtyDaysAgo);
    }
  },
  {
    id: 'never-used',
    name: 'Never Used',
    description: 'Games waiting to be tried',
    icon: '🆕',
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    filter: (games) => games.filter(g => !g.lastUsed && g.usageCount === 0)
  },
  {
    id: 'high-difficulty',
    name: 'Advanced Challenges',
    description: 'High difficulty games for tough sessions',
    icon: '🔥',
    color: 'from-red-500 to-pink-500',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    filter: (games) => games.filter(g => g.difficulty === 'advanced')
  },
  {
    id: 'beginner-friendly',
    name: 'Beginner Friendly',
    description: 'Great for fundamentals and warm-ups',
    icon: '🌱',
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
    filter: (games) => games.filter(g => g.difficulty === 'beginner')
  },
  {
    id: 'top-rated',
    name: 'Top Performers',
    description: 'Your highest rated games',
    icon: '⭐',
    color: 'from-yellow-500 to-amber-500',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    filter: (games) => games
      .filter(g => g.averageEffectiveness >= 4)
      .sort((a, b) => b.averageEffectiveness - a.averageEffectiveness)
  },
  {
    id: 'most-used',
    name: 'All-Time Favorites',
    description: 'Your most frequently used games',
    icon: '🏆',
    color: 'from-purple-500 to-indigo-500',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-200 dark:border-purple-800',
    filter: (games) => games
      .filter(g => g.usageCount > 0)
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 10)
  },
  {
    id: 'recently-added',
    name: 'Recently Added',
    description: 'Your newest games',
    icon: '✨',
    color: 'from-teal-500 to-cyan-500',
    bgColor: 'bg-teal-50 dark:bg-teal-900/20',
    borderColor: 'border-teal-200 dark:border-teal-800',
    filter: (games) => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return games.filter(g => new Date(g.createdAt) > sevenDaysAgo);
    }
  },
  {
    id: 'warmup-games',
    name: 'Warmup Collection',
    description: 'Perfect for session starters',
    icon: '🏃',
    color: 'from-orange-400 to-yellow-500',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-200 dark:border-orange-800',
    filter: (games) => games.filter(g => g.gameType === 'warmup')
  },
  {
    id: 'favorites-stale',
    name: 'Forgotten Favorites',
    description: 'Starred games not used in 14+ days',
    icon: '💔',
    color: 'from-pink-500 to-rose-500',
    bgColor: 'bg-pink-50 dark:bg-pink-900/20',
    borderColor: 'border-pink-200 dark:border-pink-800',
    filter: (games) => {
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
      return games.filter(g =>
        g.isFavorite &&
        (!g.lastUsed || new Date(g.lastUsed) < fourteenDaysAgo)
      );
    }
  },
  {
    id: 'leg-lock-focus',
    name: 'Leg Lock Games',
    description: 'All games involving leg attacks',
    icon: '🦵',
    color: 'from-violet-500 to-purple-500',
    bgColor: 'bg-violet-50 dark:bg-violet-900/20',
    borderColor: 'border-violet-200 dark:border-violet-800',
    filter: (games) => games.filter(g =>
      g.position === 'leg-locks' ||
      g.name?.toLowerCase().includes('leg') ||
      g.name?.toLowerCase().includes('heel') ||
      g.techniques?.some(t => t.toLowerCase().includes('leg') || t.toLowerCase().includes('heel'))
    )
  }
];

export default function SmartPlaylists({ compact = false, onSelectPlaylist }) {
  const { games } = useApp();
  const navigate = useNavigate();
  const [expandedPlaylist, setExpandedPlaylist] = useState(null);
  const [showAll, setShowAll] = useState(false);

  // Calculate which playlists have games
  const playlists = useMemo(() => {
    return playlistDefinitions
      .map(def => ({
        ...def,
        games: def.filter(games),
        count: def.filter(games).length
      }))
      .filter(p => p.count > 0);
  }, [games]);

  // Show only top playlists initially
  const visiblePlaylists = showAll ? playlists : playlists.slice(0, 6);

  const handlePlaylistClick = (playlist) => {
    if (expandedPlaylist === playlist.id) {
      setExpandedPlaylist(null);
    } else {
      setExpandedPlaylist(playlist.id);
    }

    if (onSelectPlaylist) {
      onSelectPlaylist(playlist);
    }
  };

  const handleUsePlaylist = (playlist) => {
    // Navigate to sessions with these games pre-selected
    navigate('/sessions', {
      state: {
        smartPlaylist: playlist.id,
        gameIds: playlist.games.map(g => g._id)
      }
    });
  };

  if (playlists.length === 0) {
    return null;
  }

  if (compact) {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-primary-500">
              <path fillRule="evenodd" d="M3.5 2A1.5 1.5 0 002 3.5V5c0 1.149.15 2.263.43 3.326a13.022 13.022 0 009.244 9.244c1.063.28 2.177.43 3.326.43h1.5a1.5 1.5 0 001.5-1.5v-1.148a1.5 1.5 0 00-1.175-1.465l-3.223-.716a1.5 1.5 0 00-1.767 1.052l-.267.933a.85.85 0 01-.998.544 11.27 11.27 0 01-5.212-5.212.85.85 0 01.544-.998l.933-.267a1.5 1.5 0 001.052-1.767L9.613 3.675A1.5 1.5 0 008.148 2.5H3.5z" clipRule="evenodd" />
            </svg>
            Smart Playlists
          </h3>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
          {playlists.slice(0, 5).map(playlist => (
            <button
              key={playlist.id}
              onClick={() => handlePlaylistClick(playlist)}
              className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border transition-all hover:shadow-md ${playlist.bgColor} ${playlist.borderColor}`}
            >
              <span className="text-lg">{playlist.icon}</span>
              <div className="text-left">
                <p className="text-xs font-medium text-gray-900 dark:text-white whitespace-nowrap">
                  {playlist.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {playlist.count} game{playlist.count !== 1 ? 's' : ''}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-primary-500">
            <path d="M17 4.517v9.301L5.433 2.252a41.44 41.44 0 019.637.058c.757.08 1.492.196 2.199.344a.75.75 0 00-.262 1.476 39.898 39.898 0 00-1.878-.314L17 4.517z" />
            <path fillRule="evenodd" d="M3 17.25V5.75a.75.75 0 011.166-.626L17.25 12.5V4.517L15.129 3.81a39.902 39.902 0 00-9.696-.066A.75.75 0 005 4.478V2.75a.75.75 0 00-1.5 0V4h-.75a.75.75 0 00-.75.75v12.5a.75.75 0 00.75.75H17.25a.75.75 0 000-1.5H3.75v-.25zm1.5-.75V7.06l11.25 6.19-11.25-6.19v9.44z" clipRule="evenodd" />
          </svg>
          Smart Playlists
        </h3>
        {playlists.length > 6 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            {showAll ? 'Show less' : `Show all (${playlists.length})`}
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {visiblePlaylists.map(playlist => (
          <div key={playlist.id} className="relative">
            <button
              onClick={() => handlePlaylistClick(playlist)}
              className={`w-full p-4 rounded-xl border transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] text-left ${playlist.bgColor} ${playlist.borderColor} ${
                expandedPlaylist === playlist.id ? 'ring-2 ring-primary-500 shadow-lg' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-2xl">{playlist.icon}</span>
                <span className={`text-xs font-bold px-2 py-1 rounded-full bg-gradient-to-r ${playlist.color} text-white`}>
                  {playlist.count}
                </span>
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                {playlist.name}
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                {playlist.description}
              </p>
            </button>

            {/* Expanded view */}
            {expandedPlaylist === playlist.id && (
              <div className="absolute top-full left-0 right-0 mt-2 z-20 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 animate-fade-in">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {playlist.name}
                  </h4>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedPlaylist(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto mb-3">
                  {playlist.games.slice(0, 5).map(game => (
                    <div
                      key={game._id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50"
                    >
                      <span className={`w-2 h-2 rounded-full ${
                        game.topic === 'offensive' ? 'bg-red-500' :
                        game.topic === 'defensive' ? 'bg-blue-500' :
                        game.topic === 'control' ? 'bg-purple-500' :
                        'bg-green-500'
                      }`} />
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1">
                        {game.name}
                      </span>
                    </div>
                  ))}
                  {playlist.games.length > 5 && (
                    <p className="text-xs text-gray-500 text-center py-1">
                      +{playlist.games.length - 5} more games
                    </p>
                  )}
                </div>

                <button
                  onClick={() => handleUsePlaylist(playlist)}
                  className="w-full btn-primary text-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" clipRule="evenodd" />
                  </svg>
                  Create Session from Playlist
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
