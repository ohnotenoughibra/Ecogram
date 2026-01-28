import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { resetOnboarding } from '../components/Onboarding';
import ConfirmDialog from '../components/ConfirmDialog';

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
  const { user, updatePassword, updatePreferences, logout } = useAuth();
  const { darkMode, setDarkMode, showToast } = useApp();

  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // App preferences (synced to backend)
  const [timerSound, setTimerSound] = useState(user?.preferences?.timerSound ?? true);
  const [defaultTimer, setDefaultTimer] = useState(user?.preferences?.defaultTimerDuration ?? 300);

  // Display preferences (synced to backend)
  const [showQuickAccess, setShowQuickAccess] = useState(user?.preferences?.showQuickAccess ?? true);
  const [showRecommendations, setShowRecommendations] = useState(user?.preferences?.showRecommendations ?? true);
  const [showGameOfDay, setShowGameOfDay] = useState(user?.preferences?.showGameOfDay ?? true);
  const [showSkillBalance, setShowSkillBalance] = useState(user?.preferences?.showSkillBalance ?? true);
  const [showPositionChips, setShowPositionChips] = useState(user?.preferences?.showPositionChips ?? true);
  const [compactMode, setCompactMode] = useState(user?.preferences?.compactMode ?? false);

  // Dialog states
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);

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

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    setPasswordLoading(true);
    const result = await updatePassword(currentPassword, newPassword);
    setPasswordLoading(false);

    if (result.success) {
      showToast('Password updated successfully', 'success');
      setShowPasswordForm(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPasswordError(result.error);
    }
  };

  const handlePreferenceSave = async (key, value) => {
    const prefs = { [key]: value };
    const result = await updatePreferences(prefs);
    if (result.success) {
      showToast('Settings saved', 'success');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
          <p className="text-gray-600 dark:text-gray-400">Manage your account and preferences</p>
        </div>

        {/* User Info Card */}
        <div className="card p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
              <span className="text-primary-600 dark:text-primary-400 font-bold text-2xl">
                {user?.username?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {user?.username}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">{user?.email}</p>
              <p className="text-xs text-gray-500 mt-1">
                Member since {user?.createdAt ? formatDate(user.createdAt) : 'N/A'}
              </p>
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

        {/* Security Card */}
        <div className="card p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Security
          </h3>

          {!showPasswordForm ? (
            <button
              onClick={() => setShowPasswordForm(true)}
              className="btn-secondary"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2">
                <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
              </svg>
              Change Password
            </button>
          ) : (
            <form onSubmit={handlePasswordChange} className="space-y-4">
              {passwordError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">{passwordError}</p>
                </div>
              )}

              <div>
                <label className="label">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="label">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="label">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input"
                  required
                  minLength={6}
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="btn-primary"
                >
                  {passwordLoading ? <span className="spinner" /> : 'Update Password'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setPasswordError('');
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Help & Tips Card */}
        <div className="card p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Help & Tips
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-gray-900 dark:text-white font-medium">Tutorial</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">See the welcome tutorial again</p>
              </div>
              <button
                onClick={() => {
                  resetOnboarding();
                  showToast('Tutorial reset - refresh to see it', 'success');
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
        <div className="card p-6 mb-6">
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

        {/* Account Actions */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Account
          </h3>

          <button
            onClick={() => setShowConfirmLogout(true)}
            className="w-full btn-secondary text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2">
              <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z" clipRule="evenodd" />
              <path fillRule="evenodd" d="M19 10a.75.75 0 00-.75-.75H8.704l1.048-.943a.75.75 0 10-1.004-1.114l-2.5 2.25a.75.75 0 000 1.114l2.5 2.25a.75.75 0 101.004-1.114l-1.048-.943h9.546A.75.75 0 0019 10z" clipRule="evenodd" />
            </svg>
            Sign Out
          </button>
        </div>

        {/* Confirm Logout Dialog */}
        <ConfirmDialog
          isOpen={showConfirmLogout}
          onClose={() => setShowConfirmLogout(false)}
          onConfirm={() => {
            logout();
            setShowConfirmLogout(false);
          }}
          title="Sign Out"
          message="Are you sure you want to sign out?"
          confirmText="Sign Out"
          type="warning"
        />
      </div>
    </div>
  );
}
