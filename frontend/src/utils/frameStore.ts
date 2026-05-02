const DB_NAME    = 'lorestead';
const DB_VERSION = 1;
const STORE_NAME = 'timelapse_frames';

export type FrameSource = 'world' | 'screen';

interface FrameRecord {
  id?: number;
  sessionId: string;
  frameIndex: number;
  timestamp: number;
  stage: number;
  blob: Blob;
  source: FrameSource;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        store.createIndex('sessionId', 'sessionId', { unique: false });
      }
    };
  });
}

export async function saveFrame(record: Omit<FrameRecord, 'id'>): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).add(record);
    tx.oncomplete = () => resolve();
    tx.onerror   = () => reject(tx.error);
  });
}

export async function getSessionFrames(
  sessionId: string,
  source: FrameSource = 'world',
): Promise<Blob[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, 'readonly');
    const index = tx.objectStore(STORE_NAME).index('sessionId');
    const req   = index.getAll(sessionId);
    req.onsuccess = () => {
      const sorted = (req.result as FrameRecord[])
        .filter(r => (r.source ?? 'world') === source)
        .sort((a, b) => a.frameIndex - b.frameIndex)
        .map(r => r.blob);
      resolve(sorted);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function deleteSessionFrames(sessionId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, 'readwrite');
    const index = tx.objectStore(STORE_NAME).index('sessionId');
    const req   = index.openCursor(IDBKeyRange.only(sessionId));
    req.onsuccess = (e) => {
      const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) { cursor.delete(); cursor.continue(); }
    };
    tx.oncomplete = () => resolve();
    tx.onerror   = () => reject(tx.error);
  });
}
