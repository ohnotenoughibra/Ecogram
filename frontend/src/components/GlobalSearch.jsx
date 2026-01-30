import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const POSITIONS = [
  'closed-guard', 'open-guard', 'half-guard', 'butterfly-guard', 'x-guard',
  'dlr', 'rdlr', 'mount', 'side-control', 'back-control', 'turtle',
  'standing', 'clinch', '50-50', 'saddle', 'ashi-garami'
];

const QUICK_ACTIONS = [
  { id: 'new-game', label: 'Create New Game', icon: 'plus', path: '/', action: 'newGame' },
  { id: 'new-session', label: 'Create New Session', icon: 'folder', path: '/sessions', action: 'newSession' },
  { id: 'ai-designer', label: 'AI Game Designer', icon: 'sparkles', path: '/ai' },
  { id: 'import', label: 'Import Games', icon: 'upload', path: '/import' },
  { id: 'practice', label: 'Start Practice Mode', icon: 'play', path: '/practice' },
  { id: 'stats', label: 'View Statistics', icon: 'chart', path: '/stats' },
];

export default function GlobalSearch({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { games, sessions, showToast } = useApp();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Filter results based on query
  const getResults = useCallback(() => {
    const results = [];
    const q = query.toLowerCase().trim();

    if (!q) {
      // Show quick actions when no query
      return QUICK_ACTIONS.map(action => ({
        type: 'action',
        ...action
      }));
    }

    // Search games
    const matchingGames = (games || [])
      .filter(game =>
        game.name?.toLowerCase().includes(q) ||
        game.position?.toLowerCase().includes(q) ||
        game.topic?.toLowerCase().includes(q) ||
        game.techniques?.some(t => t.toLowerCase().includes(q)) ||
        game.topPlayer?.toLowerCase().includes(q) ||
        game.bottomPlayer?.toLowerCase().includes(q)
      )
      .slice(0, 8);

    matchingGames.forEach(game => {
      results.push({
        type: 'game',
        id: game._id,
        name: game.name,
        subtitle: `${game.topic || 'Game'} • ${game.position || 'Any position'}`,
        game
      });
    });

    // Search sessions
    const matchingSessions = (sessions || [])
      .filter(session =>
        session.name?.toLowerCase().includes(q)
      )
      .slice(0, 4);

    matchingSessions.forEach(session => {
      results.push({
        type: 'session',
        id: session._id,
        name: session.name,
        subtitle: `Session • ${session.games?.length || 0} games`
      });
    });

    // Search positions
    const matchingPositions = POSITIONS
      .filter(pos => pos.includes(q))
      .slice(0, 3);

    matchingPositions.forEach(pos => {
      results.push({
        type: 'filter',
        id: `pos-${pos}`,
        name: `Filter by: ${pos.replace(/-/g, ' ')}`,
        subtitle: 'Show games in this position',
        position: pos
      });
    });

    // Add matching quick actions
    QUICK_ACTIONS.forEach(action => {
      if (action.label.toLowerCase().includes(q)) {
        results.push({ type: 'action', ...action });
      }
    });

    return results;
  }, [query, games, sessions]);

  const results = getResults();

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selected = listRef.current.querySelector('[data-selected="true"]');
      if (selected) {
        selected.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(i => Math.min(i + 1, results.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(i => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (results[selectedIndex]) {
            handleSelect(results[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose]);

  const handleSelect = (result) => {
    onClose();

    switch (result.type) {
      case 'game':
        // Navigate to games page and trigger game view
        navigate('/', { state: { viewGame: result.id } });
        break;
      case 'session':
        navigate(`/session/${result.id}`);
        break;
      case 'filter':
        navigate('/', { state: { filterPosition: result.position } });
        break;
      case 'action':
        if (result.action === 'newGame') {
          navigate('/', { state: { createGame: true } });
        } else if (result.action === 'newSession') {
          navigate('/sessions', { state: { createSession: true } });
        } else if (result.path) {
          navigate(result.path);
        }
        break;
    }
  };

  const getIcon = (result) => {
    switch (result.type) {
      case 'game':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path d="M1 4.25a3.733 3.733 0 012.25-.75h13.5c.844 0 1.623.279 2.25.75A2.25 2.25 0 0016.75 2H3.25A2.25 2.25 0 001 4.25zM1 7.25a3.733 3.733 0 012.25-.75h13.5c.844 0 1.623.279 2.25.75A2.25 2.25 0 0016.75 5H3.25A2.25 2.25 0 001 7.25zM7 8a1 1 0 000 2h6a1 1 0 100-2H7zM3.25 8A2.25 2.25 0 001 10.25v4.5A2.25 2.25 0 003.25 17h13.5A2.25 2.25 0 0019 14.75v-4.5A2.25 2.25 0 0016.75 8H3.25z" />
          </svg>
        );
      case 'session':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path d="M3.75 3A1.75 1.75 0 002 4.75v3.26a3.235 3.235 0 011.75-.51h12.5c.644 0 1.245.188 1.75.51V6.75A1.75 1.75 0 0016.25 5h-4.836a.25.25 0 01-.177-.073L9.823 3.513A1.75 1.75 0 008.586 3H3.75zM3.75 9A1.75 1.75 0 002 10.75v4.5c0 .966.784 1.75 1.75 1.75h12.5A1.75 1.75 0 0018 15.25v-4.5A1.75 1.75 0 0016.25 9H3.75z" />
          </svg>
        );
      case 'filter':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 01.628.74v2.288a2.25 2.25 0 01-.659 1.59l-4.682 4.683a2.25 2.25 0 00-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 018 18.25v-5.757a2.25 2.25 0 00-.659-1.591L2.659 6.22A2.25 2.25 0 012 4.629V2.34a.75.75 0 01.628-.74z" clipRule="evenodd" />
          </svg>
        );
      case 'action':
        if (result.icon === 'plus') {
          return (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
          );
        }
        if (result.icon === 'sparkles') {
          return (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M10 1a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 1zM5.05 3.05a.75.75 0 011.06 0l1.062 1.06A.75.75 0 116.11 5.173L5.05 4.11a.75.75 0 010-1.06zm9.9 0a.75.75 0 010 1.06l-1.06 1.062a.75.75 0 01-1.062-1.061l1.061-1.06a.75.75 0 011.06 0zM3 8a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 013 8zm11 0a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 0114 8zm-6.828 2.828a.75.75 0 010 1.061L6.11 12.95a.75.75 0 01-1.06-1.06l1.06-1.06a.75.75 0 011.06 0zm6.594 0a.75.75 0 011.06 0l1.06 1.06a.75.75 0 01-1.06 1.061l-1.06-1.06a.75.75 0 010-1.061zM10 14a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 14z" />
            </svg>
          );
        }
        if (result.icon === 'play') {
          return (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M2 10a8 8 0 1116 0 8 8 0 01-16 0zm6.39-2.908a.75.75 0 01.766.027l3.5 2.25a.75.75 0 010 1.262l-3.5 2.25A.75.75 0 018 12.25v-4.5a.75.75 0 01.39-.658z" clipRule="evenodd" />
            </svg>
          );
        }
        if (result.icon === 'chart') {
          return (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M15.5 2A1.5 1.5 0 0014 3.5v13a1.5 1.5 0 001.5 1.5h1a1.5 1.5 0 001.5-1.5v-13A1.5 1.5 0 0016.5 2h-1zM9.5 6A1.5 1.5 0 008 7.5v9A1.5 1.5 0 009.5 18h1a1.5 1.5 0 001.5-1.5v-9A1.5 1.5 0 0010.5 6h-1zM3.5 10A1.5 1.5 0 002 11.5v5A1.5 1.5 0 003.5 18h1A1.5 1.5 0 006 16.5v-5A1.5 1.5 0 004.5 10h-1z" />
            </svg>
          );
        }
        if (result.icon === 'upload') {
          return (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M9.25 13.25a.75.75 0 001.5 0V4.636l2.955 3.129a.75.75 0 001.09-1.03l-4.25-4.5a.75.75 0 00-1.09 0l-4.25 4.5a.75.75 0 101.09 1.03L9.25 4.636v8.614z" />
              <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
            </svg>
          );
        }
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path d="M3.75 3A1.75 1.75 0 002 4.75v3.26a3.235 3.235 0 011.75-.51h12.5c.644 0 1.245.188 1.75.51V6.75A1.75 1.75 0 0016.25 5h-4.836a.25.25 0 01-.177-.073L9.823 3.513A1.75 1.75 0 008.586 3H3.75z" />
          </svg>
        );
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative min-h-screen flex items-start justify-center pt-[15vh] px-4">
        <div className="relative w-full max-w-xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 border-b border-gray-200 dark:border-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-gray-400">
              <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search games, sessions, or type a command..."
              className="flex-1 py-4 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
            />
            <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 rounded">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[60vh] overflow-y-auto p-2">
            {results.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                No results found for "{query}"
              </div>
            ) : (
              <div className="space-y-1">
                {!query && (
                  <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Quick Actions
                  </div>
                )}
                {query && results.some(r => r.type === 'game') && (
                  <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Games
                  </div>
                )}
                {results.filter(r => r.type === 'game').map((result, idx) => (
                  <button
                    key={result.id}
                    data-selected={selectedIndex === results.indexOf(result)}
                    onClick={() => handleSelect(result)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      selectedIndex === results.indexOf(result)
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <span className="text-gray-400">{getIcon(result)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{result.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{result.subtitle}</div>
                    </div>
                  </button>
                ))}

                {query && results.some(r => r.type === 'session') && (
                  <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-2">
                    Sessions
                  </div>
                )}
                {results.filter(r => r.type === 'session').map((result) => (
                  <button
                    key={result.id}
                    data-selected={selectedIndex === results.indexOf(result)}
                    onClick={() => handleSelect(result)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      selectedIndex === results.indexOf(result)
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <span className="text-gray-400">{getIcon(result)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{result.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{result.subtitle}</div>
                    </div>
                  </button>
                ))}

                {results.filter(r => r.type === 'filter' || r.type === 'action').map((result) => (
                  <button
                    key={result.id}
                    data-selected={selectedIndex === results.indexOf(result)}
                    onClick={() => handleSelect(result)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      selectedIndex === results.indexOf(result)
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <span className="text-gray-400">{getIcon(result)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{result.name || result.label}</div>
                      {result.subtitle && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{result.subtitle}</div>
                      )}
                    </div>
                    {result.type === 'action' && (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-400">
                        <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">↑</kbd>
                <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">↓</kbd>
                navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">↵</kbd>
                select
              </span>
            </div>
            <div className="text-xs text-gray-400">
              {results.length} result{results.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
