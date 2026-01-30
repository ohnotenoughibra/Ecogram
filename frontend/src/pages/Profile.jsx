import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { resetOnboarding } from '../components/Onboarding';
import { resetFeatureTour } from '../components/FeatureTour';
import { createBackup, downloadBackup, restoreBackup, readBackupFile } from '../utils/appBackup';

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
  const { darkMode, setDarkMode, showToast, fetchGames, fetchSessions } = useApp();
  const fileInputRef = useRef(null);

  // App preferences
  const [timerSound, setTimerSound] = useState(user?.preferences?.timerSound ?? true);
  const [defaultTimer, setDefaultTimer] = useState(user?.preferences?.defaultTimerDuration ?? 300);

  // Backup/restore state
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupPreview, setBackupPreview] = useState(null);
  const [restoreOptions, setRestoreOptions] = useState({
    importGames: true,
    importSessions: true,
    importPreferences: true,
    skipDuplicates: true
  });

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

  // Backup handlers
  const handleCreateBackup = async () => {
    setIsBackingUp(true);
    try {
      const backup = await createBackup();
      downloadBackup(backup);
      showToast(`Backup created: ${backup.stats.totalGames} games, ${backup.stats.totalSessions} sessions`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const backup = await readBackupFile(file);
      setBackupPreview(backup);
    } catch (err) {
      showToast(err.message, 'error');
    }
    e.target.value = ''; // Reset input
  };

  const handleRestore = async () => {
    if (!backupPreview) return;

    setIsRestoring(true);
    try {
      const results = await restoreBackup(backupPreview, restoreOptions);

      // Refresh data
      await fetchGames();
      await fetchSessions();

      // Build result message
      const msgs = [];
      if (results.games.imported > 0) msgs.push(`${results.games.imported} games imported`);
      if (results.games.skipped > 0) msgs.push(`${results.games.skipped} games skipped (duplicates)`);
      if (results.sessions.imported > 0) msgs.push(`${results.sessions.imported} sessions imported`);
      if (results.preferences.restored) msgs.push('preferences restored');

      showToast(msgs.join(', ') || 'Restore complete', 'success');
      setBackupPreview(null);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsRestoring(false);
    }
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

        {/* Data Management Card */}
        <div className="card p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Data Management
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Backup and restore your games, sessions, and preferences
          </p>

          <div className="space-y-4">
            {/* Backup Button */}
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-gray-900 dark:text-white font-medium">Create Backup</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Download all your data as a JSON file</p>
              </div>
              <button
                onClick={handleCreateBackup}
                disabled={isBackingUp}
                className="btn-primary text-sm py-1.5 px-4 flex items-center gap-2"
              >
                {isBackingUp ? (
                  <>
                    <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    Creating...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
                      <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                    </svg>
                    Download Backup
                  </>
                )}
              </button>
            </div>

            {/* Restore Section */}
            <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-gray-900 dark:text-white font-medium">Restore from Backup</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Import data from a backup file</p>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-secondary text-sm py-1.5 px-4 flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path d="M9.25 13.25a.75.75 0 001.5 0V4.636l2.955 3.129a.75.75 0 001.09-1.03l-4.25-4.5a.75.75 0 00-1.09 0l-4.25 4.5a.75.75 0 101.09 1.03L9.25 4.636v8.614z" />
                    <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                  </svg>
                  Select File
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Backup Preview */}
              {backupPreview && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg animate-fade-in">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Backup Preview</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Created: {new Date(backupPreview.exportedAt).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => setBackupPreview(null)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                        <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                      </svg>
                    </button>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="text-center p-2 bg-white dark:bg-gray-700 rounded">
                      <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
                        {backupPreview.stats?.totalGames || backupPreview.data?.games?.length || 0}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Games</p>
                    </div>
                    <div className="text-center p-2 bg-white dark:bg-gray-700 rounded">
                      <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
                        {backupPreview.stats?.totalSessions || backupPreview.data?.sessions?.length || 0}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Sessions</p>
                    </div>
                    <div className="text-center p-2 bg-white dark:bg-gray-700 rounded">
                      <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
                        {backupPreview.stats?.favoriteGames || 0}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Favorites</p>
                    </div>
                  </div>

                  {/* Options */}
                  <div className="space-y-2 mb-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={restoreOptions.importGames}
                        onChange={(e) => setRestoreOptions(prev => ({ ...prev, importGames: e.target.checked }))}
                        className="checkbox"
                      />
                      <span className="text-gray-700 dark:text-gray-300">Import games</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={restoreOptions.importSessions}
                        onChange={(e) => setRestoreOptions(prev => ({ ...prev, importSessions: e.target.checked }))}
                        className="checkbox"
                      />
                      <span className="text-gray-700 dark:text-gray-300">Import sessions</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={restoreOptions.importPreferences}
                        onChange={(e) => setRestoreOptions(prev => ({ ...prev, importPreferences: e.target.checked }))}
                        className="checkbox"
                      />
                      <span className="text-gray-700 dark:text-gray-300">Restore preferences</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={restoreOptions.skipDuplicates}
                        onChange={(e) => setRestoreOptions(prev => ({ ...prev, skipDuplicates: e.target.checked }))}
                        className="checkbox"
                      />
                      <span className="text-gray-700 dark:text-gray-300">Skip duplicate games</span>
                    </label>
                  </div>

                  {/* Restore Button */}
                  <button
                    onClick={handleRestore}
                    disabled={isRestoring}
                    className="w-full btn-primary flex items-center justify-center gap-2"
                  >
                    {isRestoring ? (
                      <>
                        <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                        Restoring...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                          <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd" />
                        </svg>
                        Restore Data
                      </>
                    )}
                  </button>
                </div>
              )}
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
