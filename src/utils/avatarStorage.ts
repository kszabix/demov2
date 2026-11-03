/**
 * IndexedDB storage utility for persisting custom 3D character models (.glb / .gltf)
 * across browser sessions without being blocked by localStorage 5MB limits.
 */

const DB_NAME = 'CastawayAvatarDB';
const DB_VERSION = 1;
const STORE_NAME = 'custom_avatars';
const KEY = 'active_player_model';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (e: any) => {
      const db = e.target.result as IDBDatabase;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

export interface SavedModelRecord {
  name: string;
  buffer: ArrayBuffer;
  updatedAt: number;
}

export async function saveCustomModel(file: File): Promise<SavedModelRecord> {
  const buffer = await file.arrayBuffer();
  const record: SavedModelRecord = {
    name: file.name,
    buffer,
    updatedAt: Date.now(),
  };

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(record, KEY);
    req.onsuccess = () => resolve(record);
    req.onerror = () => reject(req.error);
  });
}

export async function getSavedCustomModel(): Promise<SavedModelRecord | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to load custom model from IndexedDB:', err);
    return null;
  }
}

export async function clearSavedCustomModel(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to clear custom model from IndexedDB:', err);
  }
}
