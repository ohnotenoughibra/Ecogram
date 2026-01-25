import { useState, useEffect } from 'react';

const TIPS = {
  games: {
    title: 'Quick Tip',
    message: 'Swipe right on a game card to add it to a session, or tap the star to favorite it.',
    icon: '💡'
  },
  sessions: {
    title: 'Templates Available',
    message: 'Save your best sessions as templates and reuse them anytime!',
    icon: '📋'
  },
  practice: {
    title: 'Timer Mode',
    message: 'Use the timer for timed rounds. Swipe left for a new random game!',
    icon: '⏱️'
  },
  stats: {
    title: 'Track Progress',
    message: 'Rate games after training to see your most effective drills.',
    icon: '📊'
  },
  competition: {
    title: 'Comp Prep Mode',
    message: 'Track weight, build your gameplan, and focus on competition-specific drills.',
    icon: '🏆'
  },
  goals: {
    title: 'Stay Consistent',
    message: 'Set training goals to build habits and track your streaks.',
    icon: '🎯'
  }
};

export default function FeatureTip({ page }) {
  const [dismissed, setDismissed] = useState(true);
  const tip = TIPS[page];

  useEffect(() => {
    // Check if tip was already dismissed
    const dismissedTips = JSON.parse(localStorage.getItem('dismissedTips') || '{}');
    setDismissed(dismissedTips[page] === true);
  }, [page]);

  if (!tip || dismissed) return null;

  const handleDismiss = () => {
    const dismissedTips = JSON.parse(localStorage.getItem('dismissedTips') || '{}');
    dismissedTips[page] = true;
    localStorage.setItem('dismissedTips', JSON.stringify(dismissedTips));
    setDismissed(true);
  };

  return (
    <div className="bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-3 mb-4 flex items-start gap-3">
      <span className="text-2xl flex-shrink-0">{tip.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-primary-900 dark:text-primary-100 text-sm">{tip.title}</p>
        <p className="text-sm text-primary-700 dark:text-primary-300">{tip.message}</p>
      </div>
      <button
        onClick={handleDismiss}
        className="text-primary-500 hover:text-primary-700 dark:hover:text-primary-300 flex-shrink-0 p-1"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
        </svg>
      </button>
    </div>
  );
}

// "What's New" banner for major updates
export function WhatsNewBanner() {
  const [dismissed, setDismissed] = useState(true);
  const VERSION = 'v2.0';

  useEffect(() => {
    const lastSeenVersion = localStorage.getItem('lastSeenVersion');
    setDismissed(lastSeenVersion === VERSION);
  }, []);

  if (dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem('lastSeenVersion', VERSION);
    setDismissed(true);
  };

  return (
    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <span className="text-2xl">🎉</span>
        <div className="flex-1">
          <p className="font-semibold text-yellow-900 dark:text-yellow-100">New Features!</p>
          <ul className="text-sm text-yellow-800 dark:text-yellow-200 mt-1 space-y-1">
            <li>• <strong>Competition Prep Mode</strong> - Countdown, weight tracking, gameplan</li>
            <li>• <strong>Session Templates</strong> - Save and reuse your best sessions</li>
            <li>• <strong>Training Goals</strong> - Track progress and streaks</li>
            <li>• <strong>Enhanced Stats</strong> - Calendar view and achievements</li>
          </ul>
          <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
            Find these in the <strong>More</strong> menu at the bottom
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="text-yellow-500 hover:text-yellow-700 p-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
