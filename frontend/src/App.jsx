import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useApp } from './context/AppContext';

// Layout components
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import ToastContainer from './components/Toast';
import Loading from './components/Loading';
import Timer from './components/Timer';
import KeyboardShortcuts from './components/KeyboardShortcuts';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Games from './pages/Games';
import Favorites from './pages/Favorites';
import Recent from './pages/Recent';
import Sessions from './pages/Sessions';
import SessionView from './pages/SessionView';
import Stats from './pages/Stats';
import AIDesigner from './pages/AIDesigner';
import Import from './pages/Import';
import Practice from './pages/Practice';

// Protected route wrapper
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <Loading text="Loading..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

// Public route wrapper (redirect to home if authenticated)
function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <Loading text="Loading..." />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// Main layout with navbar
function MainLayout({ children }) {
  const { showToast } = useApp();
  const [showTimer, setShowTimer] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if typing in input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      // N - New game (handled in Games page)
      // A - AI Designer
      if (e.key === 'a' && !e.ctrlKey && !e.metaKey) {
        window.location.href = '/ai';
      }
      // S - Search (focus search input)
      if (e.key === 's' && !e.ctrlKey && !e.metaKey) {
        const searchInput = document.querySelector('input[type="text"][placeholder*="Search"]');
        if (searchInput) {
          e.preventDefault();
          searchInput.focus();
        }
      }
      // T - Toggle timer
      if (e.key === 't' && !e.ctrlKey && !e.metaKey) {
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
      <Navbar />
      <main className="pb-28 lg:pb-8" style={{ paddingBottom: 'max(7rem, calc(5rem + env(safe-area-inset-bottom, 0px)))' }}>
        {children}
      </main>

      {/* Bottom navigation for mobile */}
      <BottomNav />

      {/* Floating timer button - hidden on mobile (Practice page has integrated timer) */}
      <button
        onClick={() => setShowTimer(true)}
        className="fab hidden lg:flex"
        title="Open Timer (T)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
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
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Games />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/favorites"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Favorites />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/recent"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Recent />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/sessions"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Sessions />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/session/:id"
        element={
          <ProtectedRoute>
            <MainLayout>
              <SessionView />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/stats"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Stats />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/ai"
        element={
          <ProtectedRoute>
            <MainLayout>
              <AIDesigner />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/import"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Import />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/practice"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Practice />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
