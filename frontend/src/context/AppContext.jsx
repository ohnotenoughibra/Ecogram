import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const { user, isAuthenticated } = useAuth();

  // Games state
  const [games, setGames] = useState([]);
  const [gamesLoading, setGamesLoading] = useState(false);
  const [gamesPagination, setGamesPagination] = useState({ page: 1, pages: 1, total: 0 });

  // Sessions state
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // Stats state
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // UI state
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [selectedGames, setSelectedGames] = useState(new Set());
  const [toasts, setToasts] = useState([]);

  // Filter state
  const [filters, setFilters] = useState({
    topic: '',
    search: '',
    favorite: false,
    position: '',
    technique: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // Apply dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Sync dark mode with user preferences
  useEffect(() => {
    if (user?.preferences?.darkMode !== undefined) {
      setDarkMode(user.preferences.darkMode);
    }
  }, [user?.preferences?.darkMode]);

  // Toast helpers
  const showToast = useCallback((message, type = 'info', duration = 3000, action = null) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, action }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, action ? 5000 : duration); // Longer duration when there's an action
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Games API calls
  const fetchGames = useCallback(async (options = {}) => {
    if (!isAuthenticated) return;

    setGamesLoading(true);
    try {
      const params = {
        page: options.page || 1,
        limit: options.limit || 20,
        ...filters,
        ...options
      };

      // Remove empty values
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === false) {
          delete params[key];
        }
      });

      const response = await api.get('/games', { params });
      setGames(response.data.games);
      setGamesPagination(response.data.pagination);
    } catch (err) {
      showToast('Failed to fetch games', 'error');
    } finally {
      setGamesLoading(false);
    }
  }, [isAuthenticated, filters, showToast]);

  const fetchRecentGames = useCallback(async (limit = 10) => {
    if (!isAuthenticated) return [];
    try {
      const response = await api.get('/games/recent', { params: { limit } });
      return response.data;
    } catch (err) {
      showToast('Failed to fetch recent games', 'error');
      return [];
    }
  }, [isAuthenticated, showToast]);

  const createGame = useCallback(async (gameData) => {
    try {
      const response = await api.post('/games', gameData);
      setGames(prev => [response.data, ...prev]);
      showToast('Game created successfully', 'success');
      return { success: true, game: response.data };
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create game', 'error');
      return { success: false };
    }
  }, [showToast]);

  const updateGame = useCallback(async (id, gameData) => {
    try {
      const response = await api.put(`/games/${id}`, gameData);
      setGames(prev => prev.map(g => g._id === id ? response.data : g));
      showToast('Game updated successfully', 'success');
      return { success: true, game: response.data };
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update game', 'error');
      return { success: false };
    }
  }, [showToast]);

  const deleteGame = useCallback(async (id) => {
    try {
      await api.delete(`/games/${id}`);
      setGames(prev => prev.filter(g => g._id !== id));
      setSelectedGames(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      showToast('Game deleted', 'success');
      return { success: true };
    } catch (err) {
      showToast('Failed to delete game', 'error');
      return { success: false };
    }
  }, [showToast]);

  const markGameUsed = useCallback(async (id) => {
    try {
      const response = await api.put(`/games/${id}/use`);
      setGames(prev => prev.map(g => g._id === id ? response.data : g));
      return { success: true };
    } catch (err) {
      return { success: false };
    }
  }, []);

  const duplicateGame = useCallback(async (game) => {
    try {
      // Create a copy of the game data, excluding certain fields
      const duplicatedData = {
        name: `${game.name} (Copy)`,
        topic: game.topic,
        gameType: game.gameType,
        difficulty: game.difficulty,
        topPlayer: game.topPlayer,
        bottomPlayer: game.bottomPlayer,
        coaching: game.coaching,
        personalNotes: game.personalNotes,
        skills: [...(game.skills || [])]
      };

      const response = await api.post('/games', duplicatedData);
      setGames(prev => [response.data, ...prev]);
      showToast('Game duplicated successfully', 'success');
      return { success: true, game: response.data };
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to duplicate game', 'error');
      return { success: false };
    }
  }, [showToast]);

  const bulkGameAction = useCallback(async (action) => {
    if (selectedGames.size === 0) return;

    try {
      await api.post('/games/bulk', {
        gameIds: Array.from(selectedGames),
        action
      });

      if (action === 'delete') {
        setGames(prev => prev.filter(g => !selectedGames.has(g._id)));
      } else if (action === 'favorite') {
        setGames(prev => prev.map(g =>
          selectedGames.has(g._id) ? { ...g, favorite: true } : g
        ));
      } else if (action === 'unfavorite') {
        setGames(prev => prev.map(g =>
          selectedGames.has(g._id) ? { ...g, favorite: false } : g
        ));
      }

      setSelectedGames(new Set());
      showToast(`${action === 'delete' ? 'Deleted' : 'Updated'} ${selectedGames.size} games`, 'success');
    } catch (err) {
      showToast('Bulk operation failed', 'error');
    }
  }, [selectedGames, showToast]);

  // Sessions API calls
  const fetchSessions = useCallback(async (options = {}) => {
    if (!isAuthenticated) return;

    setSessionsLoading(true);
    try {
      const response = await api.get('/sessions', { params: options });
      setSessions(response.data.sessions);
    } catch (err) {
      showToast('Failed to fetch sessions', 'error');
    } finally {
      setSessionsLoading(false);
    }
  }, [isAuthenticated, showToast]);

  const createSession = useCallback(async (sessionData) => {
    try {
      const response = await api.post('/sessions', sessionData);
      setSessions(prev => [response.data, ...prev]);
      showToast('Session created successfully', 'success');
      return { success: true, session: response.data };
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create session', 'error');
      return { success: false };
    }
  }, [showToast]);

  const updateSession = useCallback(async (id, sessionData) => {
    try {
      const response = await api.put(`/sessions/${id}`, sessionData);
      setSessions(prev => prev.map(s => s._id === id ? response.data : s));
      return { success: true, session: response.data };
    } catch (err) {
      showToast('Failed to update session', 'error');
      return { success: false };
    }
  }, [showToast]);

  const deleteSession = useCallback(async (id) => {
    try {
      await api.delete(`/sessions/${id}`);
      setSessions(prev => prev.filter(s => s._id !== id));
      showToast('Session deleted', 'success');
      return { success: true };
    } catch (err) {
      showToast('Failed to delete session', 'error');
      return { success: false };
    }
  }, [showToast]);

  const addGamesToSession = useCallback(async (sessionId, gameIds) => {
    try {
      for (const gameId of gameIds) {
        await api.put(`/sessions/${sessionId}/games`, { action: 'add', gameId });
      }
      await fetchSessions();
      showToast(`Added ${gameIds.length} games to session`, 'success');
      return { success: true };
    } catch (err) {
      showToast('Failed to add games to session', 'error');
      return { success: false };
    }
  }, [fetchSessions, showToast]);

  // Stats API call
  const fetchStats = useCallback(async () => {
    if (!isAuthenticated) return;

    setStatsLoading(true);
    try {
      const response = await api.get('/games/stats');
      setStats(response.data);
    } catch (err) {
      showToast('Failed to fetch stats', 'error');
    } finally {
      setStatsLoading(false);
    }
  }, [isAuthenticated, showToast]);

  // Import/Export
  const exportGames = useCallback(async () => {
    try {
      const response = await api.get('/games/export/all');
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ecogames-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Games exported successfully', 'success');
    } catch (err) {
      showToast('Failed to export games', 'error');
    }
  }, [showToast]);

  const importGames = useCallback(async (games) => {
    try {
      console.log('Importing games:', games.length);
      const response = await api.post('/games/import', { games });
      console.log('Import response:', response.data);
      await fetchGames();
      showToast(response.data.message, 'success');
      return { success: true };
    } catch (err) {
      console.error('Import error:', err.response?.data || err.message);
      showToast(err.response?.data?.message || 'Failed to import games', 'error');
      return { success: false };
    }
  }, [fetchGames, showToast]);

  // Selection helpers
  const toggleGameSelection = useCallback((id) => {
    setSelectedGames(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAllGames = useCallback(() => {
    setSelectedGames(new Set(games.map(g => g._id)));
  }, [games]);

  const clearSelection = useCallback(() => {
    setSelectedGames(new Set());
  }, []);

  const value = {
    // Games
    games,
    gamesLoading,
    gamesPagination,
    fetchGames,
    fetchRecentGames,
    createGame,
    updateGame,
    deleteGame,
    markGameUsed,
    duplicateGame,
    bulkGameAction,

    // Sessions
    sessions,
    sessionsLoading,
    fetchSessions,
    createSession,
    updateSession,
    deleteSession,
    addGamesToSession,

    // Stats
    stats,
    statsLoading,
    fetchStats,

    // Import/Export
    exportGames,
    importGames,

    // Selection
    selectedGames,
    toggleGameSelection,
    selectAllGames,
    clearSelection,

    // Filters
    filters,
    setFilters,

    // UI
    darkMode,
    setDarkMode,
    toasts,
    showToast,
    removeToast
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
