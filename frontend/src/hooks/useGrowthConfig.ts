import { useState, useCallback } from 'react';
import type { GrowthConfig, GrowthMode, TaskItem } from '../utils/stageCalculator';

/**
 * 成長モードの設定を保持するフック。
 * 進捗の継承はしない方針なので localStorage には保存せず、メモリ上のみで管理する。
 * （アプリを開くたびに null から始まり、毎回 Setup 画面を経由する）
 */
export function useGrowthConfig() {
  const [config, setConfigState] = useState<GrowthConfig | null>(null);

  /** time モードを開始 */
  const setTimeMode = useCallback((targetMinutes: number) => {
    setConfigState({ mode: 'time', targetMinutes, tasks: [] });
  }, []);

  /** task モードを開始 */
  const setTaskMode = useCallback((labels: string[]) => {
    const tasks: TaskItem[] = labels
      .map((label) => label.trim())
      .filter((label) => label.length > 0)
      .map((label, i) => ({ id: `task_${Date.now()}_${i}`, label, done: false }));
    setConfigState({ mode: 'task', targetMinutes: 0, tasks });
  }, []);

  /** free（無設定）モードを開始：1時間ごとに成長 */
  const setFreeMode = useCallback(() => {
    setConfigState({ mode: 'free', targetMinutes: 0, tasks: [] });
  }, []);

  /** 任意モードを直接セット（Debug 用） */
  const setMode = useCallback((mode: GrowthMode, partial?: Partial<GrowthConfig>) => {
    setConfigState({ mode, targetMinutes: 0, tasks: [], ...partial });
  }, []);

  /** task モード：タスクの完了状態をトグル */
  const toggleTask = useCallback((taskId: string) => {
    setConfigState((prev) => {
      if (!prev || prev.mode !== 'task') return prev;
      return {
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)),
      };
    });
  }, []);

  /** 設定をクリア（Restart で Setup 画面に戻す） */
  const clearConfig = useCallback(() => {
    setConfigState(null);
  }, []);

  return {
    config,
    setTimeMode,
    setTaskMode,
    setFreeMode,
    setMode,
    toggleTask,
    clearConfig,
  };
}
