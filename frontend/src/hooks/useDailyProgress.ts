import { useState, useCallback } from 'react';
import type { GrowthConfig, TaskItem } from '../utils/stageCalculator';
import { getStageByTasks, MAX_STAGE } from '../utils/stageCalculator';
import type { DailyRecord } from '../utils/dailyRecordStore';
import { todayLocalDateStr } from '../utils/dateUtils';

const CURRENT_DAY_KEY = 'lorestead_current_day';

interface CurrentDay {
  startedAt: number;
  date: string;
  tasks: TaskItem[];
}

function loadCurrentDay(): CurrentDay | null {
  try {
    const raw = localStorage.getItem(CURRENT_DAY_KEY);
    return raw ? (JSON.parse(raw) as CurrentDay) : null;
  } catch {
    return null;
  }
}

function saveCurrentDay(day: CurrentDay | null): void {
  try {
    if (day) localStorage.setItem(CURRENT_DAY_KEY, JSON.stringify(day));
    else localStorage.removeItem(CURRENT_DAY_KEY);
  } catch { /* ignore */ }
}

/**
 * 「今日」のタスク進行を保持するフック。
 * タスクの状態は localStorage に永続化し、同日中の再訪時はそのまま復元する。
 * 「今日を終える」（endDay）で初めて確定記録（DailyRecord）が作られ、
 * その後は localStorage の current day がクリアされ次の日を待つ状態に戻る。
 */
export function useDailyProgress() {
  const [current, setCurrentState] = useState<CurrentDay | null>(() => loadCurrentDay());

  const setCurrent = useCallback((day: CurrentDay | null) => {
    saveCurrentDay(day);
    setCurrentState(day);
  }, []);

  /** 新しい日を開始（タスクリストを設定） */
  const startDay = useCallback((labels: string[]) => {
    const tasks: TaskItem[] = labels
      .map((label) => label.trim())
      .filter((label) => label.length > 0)
      .map((label, i) => ({ id: `task_${Date.now()}_${i}`, label, done: false }));
    setCurrent({ startedAt: Date.now(), date: todayLocalDateStr(), tasks });
  }, [setCurrent]);

  /** タスクの完了状態をトグル */
  const toggleTask = useCallback((taskId: string) => {
    setCurrentState((prev) => {
      if (!prev) return prev;
      const next = { ...prev, tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)) };
      saveCurrentDay(next);
      return next;
    });
  }, []);

  /**
   * 確定記録を組み立てて返す（副作用なし）。
   * 実際に今日を終えて次の日を待つ状態に戻すには、続けて discardDay() を呼ぶ。
   * 呼び出し側で「モーダルを開いたまま記録だけ確定 → 閉じるときに discardDay」という
   * 2段階にできるよう、意図的に current をここではクリアしない。
   */
  const buildDailyRecord = useCallback((): DailyRecord | null => {
    if (!current) return null;
    const doneCount = current.tasks.filter((t) => t.done).length;
    const totalCount = current.tasks.length;
    const stage = getStageByTasks(doneCount, totalCount);
    return {
      id: `day_${current.startedAt}`,
      date: current.date,
      startedAt: current.startedAt,
      finalizedAt: Date.now(),
      tasks: current.tasks,
      stage,
      isCompleted: stage >= MAX_STAGE && totalCount > 0,
      studied: doneCount > 0,
    };
  }, [current]);

  /** 今日の状態をクリアし、次の日を始められる状態に戻す */
  const discardDay = useCallback(() => {
    setCurrent(null);
  }, [setCurrent]);

  const config: GrowthConfig | null = current ? { tasks: current.tasks } : null;

  return {
    current,
    config,
    startDay,
    toggleTask,
    buildDailyRecord,
    discardDay,
  };
}
