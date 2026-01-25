import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

export default function DrillChainManager({ game, onLinkUpdated }) {
  const { games, showToast } = useApp();
  const [showPicker, setShowPicker] = useState(null); // 'previous' | 'next' | null
  const [searchTerm, setSearchTerm] = useState('');

  // Filter games that can be linked (exclude self and already linked)
  const availableGames = games.filter(g => {
    if (g._id === game?._id) return false;
    if (game?.linkedGames?.previous === g._id) return false;
    if (game?.linkedGames?.next === g._id) return false;
    if (searchTerm) {
      return g.name.toLowerCase().includes(searchTerm.toLowerCase());
    }
    return true;
  });

  // Find linked games
  const previousGame = games.find(g => g._id === game?.linkedGames?.previous);
  const nextGame = games.find(g => g._id === game?.linkedGames?.next);

  const handleLink = (targetGameId, linkType) => {
    onLinkUpdated({
      ...game.linkedGames,
      [linkType]: targetGameId
    });
    setShowPicker(null);
    setSearchTerm('');
    showToast(`Drill ${linkType === 'previous' ? 'pre-requisite' : 'progression'} linked`, 'success');
  };

  const handleUnlink = (linkType) => {
    onLinkUpdated({
      ...game.linkedGames,
      [linkType]: null
    });
    showToast(`Drill ${linkType === 'previous' ? 'pre-requisite' : 'progression'} unlinked`, 'success');
  };

  if (!game) return null;

  return (
    <div className="space-y-3">
      <label className="label flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-primary-500">
          <path fillRule="evenodd" d="M15.621 4.379a3 3 0 00-4.242 0l-7 7a3 3 0 004.241 4.243h.001l.497-.5a.75.75 0 011.064 1.057l-.498.501-.002.002a4.5 4.5 0 01-6.364-6.364l7-7a4.5 4.5 0 016.368 6.36l-3.455 3.553A2.625 2.625 0 119.52 9.52l3.45-3.451a.75.75 0 111.061 1.06l-3.45 3.451a1.125 1.125 0 001.587 1.595l3.454-3.553a3 3 0 000-4.242z" clipRule="evenodd" />
        </svg>
        Drill Progression Chain
      </label>

      <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        {/* Chain visualization */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {/* Previous */}
          <div className="flex-1 text-center">
            {previousGame ? (
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg relative group">
                <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Pre-requisite</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{previousGame.name}</p>
                <button
                  type="button"
                  onClick={() => handleUnlink('previous')}
                  className="absolute -top-2 -right-2 p-1 bg-red-100 dark:bg-red-900/30 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                    <path d="M5.28 4.22a.75.75 0 00-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 101.06 1.06L8 9.06l2.72 2.72a.75.75 0 101.06-1.06L9.06 8l2.72-2.72a.75.75 0 00-1.06-1.06L8 6.94 5.28 4.22z" />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowPicker('previous')}
                className="w-full p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 hover:border-primary-400 hover:text-primary-500 transition-colors"
              >
                <p className="text-xs mb-1">Add Pre-requisite</p>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mx-auto">
                  <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                </svg>
              </button>
            )}
          </div>

          {/* Arrow */}
          <div className="flex items-center text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
            </svg>
          </div>

          {/* Current */}
          <div className="flex-1 text-center">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg border-2 border-primary-500">
              <p className="text-xs text-primary-600 dark:text-primary-400 mb-1">Current</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{game.name}</p>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex items-center text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
            </svg>
          </div>

          {/* Next */}
          <div className="flex-1 text-center">
            {nextGame ? (
              <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg relative group">
                <p className="text-xs text-green-600 dark:text-green-400 mb-1">Progression</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{nextGame.name}</p>
                <button
                  type="button"
                  onClick={() => handleUnlink('next')}
                  className="absolute -top-2 -right-2 p-1 bg-red-100 dark:bg-red-900/30 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                    <path d="M5.28 4.22a.75.75 0 00-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 101.06 1.06L8 9.06l2.72 2.72a.75.75 0 101.06-1.06L9.06 8l2.72-2.72a.75.75 0 00-1.06-1.06L8 6.94 5.28 4.22z" />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowPicker('next')}
                className="w-full p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 hover:border-primary-400 hover:text-primary-500 transition-colors"
              >
                <p className="text-xs mb-1">Add Progression</p>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mx-auto">
                  <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Game picker */}
        {showPicker && (
          <div className="mt-3 border-t border-gray-200 dark:border-gray-700 pt-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Select {showPicker === 'previous' ? 'Pre-requisite' : 'Progression'} Drill
              </p>
              <button
                type="button"
                onClick={() => {
                  setShowPicker(null);
                  setSearchTerm('');
                }}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>

            <input
              type="text"
              placeholder="Search drills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input text-sm mb-2"
              autoFocus
            />

            <div className="max-h-40 overflow-y-auto space-y-1">
              {availableGames.slice(0, 10).map(g => (
                <button
                  key={g._id}
                  type="button"
                  onClick={() => handleLink(g._id, showPicker)}
                  className="w-full text-left p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <span className={`w-2 h-2 rounded-full ${
                    g.topic === 'offensive' ? 'bg-red-500' :
                    g.topic === 'defensive' ? 'bg-blue-500' :
                    g.topic === 'control' ? 'bg-purple-500' : 'bg-green-500'
                  }`} />
                  <span className="text-sm text-gray-900 dark:text-white truncate">{g.name}</span>
                  {g.difficulty && (
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      g.difficulty === 'beginner' ? 'bg-green-100 text-green-700' :
                      g.difficulty === 'advanced' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {g.difficulty}
                    </span>
                  )}
                </button>
              ))}
              {availableGames.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No matching drills found
                </p>
              )}
              {availableGames.length > 10 && (
                <p className="text-xs text-gray-400 text-center pt-2">
                  +{availableGames.length - 10} more (type to search)
                </p>
              )}
            </div>
          </div>
        )}

        <p className="text-xs text-gray-500 mt-3 text-center">
          Link drills together to create training progressions
        </p>
      </div>
    </div>
  );
}
