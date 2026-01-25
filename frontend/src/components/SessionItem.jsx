import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const topicColors = {
  offensive: 'bg-red-500',
  defensive: 'bg-blue-500',
  control: 'bg-purple-500',
  transition: 'bg-green-500'
};

export default function SessionItem({ session, onEdit, onDelete, onShare }) {
  const navigate = useNavigate();
  const { updateSession } = useApp();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFavoriteToggle = async (e) => {
    e.stopPropagation();
    await updateSession(session._id, { favorite: !session.favorite });
  };

  const handleStartSession = (e) => {
    e.stopPropagation();
    navigate(`/session/${session._id}`);
  };

  const completedCount = session.games?.filter(g => g.completed).length || 0;
  const totalGames = session.games?.length || 0;

  return (
    <div
      className="card card-hover p-4 cursor-pointer"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
              {session.name}
            </h3>
            {session.isPublic && (
              <span className="badge bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                Shared
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
            <span>{totalGames} games</span>
            {session.scheduledDate && (
              <span>
                Scheduled: {new Date(session.scheduledDate).toLocaleDateString()}
              </span>
            )}
          </div>

          {/* Progress bar */}
          {totalGames > 0 && (
            <div className="mt-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all"
                    style={{ width: `${(completedCount / totalGames) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {completedCount}/{totalGames}
                </span>
              </div>
            </div>
          )}

          {/* Topic distribution */}
          {session.games && session.games.length > 0 && (
            <div className="flex gap-1 mt-2">
              {session.games.slice(0, 6).map((g, idx) => (
                <span
                  key={idx}
                  className={`w-2 h-2 rounded-full ${topicColors[g.game?.topic] || 'bg-gray-400'}`}
                  title={g.game?.name}
                />
              ))}
              {session.games.length > 6 && (
                <span className="text-xs text-gray-400">+{session.games.length - 6}</span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleFavoriteToggle}
            className={`p-1 rounded-full transition-colors ${
              session.favorite
                ? 'text-yellow-400 hover:text-yellow-500'
                : 'text-gray-300 hover:text-yellow-400 dark:text-gray-600'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="mt-4 space-y-3 animate-fade-in">
          {/* Games list */}
          {session.games && session.games.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Games</h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {session.games.map((g, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800 ${
                      g.completed ? 'opacity-60' : ''
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${topicColors[g.game?.topic] || 'bg-gray-400'}`} />
                    <span className={`flex-1 text-sm ${g.completed ? 'line-through' : ''}`}>
                      {g.game?.name || 'Unknown game'}
                    </span>
                    {g.completed && (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 text-green-500">
                        <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 01.208 1.04l-5 7.5a.75.75 0 01-1.154.114l-3-3a.75.75 0 011.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 011.04-.207z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Meta info */}
          <div className="text-xs text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-800">
            Created {new Date(session.createdAt).toLocaleDateString()}
            {session.lastUsed && ` • Last used: ${new Date(session.lastUsed).toLocaleDateString()}`}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleStartSession}
              className="btn-primary text-sm flex-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
              Start
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(session);
              }}
              className="btn-secondary text-sm"
            >
              Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onShare(session);
              }}
              className="btn-secondary text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M13 4.5a2.5 2.5 0 11.702 1.737L6.97 9.604a2.518 2.518 0 010 .792l6.733 3.367a2.5 2.5 0 11-.671 1.341l-6.733-3.367a2.5 2.5 0 110-3.475l6.733-3.366A2.52 2.52 0 0113 4.5z" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(session);
              }}
              className="btn-danger text-sm px-3"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
