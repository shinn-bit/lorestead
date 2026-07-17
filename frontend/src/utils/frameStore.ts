const DB_NAME    = 'lorestead';
const DB_VERSION = 3;
/** 確定済みの日次記録を保存するストア */
export const DAILY_RECORDS_STORE = 'daily_records';

/** lorestead DB を開く */
export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(DAILY_RECORDS_STORE)) {
        const dr = db.createObjectStore(DAILY_RECORDS_STORE, { keyPath: 'id' });
        dr.createIndex('finalizedAt', 'finalizedAt', { unique: false });
      }
    };
  });
}
