import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const actions = [
  {
    id: 'new-game',
    label: 'New Game',
    shortcut: 'N',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
        <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
      </svg>
    ),
    color: 'bg-primary-500',
    action: 'new-game'
  },
  {
    id: 'ai-designer',
    label: 'AI Designer',
    shortcut: 'A',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
        <path d="M15.98 1.804a1 1 0 00-1.96 0l-.24 1.192a1 1 0 01-.784.785l-1.192.238a1 1 0 000 1.962l1.192.238a1 1 0 01.785.785l.238 1.192a1 1 0 001.962 0l.238-1.192a1 1 0 01.785-.785l1.192-.238a1 1 0 000-1.962l-1.192-.238a1 1 0 01-.785-.785l-.238-1.192zM6.949 5.684a1 1 0 00-1.898 0l-.683 2.051a1 1 0 01-.633.633l-2.051.683a1 1 0 000 1.898l2.051.684a1 1 0 01.633.632l.683 2.051a1 1 0 001.898 0l.683-2.051a1 1 0 01.633-.633l2.051-.683a1 1 0 000-1.898l-2.051-.683a1 1 0 01-.633-.633L6.95 5.684z" />
      </svg>
    ),
    color: 'bg-purple-500',
    path: '/ai'
  },
  {
    id: 'new-session',
    label: 'New Session',
    shortcut: 'S',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
        <path d="M3.75 3A1.75 1.75 0 002 4.75v3.26a3.235 3.235 0 011.75-.51h12.5c.644 0 1.245.188 1.75.51V6.75A1.75 1.75 0 0016.25 5h-4.836a.25.25 0 01-.177-.073L9.823 3.513A1.75 1.75 0 008.586 3H3.75z" />
        <path fillRule="evenodd" d="M3.75 9A1.75 1.75 0 002 10.75v4.5c0 .966.784 1.75 1.75 1.75h12.5A1.75 1.75 0 0018 15.25v-4.5A1.75 1.75 0 0016.25 9H3.75zM10 12a.75.75 0 01.75.75v.5h.5a.75.75 0 010 1.5h-.5v.5a.75.75 0 01-1.5 0v-.5h-.5a.75.75 0 010-1.5h.5v-.5A.75.75 0 0110 12z" clipRule="evenodd" />
      </svg>
    ),
    color: 'bg-blue-500',
    action: 'new-session'
  },
  {
    id: 'practice',
    label: 'Quick Practice',
    shortcut: 'T',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M2 10a8 8 0 1116 0 8 8 0 01-16 0zm6.39-2.908a.75.75 0 01.766.027l3.5 2.25a.75.75 0 010 1.262l-3.5 2.25A.75.75 0 018 12.25v-4.5a.75.75 0 01.39-.658z" clipRule="evenodd" />
      </svg>
    ),
    color: 'bg-green-500',
    path: '/practice'
  }
];

export default function QuickActions({ onNewGame, onNewSession }) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef(null);

  // Close on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleAction = (action) => {
    setIsOpen(false);

    if (action.path) {
      navigate(action.path);
    } else if (action.action === 'new-game') {
      // Navigate to Games page with ?new=true to open modal
      if (onNewGame) {
        onNewGame();
      } else {
        navigate('/?new=true');
      }
    } else if (action.action === 'new-session') {
      // Navigate to Sessions page with ?new=true to open modal
      if (onNewSession) {
        onNewSession();
      } else {
        navigate('/sessions?new=true');
      }
    }
  };

  // Hide on certain pages
  const hiddenPaths = ['/login', '/register', '/forgot-password'];
  if (hiddenPaths.some(p => location.pathname.startsWith(p))) {
    return null;
  }

  return (
    <div ref={menuRef} className="fixed right-4 bottom-24 lg:bottom-6 z-30">
      {/* Action buttons */}
      <div
        className={`absolute bottom-16 right-0 flex flex-col-reverse gap-3 transition-all duration-300 ${
          isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        {actions.map((action, index) => (
          <button
            key={action.id}
            onClick={() => handleAction(action)}
            className={`flex items-center gap-2 ${action.color} text-white pl-4 pr-3 py-2.5 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105`}
            style={{
              transitionDelay: isOpen ? `${index * 50}ms` : '0ms',
              animation: isOpen ? `slideIn 0.2s ease-out ${index * 50}ms both` : 'none'
            }}
            title={action.shortcut ? `Press ${action.shortcut}` : undefined}
          >
            <span className="text-sm font-medium whitespace-nowrap">{action.label}</span>
            {action.shortcut && (
              <span className="text-[10px] font-bold bg-white/20 px-1.5 py-0.5 rounded ml-1">
                {action.shortcut}
              </span>
            )}
            {action.icon}
          </button>
        ))}
      </div>

      {/* Main FAB */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`w-14 h-14 rounded-full bg-primary-600 hover:bg-primary-700 text-white shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-300 ${
          isOpen ? 'rotate-45 bg-gray-600 hover:bg-gray-700' : ''
        }`}
        aria-label="Quick actions"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
          <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
        </svg>
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 -z-10"
          onClick={() => setIsOpen(false)}
        />
      )}

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}
