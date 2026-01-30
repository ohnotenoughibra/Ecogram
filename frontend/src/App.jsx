import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useApp } from './context/AppContext';

// Layout components
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import ToastContainer from './components/Toast';
import Timer from './components/Timer';
import KeyboardShortcuts from './components/KeyboardShortcuts';
import OfflineIndicator from './components/OfflineIndicator';
import Onboarding from './components/Onboarding';
import FeatureTour from './components/FeatureTour';
import QuickActions from './components/QuickActions';
import GlobalSearch from './components/GlobalSearch';

// Pages
import Profile from './pages/Profile';
import Games from './pages/Games';
import Favorites from './pages/Favorites';
import Recent from './pages/Recent';
import Sessions from './pages/Sessions';
import SessionView from './pages/SessionView';
import Stats from './pages/Stats';
import AIDesigner from './pages/AIDesigner';
import Import from './pages/Import';
import Practice from './pages/Practice';
import CompetitionPrep from './pages/CompetitionPrep';
import Goals from './pages/Goals';
import ProblemSolver from './pages/ProblemSolver';
import Learn from './pages/Learn';

// Main layout with navbar
function MainLayout({ children }) {
  const { showToast } = useApp();
  const [showTimer, setShowTimer] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [showFeatureTour, setShowFeatureTour] = useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isMod = e.ctrlKey || e.metaKey;

      // Cmd/Ctrl+K - Global search (works even in inputs)
      if (isMod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowGlobalSearch(prev => !prev);
        return;
      }

      // Ignore other shortcuts if typing in input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      // Navigation shortcuts with Ctrl/Cmd
      if (isMod) {
        switch (e.key.toLowerCase()) {
          case 'g':
            e.preventDefault();
            window.location.href = '/';
            break;
          case 'e':
            e.preventDefault();
            window.location.href = '/sessions';
            break;
          case 'p':
            e.preventDefault();
            window.location.href = '/practice';
            break;
          default:
            break;
        }
        return;
      }

      // Non-modifier shortcuts
      // N - New game (handled in Games page)
      // A - AI Designer
      if (e.key === 'a') {
        window.location.href = '/ai';
      }
      // S - Search (focus search input)
      if (e.key === 's') {
        const searchInput = document.querySelector('input[type="text"][placeholder*="Search"]');
        if (searchInput) {
          e.preventDefault();
          searchInput.focus();
        }
      }
      // T - Toggle timer
      if (e.key === 't') {
        setShowTimer(prev => !prev);
      }
      // ? - Show shortcuts help
      if (e.key === '?') {
        setShowShortcuts(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showToast]);

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <OfflineIndicator />
      <Navbar />
      <main className="pb-28 lg:pb-8" style={{ paddingBottom: 'max(7rem, calc(5rem + env(safe-area-inset-bottom, 0px)))' }}>
        {children}
      </main>

      {/* Bottom navigation for mobile */}
      <BottomNav />

      {/* Floating timer button - Positioned on LEFT to avoid overlap with QuickActions FAB */}
      <button
        onClick={() => setShowTimer(true)}
        className="fixed left-4 bottom-24 lg:bottom-6 w-12 h-12 lg:w-14 lg:h-14 bg-gray-600 hover:bg-gray-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-40"
        title="Open Timer (T)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 lg:w-6 lg:h-6">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Global timer */}
      <Timer
        isOpen={showTimer}
        onClose={() => setShowTimer(false)}
      />

      {/* Toast notifications */}
      <ToastContainer />

      {/* Keyboard shortcuts help */}
      <KeyboardShortcuts
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />

      {/* Onboarding tutorial for new users */}
      {showOnboarding && (
        <Onboarding onComplete={() => {
          setShowOnboarding(false);
          // Start feature tour after onboarding (with delay for UI to render)
          setTimeout(() => setShowFeatureTour(true), 500);
        }} />
      )}

      {/* Interactive feature tour */}
      {showFeatureTour && (
        <FeatureTour
          onComplete={() => setShowFeatureTour(false)}
          autoStart={true}
        />
      )}

      {/* Quick actions FAB */}
      <QuickActions />

      {/* Global search modal (Cmd/Ctrl+K) */}
      <GlobalSearch
        isOpen={showGlobalSearch}
        onClose={() => setShowGlobalSearch(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* All routes are now accessible without authentication */}
      <Route path="/" element={<MainLayout><Games /></MainLayout>} />
      <Route path="/favorites" element={<MainLayout><Favorites /></MainLayout>} />
      <Route path="/recent" element={<MainLayout><Recent /></MainLayout>} />
      <Route path="/sessions" element={<MainLayout><Sessions /></MainLayout>} />
      <Route path="/session/:id" element={<MainLayout><SessionView /></MainLayout>} />
      <Route path="/stats" element={<MainLayout><Stats /></MainLayout>} />
      <Route path="/ai" element={<MainLayout><AIDesigner /></MainLayout>} />
      <Route path="/import" element={<MainLayout><Import /></MainLayout>} />
      <Route path="/practice" element={<MainLayout><Practice /></MainLayout>} />
      <Route path="/profile" element={<MainLayout><Profile /></MainLayout>} />
      <Route path="/competition" element={<MainLayout><CompetitionPrep /></MainLayout>} />
      <Route path="/goals" element={<MainLayout><Goals /></MainLayout>} />
      <Route path="/problems" element={<MainLayout><ProblemSolver /></MainLayout>} />
      <Route path="/learn" element={<MainLayout><Learn /></MainLayout>} />

      {/* Redirect old auth routes to home */}
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/register" element={<Navigate to="/" replace />} />
      <Route path="/forgot-password" element={<Navigate to="/" replace />} />
      <Route path="/reset-password/:token" element={<Navigate to="/" replace />} />

      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
