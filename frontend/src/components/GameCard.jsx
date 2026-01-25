import { useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';

const topicLabels = {
  offensive: 'Offensive / Submissions',
  defensive: 'Defensive / Escapes',
  control: 'Control / Passing',
  transition: 'Transition / Scrambles'
};

const topicColors = {
  offensive: 'badge-offensive',
  defensive: 'badge-defensive',
  control: 'badge-control',
  transition: 'badge-transition'
};

export default function GameCard({ game, onEdit, onDelete, selectable = true }) {
  const { selectedGames, toggleGameSelection, updateGame, markGameUsed, showToast } = useApp();
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const isSelected = selectedGames.has(game._id);

  const copyToClipboard = useCallback((e) => {
    e.stopPropagation();
    const text = `${game.name}
Topic: ${topicLabels[game.topic]}
${game.skills?.length ? `Skills: ${game.skills.map(s => '#' + s).join(' ')}` : ''}
${game.topPlayer ? `\nTop Player:\n${game.topPlayer}` : ''}
${game.bottomPlayer ? `\nBottom Player:\n${game.bottomPlayer}` : ''}
${game.coaching ? `\nCoaching Notes:\n${game.coaching}` : ''}`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      showToast('Copied to clipboard', 'success');
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      showToast('Failed to copy', 'error');
    });
  }, [game, showToast]);

  const handleFavoriteToggle = async (e) => {
    e.stopPropagation();
    await updateGame(game._id, { favorite: !game.favorite });
  };

  const handleRatingChange = async (rating) => {
    await updateGame(game._id, { rating });
  };

  const handleMarkUsed = async (e) => {
    e.stopPropagation();
    await markGameUsed(game._id);
  };

  const StarRating = ({ rating, onChange }) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={(e) => {
            e.stopPropagation();
            onChange(star === rating ? 0 : star);
          }}
          className={`star ${star <= rating ? 'star-filled' : 'star-empty'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );

  return (
    <div
      className={`card card-hover p-4 cursor-pointer ${isSelected ? 'ring-2 ring-primary-500' : ''}`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex items-start gap-3">
        {selectable && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              toggleGameSelection(game._id);
            }}
            className="checkbox mt-1"
          />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                {game.name}
              </h3>
              <span className={`badge ${topicColors[game.topic]} mt-1`}>
                {topicLabels[game.topic]}
              </span>
            </div>

            <button
              onClick={handleFavoriteToggle}
              className={`p-1 rounded-full transition-colors ${
                game.favorite
                  ? 'text-yellow-400 hover:text-yellow-500'
                  : 'text-gray-300 hover:text-yellow-400 dark:text-gray-600'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          </div>

          {/* Skills tags */}
          {game.skills && game.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {game.skills.slice(0, isExpanded ? undefined : 3).map((skill, idx) => (
                <span key={idx} className="chip text-xs">
                  #{skill}
                </span>
              ))}
              {!isExpanded && game.skills.length > 3 && (
                <span className="text-xs text-gray-400">+{game.skills.length - 3} more</span>
              )}
            </div>
          )}

          {/* Rating */}
          <div className="mb-2">
            <StarRating rating={game.rating || 0} onChange={handleRatingChange} />
          </div>

          {/* Expanded content */}
          {isExpanded && (
            <div className="mt-4 space-y-4 animate-fade-in">
              {game.topPlayer && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Top Player
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                    {game.topPlayer}
                  </p>
                </div>
              )}

              {game.bottomPlayer && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Bottom Player
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                    {game.bottomPlayer}
                  </p>
                </div>
              )}

              {game.coaching && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Coaching Notes
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                    {game.coaching}
                  </p>
                </div>
              )}

              {/* AI Generated metadata */}
              {game.aiGenerated && game.aiMetadata && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <span className="badge bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 mb-2">
                    AI Generated
                  </span>

                  {game.aiMetadata.startPosition && (
                    <div className="mt-2">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Start Position
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {game.aiMetadata.startPosition}
                      </p>
                    </div>
                  )}

                  {game.aiMetadata.constraints && game.aiMetadata.constraints.length > 0 && (
                    <div className="mt-2">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Constraints
                      </h4>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc list-inside">
                        {game.aiMetadata.constraints.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {game.aiMetadata.progressions && game.aiMetadata.progressions.length > 0 && (
                    <div className="mt-2">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Progressions
                      </h4>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 list-decimal list-inside">
                        {game.aiMetadata.progressions.map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Meta info */}
              <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-800">
                <span>
                  Used {game.usageCount || 0} times
                  {game.lastUsed && ` • Last: ${new Date(game.lastUsed).toLocaleDateString()}`}
                </span>
                <span>
                  Created {new Date(game.createdAt).toLocaleDateString()}
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(game);
                  }}
                  className="btn-secondary text-sm flex-1"
                >
                  Edit
                </button>
                <button
                  onClick={handleMarkUsed}
                  className="btn-secondary text-sm flex-1"
                >
                  Mark Used
                </button>
                <button
                  onClick={copyToClipboard}
                  className="btn-secondary text-sm px-3"
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-green-500">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
                      <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z" />
                    </svg>
                  )}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(game);
                  }}
                  className="btn-danger text-sm px-3"
                  title="Delete game"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
