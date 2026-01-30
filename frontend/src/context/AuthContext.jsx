import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

// Default user for auth-less mode
const DEFAULT_USER = {
  _id: 'default',
  username: 'Coach',
  email: 'default@ecogram.local',
  preferences: {
    darkMode: false,
    timerSound: true,
    defaultTimerDuration: 300,
    showQuickAccess: true,
    showRecommendations: true,
    showGameOfDay: true,
    showSkillBalance: true,
    showPositionChips: true,
    compactMode: false
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(DEFAULT_USER);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedPrefs = localStorage.getItem('ecogram_preferences');
    if (savedPrefs) {
      try {
        const prefs = JSON.parse(savedPrefs);
        setUser(prev => ({ ...prev, preferences: { ...prev.preferences, ...prefs } }));
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, []);

  // Login is no longer required but kept for compatibility
  const login = async (email, password) => {
    return { success: true };
  };

  // Register is no longer required but kept for compatibility
  const register = async (username, email, password) => {
    return { success: true };
  };

  // Logout just resets to default user
  const logout = useCallback(() => {
    setUser(DEFAULT_USER);
    setError(null);
  }, []);

  // Update preferences - save to localStorage
  const updatePreferences = async (preferences) => {
    try {
      const newPrefs = { ...user.preferences, ...preferences };
      setUser(prev => ({ ...prev, preferences: newPrefs }));
      localStorage.setItem('ecogram_preferences', JSON.stringify(newPrefs));
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Failed to update preferences' };
    }
  };

  // Password update - no longer needed
  const updatePassword = async (currentPassword, newPassword) => {
    return { success: true };
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updatePreferences,
    updatePassword,
    isAuthenticated: true // Always authenticated in auth-less mode
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
