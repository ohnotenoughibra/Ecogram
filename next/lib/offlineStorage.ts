// IndexedDB wrapper for offline-first storage

const DB_NAME = 'ecogram-offline'
const DB_VERSION = 1

interface SyncQueueItem {
  id: string
  action: 'create' | 'update' | 'delete'
  table: string
  data: any
  timestamp: number
}

let db: IDBDatabase | null = null

export async function initDB(): Promise<IDBDatabase> {
  if (db) return db

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      db = request.result
      resolve(db)
    }

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result

      // Games store
      if (!database.objectStoreNames.contains('games')) {
        const gamesStore = database.createObjectStore('games', { keyPath: 'id' })
        gamesStore.createIndex('position', 'position', { unique: false })
        gamesStore.createIndex('category', 'category', { unique: false })
        gamesStore.createIndex('updated_at', 'updated_at', { unique: false })
      }

      // Class preps store
      if (!database.objectStoreNames.contains('class_preps')) {
        const prepsStore = database.createObjectStore('class_preps', { keyPath: 'id' })
        prepsStore.createIndex('date', 'date', { unique: false })
      }

      // Templates store
      if (!database.objectStoreNames.contains('templates')) {
        database.createObjectStore('templates', { keyPath: 'id' })
      }

      // Sync queue for offline actions
      if (!database.objectStoreNames.contains('sync_queue')) {
        const syncStore = database.createObjectStore('sync_queue', { keyPath: 'id' })
        syncStore.createIndex('timestamp', 'timestamp', { unique: false })
      }
    }
  })
}

// Generic CRUD operations
export async function getAll<T>(storeName: string): Promise<T[]> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readonly')
    const store = transaction.objectStore(storeName)
    const request = store.getAll()

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

export async function getById<T>(storeName: string, id: string): Promise<T | undefined> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readonly')
    const store = transaction.objectStore(storeName)
    const request = store.get(id)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

export async function put<T extends { id: string }>(storeName: string, data: T): Promise<T> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)
    const request = store.put(data)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(data)
  })
}

export async function remove(storeName: string, id: string): Promise<void> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)
    const request = store.delete(id)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

export async function clear(storeName: string): Promise<void> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)
    const request = store.clear()

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

// Sync queue operations
export async function addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp'>): Promise<void> {
  const queueItem: SyncQueueItem = {
    ...item,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  }
  await put('sync_queue', queueItem)
}

export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  return getAll<SyncQueueItem>('sync_queue')
}

export async function clearSyncQueue(): Promise<void> {
  return clear('sync_queue')
}

export async function removeSyncQueueItem(id: string): Promise<void> {
  return remove('sync_queue', id)
}

// Bulk operations for initial sync
export async function bulkPut<T extends { id: string }>(storeName: string, items: T[]): Promise<void> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)

    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)

    items.forEach((item) => store.put(item))
  })
}

// Check if online
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true
}

// Register for online/offline events
export function onConnectivityChange(callback: (online: boolean) => void): () => void {
  if (typeof window === 'undefined') return () => {}

  const handleOnline = () => callback(true)
  const handleOffline = () => callback(false)

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}
