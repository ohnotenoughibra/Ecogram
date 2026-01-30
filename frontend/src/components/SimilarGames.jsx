import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';

const topicColors = {
  offensive: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  defensive: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  control: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  transition: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  competition: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
};

const difficultyOrder = { beginner: 0, intermediate: 1, advanced: 2 };

export default function SimilarGames({ game, onSelectGame, maxGames = 4 }) {
  const { games } = useApp();
  const [expanded, setExpanded] = useState(false);

  // Find similar games based on position, topic, and techniques
  const similarGames = useMemo(() => {
    if (!games || !game) return { easier: [], harder: [], related: [] };

    const otherGames = games.filter(g => g._id !== game._id);

    // Score each game for similarity
    const scored = otherGames.map(g => {
      let score = 0;
      let relationship = 'related';

      // Same position = high match
      if (g.position && game.position && g.position === game.position) {
        score += 50;
      }

      // Same topic
      if (g.topic === game.topic) {
        score += 30;
      }

      // Shared techniques
      const gameTechs = new Set(game.techniques || []);
      const gTechs = g.techniques || [];
      const sharedTechs = gTechs.filter(t => gameTechs.has(t)).length;
      score += sharedTechs * 15;

      // Similar name patterns
      const gameWords = new Set(game.name.toLowerCase().split(/\s+/));
      const gWords = g.name.toLowerCase().split(/\s+/);
      const sharedWords = gWords.filter(w => w.length > 3 && gameWords.has(w)).length;
      score += sharedWords * 10;

      // Determine progression relationship
      const gameDiff = difficultyOrder[game.difficulty] ?? 1;
      const gDiff = difficultyOrder[g.difficulty] ?? 1;

      if (score > 30) {
        if (gDiff < gameDiff) {
          relationship = 'easier';
        } else if (gDiff > gameDiff) {
          relationship = 'harder';
        }
      }

      return { game: g, score, relationship };
    });

    // Sort by score and filter minimum threshold
    const relevant = scored.filter(s => s.score > 20).sort((a, b) => b.score - a.score);

    const easier = relevant.filter(s => s.relationship === 'easier').slice(0, 2);
    const harder = relevant.filter(s => s.relationship === 'harder').slice(0, 2);
    const related = relevant.filter(s => s.relationship === 'related').slice(0, 4);

    return { easier, harder, related };
  }, [games, game]);

  const hasResults = similarGames.easier.length > 0 ||
    similarGames.harder.length > 0 ||
    similarGames.related.length > 0;

  if (!hasResults) return null;

  const GamePill = ({ item, type }) => (
    <button
      onClick={() => onSelectGame?.(item.game)}
      className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors text-left group"
    >
      {type === 'easier' && (
        <span className="text-green-500 flex-shrink-0" title="Easier progression">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M8 14a.75.75 0 01-.75-.75V4.56L4.03 7.78a.75.75 0 01-1.06-1.06l4.5-4.5a.75.75 0 011.06 0l4.5 4.5a.75.75 0 01-1.06 1.06L8.75 4.56v8.69A.75.75 0 018 14z" clipRule="evenodd" />
          </svg>
        </span>
      )}
      {type === 'harder' && (
        <span className="text-red-500 flex-shrink-0" title="Harder progression">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M8 2a.75.75 0 01.75.75v8.69l3.22-3.22a.75.75 0 111.06 1.06l-4.5 4.5a.75.75 0 01-1.06 0l-4.5-4.5a.75.75 0 011.06-1.06l3.22 3.22V2.75A.75.75 0 018 2z" clipRule="evenodd" />
          </svg>
        </span>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-400">
          {item.game.name}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className={`text-xs px-1.5 py-0.5 rounded ${topicColors[item.game.topic]}`}>
            {item.game.topic}
          </span>
          {item.game.position && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {item.game.position.replace(/-/g, ' ')}
            </span>
          )}
        </div>
      </div>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 text-gray-400 group-hover:text-primary-500">
        <path fillRule="evenodd" d="M6.22 4.22a.75.75 0 011.06 0l3.25 3.25a.75.75 0 010 1.06l-3.25 3.25a.75.75 0 01-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 010-1.06z" clipRule="evenodd" />
      </svg>
    </button>
  );

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full text-left"
      >
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-primary-500">
            <path d="M10 1a6 6 0 00-3.815 10.631C7.237 12.5 8 13.443 8 14.456v.644a.75.75 0 00.572.729 6.016 6.016 0 002.856 0A.75.75 0 0012 15.1v-.644c0-1.013.762-1.957 1.815-2.825A6 6 0 0010 1zM8.863 17.414a.75.75 0 00-.226 1.483 9.066 9.066 0 002.726 0 .75.75 0 00-.226-1.483 7.553 7.553 0 01-2.274 0z" />
          </svg>
          Similar Games & Progressions
        </h4>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`w-5 h-5 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
        >
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-3 space-y-4 animate-fade-in">
          {/* Easier progressions */}
          {similarGames.easier.length > 0 && (
            <div>
              <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-2 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                  <path fillRule="evenodd" d="M8 14a.75.75 0 01-.75-.75V4.56L4.03 7.78a.75.75 0 01-1.06-1.06l4.5-4.5a.75.75 0 011.06 0l4.5 4.5a.75.75 0 01-1.06 1.06L8.75 4.56v8.69A.75.75 0 018 14z" clipRule="evenodd" />
                </svg>
                Easier Variations
              </p>
              <div className="space-y-2">
                {similarGames.easier.map(item => (
                  <GamePill key={item.game._id} item={item} type="easier" />
                ))}
              </div>
            </div>
          )}

          {/* Harder progressions */}
          {similarGames.harder.length > 0 && (
            <div>
              <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-2 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                  <path fillRule="evenodd" d="M8 2a.75.75 0 01.75.75v8.69l3.22-3.22a.75.75 0 111.06 1.06l-4.5 4.5a.75.75 0 01-1.06 0l-4.5-4.5a.75.75 0 011.06-1.06l3.22 3.22V2.75A.75.75 0 018 2z" clipRule="evenodd" />
                </svg>
                Harder Progressions
              </p>
              <div className="space-y-2">
                {similarGames.harder.map(item => (
                  <GamePill key={item.game._id} item={item} type="harder" />
                ))}
              </div>
            </div>
          )}

          {/* Related games */}
          {similarGames.related.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                  <path d="M1 8.849c0 1 .738 1.851 1.734 1.947L3 10.82v2.429a.75.75 0 001.28.53l1.82-1.82A3.484 3.484 0 015.5 10V9A3.5 3.5 0 019 5.5h4V4.151c0-1-.739-1.851-1.734-1.947a44.539 44.539 0 00-8.532 0C1.738 2.3 1 3.151 1 4.151v4.698z" />
                  <path d="M7 9a2 2 0 012-2h4a2 2 0 012 2v1a2 2 0 01-2 2h-.5l-1.725 1.725a.25.25 0 01-.427-.177V12H9a2 2 0 01-2-2V9z" />
                </svg>
                Related Games
              </p>
              <div className="space-y-2">
                {similarGames.related.slice(0, expanded ? 4 : 2).map(item => (
                  <GamePill key={item.game._id} item={item} type="related" />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
