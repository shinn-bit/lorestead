import { daysBetween, todayLocalDateStr } from './dateUtils';

const GOAL_KEY = 'lorestead_goal';

export interface Goal {
  date: string;   // 'YYYY-MM-DD'
  label: string;  // 何の日か（任意、例: "TOEIC" "試験日"）
}

/** 目標（日付＋任意ラベル）。未設定なら null */
export function getGoal(): Goal | null {
  try {
    const raw = localStorage.getItem(GOAL_KEY);
    return raw ? (JSON.parse(raw) as Goal) : null;
  } catch {
    return null;
  }
}

export function setGoal(date: string, label: string): void {
  try { localStorage.setItem(GOAL_KEY, JSON.stringify({ date, label: label.trim() })); } catch { /* ignore */ }
}

export function clearGoal(): void {
  try { localStorage.removeItem(GOAL_KEY); } catch { /* ignore */ }
}

/** 今日から目標日までの残り日数（今日を含まない）。過去日なら負の値になり得る */
export function daysUntil(dateStr: string): number {
  return daysBetween(todayLocalDateStr(), dateStr);
}
