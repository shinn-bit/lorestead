/**
 * デバッグ「イベントプレビュー」用のブリッジ。
 * /debug で Play を押すと、本番と同じホーム画面（MainPage）を Test セッションで開き、
 * 指定イベント（または Random）を WorldPlayer に固定再生させる。
 * 実データ（進行中の今日・目標）は退避し、「解除」で復元できる。
 */
import { todayLocalDateStr } from './dateUtils';
import { setGoal } from './goalStore';
import { DEFAULT_WORLD_ID, type WorldId } from './worlds';

const EVENT_KEY  = 'lorestead_debug_event';   // sessionStorage: プレビュー中フラグ（タブを閉じれば自然に解除）
const BACKUP_KEY = 'lorestead_debug_backup';  // localStorage: 退避した実データ（タブを閉じても復元可能なよう永続）
const CURRENT_DAY_KEY = 'lorestead_current_day';
const GOAL_KEY        = 'lorestead_goal';
const TOUR_SEEN_KEY   = 'lorestead_home_tour_seen';

export interface DebugPreview {
  /** 'random' またはイベントid（normal/book/coffee/... ） */
  eventId: string;
}

/** プレビュー中なら {eventId} を返す（MainPage が読む） */
export function readDebugPreview(): DebugPreview | null {
  try {
    const raw = sessionStorage.getItem(EVENT_KEY);
    return raw ? (JSON.parse(raw) as DebugPreview) : null;
  } catch {
    return null;
  }
}

/**
 * Test セッション（goal=Test / タスク Task1〜Task5）を仕込み、指定ワールド・ステージ・
 * イベントでホームを開く。実データは一度だけ退避する。呼び出し側で location 遷移すること。
 */
export function startDebugPreview(doneCount: number, eventId: string, worldId: WorldId = DEFAULT_WORLD_ID): void {
  try {
    // 実データを退避（多重呼び出しでは最初の退避を保持）
    if (!localStorage.getItem(BACKUP_KEY)) {
      localStorage.setItem(BACKUP_KEY, JSON.stringify({
        currentDay: localStorage.getItem(CURRENT_DAY_KEY),
        goal:       localStorage.getItem(GOAL_KEY),
        tourSeen:   localStorage.getItem(TOUR_SEEN_KEY),
      }));
    }

    const tasks = Array.from({ length: 5 }, (_, i) => ({
      id: `task_debug_${i}`,
      label: `Task${i + 1}`,
      done: i < doneCount,
    }));
    localStorage.setItem(CURRENT_DAY_KEY, JSON.stringify({
      startedAt: Date.now(), date: todayLocalDateStr(), tasks, worldId,
    }));

    const goalDate = new Date();
    goalDate.setDate(goalDate.getDate() + 30);
    setGoal(goalDate.toISOString().slice(0, 10), 'Test');

    localStorage.setItem(TOUR_SEEN_KEY, '1');   // ツアー（初回案内）を抑止
    sessionStorage.setItem(EVENT_KEY, JSON.stringify({ eventId } satisfies DebugPreview));
  } catch { /* ignore */ }
}

/** プレビューを解除し、退避しておいた実データを復元する */
export function endDebugPreview(): void {
  try {
    const raw = localStorage.getItem(BACKUP_KEY);
    if (raw) {
      const b = JSON.parse(raw) as { currentDay: string | null; goal: string | null; tourSeen: string | null };
      restore(CURRENT_DAY_KEY, b.currentDay);
      restore(GOAL_KEY, b.goal);
      restore(TOUR_SEEN_KEY, b.tourSeen);
    }
    localStorage.removeItem(BACKUP_KEY);
    sessionStorage.removeItem(EVENT_KEY);
  } catch { /* ignore */ }
}

function restore(key: string, value: string | null): void {
  if (value === null) localStorage.removeItem(key);
  else localStorage.setItem(key, value);
}
