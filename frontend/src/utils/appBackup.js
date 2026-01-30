/**
 * Full app backup/restore utility
 * Exports and imports all games, sessions, and preferences
 */
import api from './api';

const BACKUP_VERSION = '2.0';

/**
 * Create a full backup of all app data
 */
export async function createBackup(showToast) {
  try {
    // Fetch all games (no pagination limit)
    const gamesResponse = await api.get('/games', { params: { limit: 10000 } });
    const games = gamesResponse.data.games || [];

    // Fetch all sessions
    const sessionsResponse = await api.get('/sessions', { params: { limit: 10000 } });
    const sessions = sessionsResponse.data.sessions || [];

    // Get user preferences
    const userResponse = await api.get('/auth/me');
    const preferences = userResponse.data.user?.preferences || {};

    // Collect localStorage settings
    const localSettings = {
      darkMode: localStorage.getItem('darkMode'),
      dismissedTips: localStorage.getItem('dismissedTips'),
      lastSeenVersion: localStorage.getItem('lastSeenVersion'),
      onboardingComplete: localStorage.getItem('ecogram_onboarding_complete'),
      featureTourComplete: localStorage.getItem('ecogram_feature_tour_complete'),
    };

    const backup = {
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      data: {
        games: games.map(g => ({
          name: g.name,
          topic: g.topic,
          position: g.position,
          topPlayer: g.topPlayer,
          bottomPlayer: g.bottomPlayer,
          coaching: g.coaching,
          personalNotes: g.personalNotes,
          skills: g.skills,
          techniques: g.techniques,
          difficulty: g.difficulty,
          videoUrl: g.videoUrl,
          favorite: g.favorite,
          rating: g.rating,
          usageCount: g.usageCount,
          lastUsed: g.lastUsed,
          effectivenessRatings: g.effectivenessRatings,
          aiGenerated: g.aiGenerated,
          aiMetadata: g.aiMetadata,
        })),
        sessions: sessions.map(s => ({
          name: s.name,
          description: s.description,
          isTemplate: s.isTemplate,
          templateName: s.templateName,
          scheduledDate: s.scheduledDate,
          actualDuration: s.actualDuration,
          status: s.status,
          coachesNotes: s.coachesNotes,
          gameNames: s.games?.map(g => g.name) || [], // Store game names for re-linking
        })),
        preferences,
        localSettings,
      },
      stats: {
        totalGames: games.length,
        totalSessions: sessions.length,
        favoriteGames: games.filter(g => g.favorite).length,
      }
    };

    return backup;
  } catch (err) {
    console.error('Backup failed:', err);
    throw new Error('Failed to create backup: ' + (err.response?.data?.message || err.message));
  }
}

/**
 * Download backup as JSON file
 */
export function downloadBackup(backup) {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ecogram-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Restore from backup file
 */
export async function restoreBackup(backup, options = {}) {
  const {
    importGames = true,
    importSessions = true,
    importPreferences = true,
    skipDuplicates = true
  } = options;

  const results = {
    games: { imported: 0, skipped: 0, errors: [] },
    sessions: { imported: 0, skipped: 0, errors: [] },
    preferences: { restored: false }
  };

  try {
    // Validate backup format
    if (!backup.version || !backup.data) {
      throw new Error('Invalid backup format');
    }

    // Get existing games for duplicate detection
    let existingGames = [];
    if (skipDuplicates && importGames) {
      const existing = await api.get('/games', { params: { limit: 10000 } });
      existingGames = existing.data.games || [];
    }
    const existingGameNames = new Set(existingGames.map(g => g.name.toLowerCase()));

    // Import games
    if (importGames && backup.data.games) {
      for (const game of backup.data.games) {
        try {
          if (skipDuplicates && existingGameNames.has(game.name.toLowerCase())) {
            results.games.skipped++;
            continue;
          }
          await api.post('/games', game);
          results.games.imported++;
        } catch (err) {
          results.games.errors.push(`${game.name}: ${err.response?.data?.message || err.message}`);
        }
      }
    }

    // Re-fetch games for session linking
    let allGames = [];
    if (importSessions && backup.data.sessions) {
      const gamesResponse = await api.get('/games', { params: { limit: 10000 } });
      allGames = gamesResponse.data.games || [];
    }
    const gameNameToId = new Map(allGames.map(g => [g.name.toLowerCase(), g._id]));

    // Import sessions
    if (importSessions && backup.data.sessions) {
      for (const session of backup.data.sessions) {
        try {
          // Link games by name
          const gameIds = (session.gameNames || [])
            .map(name => gameNameToId.get(name.toLowerCase()))
            .filter(Boolean);

          const sessionData = {
            name: session.name,
            description: session.description,
            isTemplate: session.isTemplate,
            templateName: session.templateName,
            scheduledDate: session.scheduledDate,
            gameIds,
            coachesNotes: session.coachesNotes,
          };

          await api.post('/sessions', sessionData);
          results.sessions.imported++;
        } catch (err) {
          results.sessions.errors.push(`${session.name}: ${err.response?.data?.message || err.message}`);
        }
      }
    }

    // Restore preferences
    if (importPreferences && backup.data.preferences) {
      try {
        await api.put('/auth/preferences', backup.data.preferences);
        results.preferences.restored = true;
      } catch (err) {
        console.error('Failed to restore preferences:', err);
      }
    }

    // Restore local settings
    if (importPreferences && backup.data.localSettings) {
      const ls = backup.data.localSettings;
      if (ls.darkMode) localStorage.setItem('darkMode', ls.darkMode);
      if (ls.dismissedTips) localStorage.setItem('dismissedTips', ls.dismissedTips);
    }

    return results;
  } catch (err) {
    console.error('Restore failed:', err);
    throw new Error('Failed to restore backup: ' + err.message);
  }
}

/**
 * Read backup file and parse JSON
 */
export function readBackupFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backup = JSON.parse(e.target.result);
        resolve(backup);
      } catch (err) {
        reject(new Error('Invalid backup file format'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
