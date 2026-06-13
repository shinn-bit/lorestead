import { openDB, TIMELAPSES_STORE } from './frameStore';
import type { GrowthMode } from './stageCalculator';

/** 履歴に保存する生成済みタイムラプス動画 1件 */
export interface TimelapseRecord {
  id: string;
  createdAt: number;        // Date.now()
  mode: GrowthMode;
  stage: number;            // 生成時点の到達ステージ
  durationMinutes: number;  // セッションの作業分数
  isCompleted: boolean;     // stage が最大（街が完成）か
  blob: Blob;               // 動画本体（webm / mp4）
}

/** タイムラプス動画を履歴に保存 */
export async function saveTimelapse(record: TimelapseRecord): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TIMELAPSES_STORE, 'readwrite');
    tx.objectStore(TIMELAPSES_STORE).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** 保存済みタイムラプス一覧を新しい順で取得 */
export async function listTimelapses(): Promise<TimelapseRecord[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TIMELAPSES_STORE, 'readonly');
    const req = tx.objectStore(TIMELAPSES_STORE).getAll();
    req.onsuccess = () => {
      const all = (req.result as TimelapseRecord[]).sort((a, b) => b.createdAt - a.createdAt);
      resolve(all);
    };
    req.onerror = () => reject(req.error);
  });
}

/** 指定IDのタイムラプスを削除 */
export async function deleteTimelapse(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TIMELAPSES_STORE, 'readwrite');
    tx.objectStore(TIMELAPSES_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
