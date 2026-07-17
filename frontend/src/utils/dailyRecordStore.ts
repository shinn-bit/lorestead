import { openDB, DAILY_RECORDS_STORE } from './frameStore';
import type { TaskItem } from './stageCalculator';

/** 確定済みの日次記録 1件（「今日を終える」時に1件だけ書き込まれる） */
export interface DailyRecord {
  id: string;
  date: string;          // 'YYYY-MM-DD'（startedAt のローカル日付）
  startedAt: number;
  finalizedAt: number;
  tasks: TaskItem[];
  stage: number;          // 確定時点の到達ステージ
  isCompleted: boolean;   // 全タスク達成
  studied: boolean;       // 1つ以上達成した日か
}

export async function saveDailyRecord(record: DailyRecord): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DAILY_RECORDS_STORE, 'readwrite');
    tx.objectStore(DAILY_RECORDS_STORE).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** 確定済みの日次記録を新しい順で取得 */
export async function listDailyRecords(): Promise<DailyRecord[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DAILY_RECORDS_STORE, 'readonly');
    const req = tx.objectStore(DAILY_RECORDS_STORE).getAll();
    req.onsuccess = () => {
      const all = (req.result as DailyRecord[]).sort((a, b) => b.finalizedAt - a.finalizedAt);
      resolve(all);
    };
    req.onerror = () => reject(req.error);
  });
}

/** 1つ以上タスクを達成した日の件数（目標日カウントダウンの「勉強した日数」） */
export async function countStudiedDays(): Promise<number> {
  const records = await listDailyRecords();
  return records.filter((r) => r.studied).length;
}

export async function deleteDailyRecord(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DAILY_RECORDS_STORE, 'readwrite');
    tx.objectStore(DAILY_RECORDS_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** 全件削除（デバッグ用） */
export async function clearDailyRecords(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DAILY_RECORDS_STORE, 'readwrite');
    tx.objectStore(DAILY_RECORDS_STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
