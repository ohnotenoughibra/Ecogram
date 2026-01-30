import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { resetOnboarding } from '../components/Onboarding';
import { resetFeatureTour } from '../components/FeatureTour';

// Toggle switch component for cleaner code
function Toggle({ enabled, onChange, label, description }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <div>
        <p className="text-gray-900 dark:text-white font-medium">{label}</p>
        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
        )}
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          enabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
        }`}
        role="switch"
        aria-checked={enabled}
      >
        <span
          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
            enabled ? 'left-7' : 'left-1'
          }`}
        />
      </button>
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, updatePreferences } = useAuth();
  const { darkMode, setDarkMode, showToast } = useApp();

  // App preferences
  const [timerSound, setTimerSound] = useState(user?.preferences?.timerSound ?? true);
  const [defaultTimer, setDefaultTimer] = useState(user?.preferences?.defaultTimerDuration ?? 300);

  // Display preferences
  const [showQuickAccess, setShowQuickAccess] = useState(user?.preferences?.showQuickAccess ?? true);
  const [showRecommendations, setShowRecommendations] = useState(user?.preferences?.showRecommendations ?? true);
  const [showGameOfDay, setShowGameOfDay] = useState(user?.preferences?.showGameOfDay ?? true);
  const [showSkillBalance, setShowSkillBalance] = useState(user?.preferences?.showSkillBalance ?? true);
  const [showPositionChips, setShowPositionChips] = useState(user?.preferences?.showPositionChips ?? true);
  const [compactMode, setCompactMode] = useState(user?.preferences?.compactMode ?? false);

  // Update local state when user data loads
  useEffect(() => {
    if (user?.preferences) {
      setTimerSound(user.preferences.timerSound ?? true);
      setDefaultTimer(user.preferences.defaultTimerDuration ?? 300);
      setShowQuickAccess(user.preferences.showQuickAccess ?? true);
      setShowRecommendations(user.preferences.showRecommendations ?? true);
      setShowGameOfDay(user.preferences.showGameOfDay ?? true);
      setShowSkillBalance(user.preferences.showSkillBalance ?? true);
      setShowPositionChips(user.preferences.showPositionChips ?? true);
      setCompactMode(user.preferences.compactMode ?? false);
    }
  }, [user]);

  const handlePreferenceSave = async (key, value) => {
    const prefs = { [key]: value };
    const result = await updatePreferences(prefs);
    if (result.success) {
      showToast('Settings saved', 'success');
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins} minutes`;
  };

  return (
    <div className="page-container">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your preferences</p>
        </div>

        {/* User Info Card */}
        <div className="card p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
              <span className="text-primary-600 dark:text-primary-400 font-bold text-2xl">
                {user?.username?.[0]?.toUpperCase() || 'C'}
              </span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {user?.username || 'Coach'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">BJJ Training Game Library</p>
            </div>
            <button
              onClick={() => navigate('/stats')}
              className="btn-secondary text-sm"
            >
              View Stats
            </button>
          </div>
        </div>

        {/* Display Settings Card */}
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Display Settings
            </h3>
            <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
              Games Page
            </span>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Customize what appears on your Games page
          </p>

          <div className="space-y-1">
            <Toggle
              enabled={showQuickAccess}
              onChange={(val) => {
                setShowQuickAccess(val);
                handlePreferenceSave('showQuickAccess', val);
              }}
              label="Quick Access"
              description="Show favorites, recent games, and upcoming sessions"
            />

            <Toggle
              enabled={showRecommendations}
              onChange={(val) => {
                setShowRecommendations(val);
                handlePreferenceSave('showRecommendations', val);
              }}
              label="Training Recommendations"
              description="Smart tips based on your training patterns"
            />

            <Toggle
              enabled={showGameOfDay}
              onChange={(val) => {
                setShowGameOfDay(val);
                handlePreferenceSave('showGameOfDay', val);
              }}
              label="Game of the Day"
              description="Daily suggested game to practice"
            />

            <Toggle
              enabled={showSkillBalance}
              onChange={(val) => {
                setShowSkillBalance(val);
                handlePreferenceSave('showSkillBalance', val);
              }}
              label="Skill Balance"
              description="Training balance visualization"
            />

            <Toggle
              enabled={showPositionChips}
              onChange={(val) => {
                setShowPositionChips(val);
                handlePreferenceSave('showPositionChips', val);
              }}
              label="Position Quick Filters"
              description="One-tap position filter buttons"
            />

            <Toggle
              enabled={compactMode}
              onChange={(val) => {
                setCompactMode(val);
                handlePreferenceSave('compactMode', val);
              }}
              label="Compact Mode"
              description="Minimize dashboard sections for faster access to games"
            />
          </div>
        </div>

        {/* App Preferences Card */}
        <div className="card p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            App Preferences
          </h3>

          <div className="space-y-1">
            <Toggle
              enabled={darkMode}
              onChange={(val) => {
                setDarkMode(val);
                handlePreferenceSave('darkMode', val);
              }}
              label="Dark Mode"
              description="Use dark theme"
            />

            <Toggle
              enabled={timerSound}
              onChange={(val) => {
                setTimerSound(val);
                handlePreferenceSave('timerSound', val);
              }}
              label="Timer Sound"
              description="Play sound when timer ends"
            />

            {/* Default Timer Duration */}
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-gray-900 dark:text-white font-medium">Default Timer</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Current: {formatDuration(defaultTimer)}
                </p>
              </div>
              <select
                value={defaultTimer}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  setDefaultTimer(value);
                  handlePreferenceSave('defaultTimerDuration', value);
                }}
                className="input py-2 w-32"
              >
                <option value={60}>1 minute</option>
                <option value={120}>2 minutes</option>
                <option value={180}>3 minutes</option>
                <option value={300}>5 minutes</option>
                <option value={600}>10 minutes</option>
                <option value={900}>15 minutes</option>
              </select>
            </div>
          </div>
        </div>

        {/* Help & Tips Card */}
        <div className="card p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Help & Tips
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-gray-900 dark:text-white font-medium">Tutorial & Tour</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">See welcome tutorial and feature tour again</p>
              </div>
              <button
                onClick={() => {
                  resetOnboarding();
                  resetFeatureTour();
                  showToast('Tutorial & tour reset - refresh to see them', 'success');
                }}
                className="btn-secondary text-sm py-1.5 px-3"
              >
                Reset
              </button>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-gray-900 dark:text-white font-medium">Feature Tips</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Show all feature tips again</p>
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem('dismissedTips');
                  localStorage.removeItem('lastSeenVersion');
                  localStorage.removeItem('dismissedRecommendations');
                  localStorage.removeItem('gotd_dismissed');
                  showToast('All tips reset', 'success');
                }}
                className="btn-secondary text-sm py-1.5 px-3"
              >
                Reset All
              </button>
            </div>
          </div>
        </div>

        {/* About Card */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            About Ecogram
          </h3>

          <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
            <p>
              <strong className="text-gray-900 dark:text-white">Constraints-Led Approach (CLA)</strong><br />
              Ecogram uses ecological dynamics principles to help you design effective training games.
              Instead of drilling techniques in isolation, games create constraints that guide natural
              learning through problem-solving.
            </p>
            <p className="text-xs text-gray-500 pt-2 border-t border-gray-100 dark:border-gray-800">
              Version 2.0 | Built for NoGi practitioners
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
