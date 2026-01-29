import { useEffect } from 'react';

const shortcuts = [
  { key: 'N', description: 'Create new game', context: 'Games page' },
  { key: 'A', description: 'Open AI Designer', context: 'Global' },
  { key: 'S', description: 'Focus search input', context: 'Global' },
  { key: 'T', description: 'Toggle timer', context: 'Global' },
  { key: '?', description: 'Show this help', context: 'Global' },
  { key: 'Esc', description: 'Close modal/dialog', context: 'Global' },
  { key: 'Space', description: 'Start/Pause timer', context: 'Timer' },
  { key: 'R', description: 'Reset timer', context: 'Timer' },
  { key: 'Ctrl+G', description: 'Go to Games library', context: 'Navigation' },
  { key: 'Ctrl+E', description: 'Go to Sessions', context: 'Navigation' },
  { key: 'Ctrl+P', description: 'Go to Practice mode', context: 'Navigation' },
];

export default function KeyboardShortcuts({ isOpen, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Keyboard Shortcuts
          </h3>
          <button onClick={onClose} className="btn-icon" title="Close">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        <div className="p-4">
          <div className="space-y-3">
            {shortcuts.map((shortcut, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {shortcut.description}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {shortcut.context}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {shortcut.key.includes('+') ? (
                    shortcut.key.split('+').map((k, i) => (
                      <span key={i} className="flex items-center">
                        <kbd className="px-2 py-1 text-xs font-mono bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border border-gray-300 dark:border-gray-600">
                          {k === 'Ctrl' ? (navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl') : k}
                        </kbd>
                        {i < shortcut.key.split('+').length - 1 && (
                          <span className="mx-0.5 text-gray-400">+</span>
                        )}
                      </span>
                    ))
                  ) : (
                    <kbd className="px-2 py-1 text-xs font-mono bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border border-gray-300 dark:border-gray-600">
                      {shortcut.key}
                    </kbd>
                  )}
                </div>
              </div>
            ))}
          </div>

          <p className="mt-4 text-xs text-center text-gray-500 dark:text-gray-400">
            Press <kbd className="px-1 py-0.5 text-xs font-mono bg-gray-100 dark:bg-gray-800 rounded">?</kbd> anytime to see shortcuts
          </p>
        </div>
      </div>
    </div>
  );
}
