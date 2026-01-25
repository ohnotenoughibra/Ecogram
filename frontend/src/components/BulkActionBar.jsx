import { useApp } from '../context/AppContext';

export default function BulkActionBar({ onAddToSession }) {
  const { selectedGames, clearSelection, bulkGameAction, selectAllGames, games } = useApp();

  if (selectedGames.size === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-surface-dark border-t border-gray-200 dark:border-gray-700 shadow-lg p-4 animate-slide-up z-40">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-medium text-gray-900 dark:text-white">
            {selectedGames.size} selected
          </span>

          <button
            onClick={selectAllGames}
            className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
          >
            Select all ({games.length})
          </button>

          <button
            onClick={clearSelection}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            Clear selection
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => bulkGameAction('favorite')}
            className="btn-secondary"
            title="Add to favorites"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-yellow-500">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="hidden sm:inline ml-1">Favorite</span>
          </button>

          <button
            onClick={onAddToSession}
            className="btn-secondary"
            title="Add to session"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
            <span className="hidden sm:inline ml-1">Add to Session</span>
          </button>

          <button
            onClick={() => {
              if (confirm(`Delete ${selectedGames.size} games?`)) {
                bulkGameAction('delete');
              }
            }}
            className="btn-danger"
            title="Delete selected"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
            </svg>
            <span className="hidden sm:inline ml-1">Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}
