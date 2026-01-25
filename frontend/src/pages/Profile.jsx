import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { resetOnboarding } from '../components/Onboarding';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Profile() {
  const { user, updatePassword, updatePreferences, logout } = useAuth();
  const { darkMode, setDarkMode, showToast, games, sessions } = useApp();

  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Preferences state
  const [timerSound, setTimerSound] = useState(user?.preferences?.timerSound ?? true);
  const [defaultTimer, setDefaultTimer] = useState(user?.preferences?.defaultTimerDuration ?? 300);
  const [showBalanceTips, setShowBalanceTips] = useState(
    localStorage.getItem('showBalanceTips') !== 'false'
  );
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);
  const [showConfirmClearData, setShowConfirmClearData] = useState(false);

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
      showToast('Preferences saved', 'success');
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your account settings</p>
        </div>

        {/* User Info Card */}
        <div className="card p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
              <span className="text-primary-600 dark:text-primary-400 font-bold text-2xl">
                {user?.username?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {user?.username}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between py-3 border-b border-gray-100 dark:border-gray-800">
              <span className="text-gray-500 dark:text-gray-400">Username</span>
              <span className="text-gray-900 dark:text-white font-medium">{user?.username}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-gray-100 dark:border-gray-800">
              <span className="text-gray-500 dark:text-gray-400">Email</span>
              <span className="text-gray-900 dark:text-white font-medium">{user?.email}</span>
            </div>
            <div className="flex justify-between py-3">
              <span className="text-gray-500 dark:text-gray-400">Member since</span>
              <span className="text-gray-900 dark:text-white font-medium">
                {user?.createdAt ? formatDate(user.createdAt) : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Preferences Card */}
        <div className="card p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Preferences
          </h3>

          <div className="space-y-4">
            {/* Dark Mode */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
              <div>
                <p className="text-gray-900 dark:text-white font-medium">Dark Mode</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Use dark theme</p>
              </div>
              <button
                onClick={() => {
                  setDarkMode(!darkMode);
                  handlePreferenceSave('darkMode', !darkMode);
                }}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  darkMode ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    darkMode ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Timer Sound */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
              <div>
                <p className="text-gray-900 dark:text-white font-medium">Timer Sound</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Play sound when timer ends</p>
              </div>
              <button
                onClick={() => {
                  setTimerSound(!timerSound);
                  handlePreferenceSave('timerSound', !timerSound);
                }}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  timerSound ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    timerSound ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>

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

        {/* Training Preferences Card */}
        <div className="card p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Training Preferences
          </h3>

          <div className="space-y-4">
            {/* Balance Tips */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
              <div>
                <p className="text-gray-900 dark:text-white font-medium">Balance Suggestions</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Show training balance tips</p>
              </div>
              <button
                onClick={() => {
                  const newValue = !showBalanceTips;
                  setShowBalanceTips(newValue);
                  localStorage.setItem('showBalanceTips', newValue.toString());
                  showToast(newValue ? 'Balance tips enabled' : 'Balance tips hidden', 'success');
                }}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  showBalanceTips ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    showBalanceTips ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Reset Tutorial */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
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

            {/* Clear Tips */}
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-gray-900 dark:text-white font-medium">Feature Tips</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Show all feature tips again</p>
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem('dismissedTips');
                  localStorage.removeItem('lastSeenVersion');
                  showToast('Tips reset - they will appear again', 'success');
                }}
                className="btn-secondary text-sm py-1.5 px-3"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Stats Card */}
        <div className="card p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Your Library
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-center">
              <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                {games?.length || 0}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Games</p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {sessions?.length || 0}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Sessions</p>
            </div>
          </div>

          {/* Topic Distribution */}
          {games?.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Topic Distribution</p>
              <div className="flex gap-2">
                {['offensive', 'defensive', 'control', 'transition'].map(topic => {
                  const count = games.filter(g => g.topic === topic).length;
                  const colors = {
                    offensive: 'bg-red-500',
                    defensive: 'bg-blue-500',
                    control: 'bg-purple-500',
                    transition: 'bg-green-500'
                  };
                  return (
                    <div
                      key={topic}
                      className={`flex-1 h-2 rounded-full ${colors[topic]}`}
                      style={{ opacity: count ? Math.max(0.3, count / Math.max(...['offensive', 'defensive', 'control', 'transition'].map(t => games.filter(g => g.topic === t).length), 1)) : 0.2 }}
                      title={`${topic}: ${count} games`}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Off</span>
                <span>Def</span>
                <span>Ctrl</span>
                <span>Trans</span>
              </div>
            </div>
          )}
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
              learning through problem-solving in context.
            </p>
            <p>
              <strong className="text-gray-900 dark:text-white">Balanced Training</strong><br />
              The four pillars (Offensive, Defensive, Control, Transition) ensure well-rounded
              skill development. The app suggests games to fill gaps in your training.
            </p>
            <p className="text-xs text-gray-500">
              Version 2.0 | Built for NoGi practitioners
            </p>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="card p-6 border-red-200 dark:border-red-900/50">
          <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">
            Account Actions
          </h3>

          <div className="space-y-3">
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
          message="Are you sure you want to sign out? You'll need to log in again to access your games and sessions."
          confirmText="Sign Out"
          type="warning"
        />
      </div>
    </div>
  );
}
