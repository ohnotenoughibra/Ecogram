/**
 * Offline Storage Service
 * Uses IndexedDB for games/sessions with sync queue for offline changes
 */

const DB_NAME = 'ecogram_offline';
const DB_VERSION = 1;

let db = null;

// Initialize IndexedDB
export async function initOfflineDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;

      // Games store
      if (!database.objectStoreNames.contains('games')) {
        const gamesStore = database.createObjectStore('games', { keyPath: '_id' });
        gamesStore.createIndex('name', 'name', { unique: false });
        gamesStore.createIndex('topic', 'topic', { unique: false });
        gamesStore.createIndex('position', 'position', { unique: false });
        gamesStore.createIndex('favorite', 'favorite', { unique: false });
      }

      // Sessions store
      if (!database.objectStoreNames.contains('sessions')) {
        const sessionsStore = database.createObjectStore('sessions', { keyPath: '_id' });
        sessionsStore.createIndex('name', 'name', { unique: false });
        sessionsStore.createIndex('favorite', 'favorite', { unique: false });
      }

      // Sync queue for offline changes
      if (!database.objectStoreNames.contains('syncQueue')) {
        const syncStore = database.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
        syncStore.createIndex('type', 'type', { unique: false });
        syncStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Metadata store (last sync time, etc.)
      if (!database.objectStoreNames.contains('metadata')) {
        database.createObjectStore('metadata', { keyPath: 'key' });
      }
    };
  });
}

// Ensure DB is initialized
async function ensureDB() {
  if (!db) {
    await initOfflineDB();
  }
  return db;
}

// ==================== GAMES ====================

export async function saveGamesToOffline(games) {
  const database = await ensureDB();
  const tx = database.transaction('games', 'readwrite');
  const store = tx.objectStore('games');

  for (const game of games) {
    store.put(game);
  }

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getOfflineGames(filters = {}) {
  const database = await ensureDB();
  const tx = database.transaction('games', 'readonly');
  const store = tx.objectStore('games');

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => {
      let games = request.result || [];

      // Apply filters
      if (filters.topic) {
        games = games.filter(g => g.topic === filters.topic);
      }
      if (filters.position) {
        games = games.filter(g => g.position === filters.position);
      }
      if (filters.favorite) {
        games = games.filter(g => g.favorite);
      }
      if (filters.search) {
        const search = filters.search.toLowerCase();
        games = games.filter(g =>
          g.name?.toLowerCase().includes(search) ||
          g.topPlayer?.toLowerCase().includes(search) ||
          g.bottomPlayer?.toLowerCase().includes(search) ||
          g.coaching?.toLowerCase().includes(search)
        );
      }

      // Sort by name by default
      games.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

      resolve(games);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getOfflineGame(id) {
  const database = await ensureDB();
  const tx = database.transaction('games', 'readonly');
  const store = tx.objectStore('games');

  return new Promise((resolve, reject) => {
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteOfflineGame(id) {
  const database = await ensureDB();
  const tx = database.transaction('games', 'readwrite');
  const store = tx.objectStore('games');

  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function clearOfflineGames() {
  const database = await ensureDB();
  const tx = database.transaction('games', 'readwrite');
  const store = tx.objectStore('games');

  return new Promise((resolve, reject) => {
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// ==================== SESSIONS ====================

export async function saveSessionsToOffline(sessions) {
  const database = await ensureDB();
  const tx = database.transaction('sessions', 'readwrite');
  const store = tx.objectStore('sessions');

  for (const session of sessions) {
    store.put(session);
  }

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getOfflineSessions() {
  const database = await ensureDB();
  const tx = database.transaction('sessions', 'readonly');
  const store = tx.objectStore('sessions');

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function getOfflineSession(id) {
  const database = await ensureDB();
  const tx = database.transaction('sessions', 'readonly');
  const store = tx.objectStore('sessions');

  return new Promise((resolve, reject) => {
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ==================== SYNC QUEUE ====================

export async function addToSyncQueue(action) {
  const database = await ensureDB();
  const tx = database.transaction('syncQueue', 'readwrite');
  const store = tx.objectStore('syncQueue');

  const queueItem = {
    ...action,
    timestamp: Date.now(),
    retries: 0
  };

  return new Promise((resolve, reject) => {
    const request = store.add(queueItem);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getSyncQueue() {
  const database = await ensureDB();
  const tx = database.transaction('syncQueue', 'readonly');
  const store = tx.objectStore('syncQueue');

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => {
      const items = request.result || [];
      items.sort((a, b) => a.timestamp - b.timestamp);
      resolve(items);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function removeSyncQueueItem(id) {
  const database = await ensureDB();
  const tx = database.transaction('syncQueue', 'readwrite');
  const store = tx.objectStore('syncQueue');

  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function clearSyncQueue() {
  const database = await ensureDB();
  const tx = database.transaction('syncQueue', 'readwrite');
  const store = tx.objectStore('syncQueue');

  return new Promise((resolve, reject) => {
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// ==================== METADATA ====================

export async function setMetadata(key, value) {
  const database = await ensureDB();
  const tx = database.transaction('metadata', 'readwrite');
  const store = tx.objectStore('metadata');

  return new Promise((resolve, reject) => {
    const request = store.put({ key, value, updatedAt: Date.now() });
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getMetadata(key) {
  const database = await ensureDB();
  const tx = database.transaction('metadata', 'readonly');
  const store = tx.objectStore('metadata');

  return new Promise((resolve, reject) => {
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result?.value);
    request.onerror = () => reject(request.error);
  });
}

// ==================== SYNC MANAGER ====================

export async function syncWithServer(api, showToast) {
  const queue = await getSyncQueue();
  if (queue.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      switch (item.type) {
        case 'CREATE_GAME':
          await api.post('/games', item.data);
          break;
        case 'UPDATE_GAME':
          await api.put(`/games/${item.gameId}`, item.data);
          break;
        case 'DELETE_GAME':
          await api.delete(`/games/${item.gameId}`);
          break;
        case 'TOGGLE_FAVORITE':
          await api.post(`/games/${item.gameId}/favorite`);
          break;
        case 'MARK_USED':
          await api.post(`/games/${item.gameId}/use`);
          break;
        default:
          console.warn('Unknown sync action:', item.type);
      }

      await removeSyncQueueItem(item.id);
      synced++;
    } catch (error) {
      console.error('Sync failed for item:', item, error);
      failed++;
    }
  }

  if (synced > 0 && showToast) {
    showToast(`Synced ${synced} offline change${synced > 1 ? 's' : ''}`, 'success');
  }

  return { synced, failed };
}

// Check if we're online
export function isOnline() {
  return navigator.onLine;
}

// Get offline status and pending changes count
export async function getOfflineStatus() {
  const queue = await getSyncQueue();
  return {
    isOnline: navigator.onLine,
    pendingChanges: queue.length,
    lastSync: await getMetadata('lastSync')
  };
}
