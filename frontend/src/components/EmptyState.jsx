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
    title: 'Your training library awaits',
    description: 'Build a collection of BJJ training games to level up your practice.',
    action: 'Create Game',
    secondaryAction: 'AI Designer',
    secondaryIcon: 'sparkles',
    tip: 'Pro tip: Use the AI Designer to generate games based on specific techniques or positions.',
    quickActions: [
      { label: 'Import from file', icon: 'upload', action: 'import' },
      { label: 'Browse templates', icon: 'template', action: 'templates' }
    ]
  },
  sessions: {
    title: 'Plan your training',
    description: 'Sessions help you organize games into structured practice routines.',
    action: 'New Session',
    secondaryAction: 'Smart Build',
    secondaryIcon: 'zap',
    tip: 'Sessions track which games you use, helping you analyze your training patterns.',
    quickActions: [
      { label: 'Quick 15-min session', icon: 'clock', action: 'quick15' },
      { label: 'Full class template', icon: 'template', action: 'fullClass' }
    ]
  },
  favorites: {
    title: 'Star your best games',
    description: 'Tap the star on any game to add it here for quick access during training.',
    action: 'Browse Games',
    tip: 'Favorites appear at the top of game lists, perfect for your go-to drills.'
  },
  stats: {
    title: 'Track your journey',
    description: 'Complete training sessions to unlock insights about your practice patterns.',
    action: 'Start Training',
    secondaryAction: 'View Goals',
    secondaryIcon: 'target',
    tip: 'The more you train, the better your personalized recommendations become.'
  },
  search: {
    title: 'No matches found',
    description: 'Try different keywords or remove some filters to see more results.',
    action: 'Clear Filters',
    tip: 'Use specific terms like position names (guard, mount) or techniques (sweep, pass).'
  },
  offline: {
    title: 'You\'re offline',
    description: 'Your cached games are still available. Changes will sync when you reconnect.',
    action: null,
    tip: 'Offline mode keeps your favorites and recent sessions accessible.'
  }
};

// Icon components for quick actions
const actionIcons = {
  sparkles: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path d="M10 1a.75.75 0 01.65.38l1.95 3.4 3.75.9a.75.75 0 01.4 1.23l-2.6 2.87.45 3.85a.75.75 0 01-1.07.8L10 12.62l-3.53 1.81a.75.75 0 01-1.07-.8l.45-3.85-2.6-2.87a.75.75 0 01.4-1.23l3.75-.9 1.95-3.4A.75.75 0 0110 1z" />
    </svg>
  ),
  zap: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path d="M11.983 1.907a.75.75 0 00-1.292-.657l-8.5 9.5A.75.75 0 002.75 12h6.572l-1.305 6.093a.75.75 0 001.292.657l8.5-9.5A.75.75 0 0017.25 8h-6.572l1.305-6.093z" />
    </svg>
  ),
  target: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M10 1a.75.75 0 01.75.75v1.5a6.5 6.5 0 016 6h1.5a.75.75 0 010 1.5h-1.5a6.5 6.5 0 01-6 6v1.5a.75.75 0 01-1.5 0v-1.5a6.5 6.5 0 01-6-6H1.75a.75.75 0 010-1.5h1.5a6.5 6.5 0 016-6v-1.5A.75.75 0 0110 1z" clipRule="evenodd" />
    </svg>
  ),
  upload: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path d="M9.25 13.25a.75.75 0 001.5 0V4.636l2.955 3.129a.75.75 0 001.09-1.03l-4.25-4.5a.75.75 0 00-1.09 0l-4.25 4.5a.75.75 0 101.09 1.03L9.25 4.636v8.614z" />
      <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
    </svg>
  ),
  template: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm2.25 8.5a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 3a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z" clipRule="evenodd" />
    </svg>
  ),
  clock: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
    </svg>
  ),
};

export default function EmptyState({
  type = 'games',
  onAction,
  onSecondaryAction,
  onQuickAction,
  customTitle,
  customDescription,
  customAction,
  showTip = true
}) {
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

      {/* Main action buttons */}
      {(customAction || content.action) && onAction && (
        <div className="flex flex-wrap items-center justify-center gap-3 mb-4">
          <button
            onClick={onAction}
            className="btn-primary"
          >
            {customAction || content.action}
          </button>

          {content.secondaryAction && onSecondaryAction && (
            <button
              onClick={onSecondaryAction}
              className="btn-secondary flex items-center gap-2"
            >
              {content.secondaryIcon && actionIcons[content.secondaryIcon]}
              {content.secondaryAction}
            </button>
          )}
        </div>
      )}

      {/* Quick actions */}
      {content.quickActions && onQuickAction && (
        <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
          {content.quickActions.map((qa, idx) => (
            <button
              key={idx}
              onClick={() => onQuickAction(qa.action)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              {actionIcons[qa.icon]}
              {qa.label}
            </button>
          ))}
        </div>
      )}

      {/* Pro tip */}
      {showTip && content.tip && (
        <div className="mt-2 flex items-start gap-2 max-w-md text-left bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 rounded-lg px-4 py-3">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5">
            <path d="M10 1a6 6 0 00-3.815 10.631C7.237 12.5 8 13.443 8 14.456v.644a.75.75 0 00.572.729 6.016 6.016 0 002.856 0A.75.75 0 0012 15.1v-.644c0-1.013.762-1.957 1.815-2.825A6 6 0 0010 1zM8.863 17.414a.75.75 0 00-.226 1.483 9.066 9.066 0 002.726 0 .75.75 0 00-.226-1.483 7.553 7.553 0 01-2.274 0z" />
          </svg>
          <p className="text-sm text-primary-700 dark:text-primary-300">
            {content.tip}
          </p>
        </div>
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
