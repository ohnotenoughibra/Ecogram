// Beautiful empty state illustrations and messages

const illustrations = {
  games: (
    <svg className="w-32 h-32 mx-auto" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="50" className="fill-primary-100 dark:fill-primary-900/30" />
      <rect x="30" y="40" width="60" height="40" rx="4" className="fill-primary-300 dark:fill-primary-700" />
      <rect x="35" y="45" width="50" height="6" rx="2" className="fill-white dark:fill-gray-800" />
      <rect x="35" y="55" width="35" height="4" rx="1" className="fill-white/60 dark:fill-gray-700" />
      <rect x="35" y="63" width="45" height="4" rx="1" className="fill-white/60 dark:fill-gray-700" />
      <rect x="35" y="71" width="25" height="4" rx="1" className="fill-white/60 dark:fill-gray-700" />
      <circle cx="85" cy="35" r="15" className="fill-yellow-400" />
      <path d="M85 28v14M78 35h14" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  sessions: (
    <svg className="w-32 h-32 mx-auto" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="50" className="fill-blue-100 dark:fill-blue-900/30" />
      <rect x="25" y="30" width="70" height="55" rx="4" className="fill-blue-300 dark:fill-blue-700" />
      <rect x="30" y="45" width="60" height="8" rx="2" className="fill-white dark:fill-gray-800" />
      <rect x="30" y="58" width="60" height="8" rx="2" className="fill-white/70 dark:fill-gray-700" />
      <rect x="30" y="71" width="60" height="8" rx="2" className="fill-white/40 dark:fill-gray-600" />
      <rect x="30" y="35" width="40" height="5" rx="1" className="fill-white dark:fill-gray-800" />
      <circle cx="85" cy="25" r="12" className="fill-green-400" />
      <path d="M80 25l3 3 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  favorites: (
    <svg className="w-32 h-32 mx-auto" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="50" className="fill-yellow-100 dark:fill-yellow-900/30" />
      <path d="M60 30l8.5 17.2 19 2.8-13.75 13.4 3.25 18.9L60 73.6l-17 8.7 3.25-18.9L32.5 50l19-2.8L60 30z"
        className="fill-yellow-400 dark:fill-yellow-500" />
      <path d="M60 38l5.9 12 13.2 1.9-9.55 9.3 2.25 13.2L60 68.2l-11.8 6.2 2.25-13.2-9.55-9.3 13.2-1.9L60 38z"
        className="fill-yellow-200 dark:fill-yellow-600" />
    </svg>
  ),
  stats: (
    <svg className="w-32 h-32 mx-auto" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="50" className="fill-purple-100 dark:fill-purple-900/30" />
      <rect x="25" y="70" width="15" height="25" rx="2" className="fill-purple-400" />
      <rect x="45" y="50" width="15" height="45" rx="2" className="fill-purple-500" />
      <rect x="65" y="35" width="15" height="60" rx="2" className="fill-purple-600" />
      <rect x="85" y="55" width="15" height="40" rx="2" className="fill-purple-400" />
      <path d="M25 45c15-15 30 0 45-20 15 5 25 15 30 5" stroke="white" strokeWidth="3" strokeLinecap="round" className="opacity-60" />
    </svg>
  ),
  search: (
    <svg className="w-32 h-32 mx-auto" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="50" className="fill-gray-100 dark:fill-gray-800" />
      <circle cx="52" cy="52" r="22" className="stroke-gray-400 dark:stroke-gray-500" strokeWidth="4" fill="none" />
      <path d="M68 68l18 18" className="stroke-gray-400 dark:stroke-gray-500" strokeWidth="4" strokeLinecap="round" />
      <path d="M42 52h20M52 42v20" className="stroke-gray-300 dark:stroke-gray-600" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  offline: (
    <svg className="w-32 h-32 mx-auto" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="50" className="fill-red-100 dark:fill-red-900/30" />
      <path d="M30 55c0-16.5 13.5-30 30-30s30 13.5 30 30" className="stroke-red-300 dark:stroke-red-700" strokeWidth="4" strokeLinecap="round" />
      <path d="M40 65c0-11 9-20 20-20s20 9 20 20" className="stroke-red-400 dark:stroke-red-600" strokeWidth="4" strokeLinecap="round" />
      <circle cx="60" cy="75" r="8" className="fill-red-500" />
      <line x1="25" y1="95" x2="95" y2="25" className="stroke-red-500" strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
};

const messages = {
  games: {
    title: 'No games yet',
    description: 'Start building your training library by creating your first game or using the AI designer.',
    action: 'Create Game'
  },
  sessions: {
    title: 'No sessions found',
    description: 'Create a training session to organize your games and track your practice.',
    action: 'New Session'
  },
  favorites: {
    title: 'No favorites yet',
    description: 'Tap the star on any game to add it to your favorites for quick access.',
    action: 'Browse Games'
  },
  stats: {
    title: 'No data yet',
    description: 'Complete some training sessions and rate games to see your statistics.',
    action: 'Start Training'
  },
  search: {
    title: 'No results found',
    description: 'Try adjusting your search or filters to find what you\'re looking for.',
    action: 'Clear Filters'
  },
  offline: {
    title: 'You\'re offline',
    description: 'Some features may be limited. Your data will sync when you\'re back online.',
    action: null
  }
};

export default function EmptyState({ type = 'games', onAction, customTitle, customDescription, customAction }) {
  const content = messages[type] || messages.games;
  const illustration = illustrations[type] || illustrations.games;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center animate-fade-in">
      <div className="mb-6 opacity-80">
        {illustration}
      </div>

      <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
        {customTitle || content.title}
      </h3>

      <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-6">
        {customDescription || content.description}
      </p>

      {(customAction || content.action) && onAction && (
        <button
          onClick={onAction}
          className="btn-primary"
        >
          {customAction || content.action}
        </button>
      )}
    </div>
  );
}

// Quick empty state for inline use
export function InlineEmpty({ message, icon }) {
  return (
    <div className="flex flex-col items-center py-8 text-gray-400 dark:text-gray-500">
      {icon || (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mb-2 opacity-50">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z" />
        </svg>
      )}
      <p className="text-sm">{message || 'Nothing here yet'}</p>
    </div>
  );
}
