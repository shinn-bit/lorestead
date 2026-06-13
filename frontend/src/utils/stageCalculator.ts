export interface StageThreshold {
  stage: number;
  minutes: number;
}

export const STAGE_THRESHOLDS: StageThreshold[] = [
  { stage: 1, minutes: 0 },
  { stage: 2, minutes: 300 },
  { stage: 3, minutes: 600 },
  { stage: 4, minutes: 900 },
  { stage: 5, minutes: 1200 },
];

export function getCurrentStage(totalMinutes: number): number {
  const stage = STAGE_THRESHOLDS.filter((t) => totalMinutes >= t.minutes).pop();
  return stage?.stage ?? 1;
}

export const MAX_STAGE = 5;

export interface VideoConfig {
  /** ループ再生する動画 */
  loopSrc?: string;
}

export function getVideoConfig(stage: number): VideoConfig {
  if (stage < 1 || stage > MAX_STAGE) return {};
  const base = '/assets/worlds/town';
  const pad = String(stage).padStart(2, '0');
  return { loopSrc: `${base}/stage_${pad}.mp4` };
}

// ── 成長モード ───────────────────────────────────────
export type GrowthMode = 'time' | 'task' | 'free';

export interface TaskItem {
  id: string;
  label: string;
  done: boolean;
}

export interface GrowthConfig {
  mode: GrowthMode;
  /** time モード：目標時間（分）。100%到達で完成 */
  targetMinutes: number;
  /** task モード：達成で stage が進むタスク */
  tasks: TaskItem[];
}

/** free モードの成長間隔（分）。1時間ごとに1段階成長し、4時間で完成 */
export const FREE_STAGE_INTERVAL_MIN = 60;

function clampStage(stage: number): number {
  return Math.min(MAX_STAGE, Math.max(1, stage));
}

/** time モード：目標 T を 0, T/4, T/2, 3T/4, T で区切る（T到達で stage5 完成） */
export function getStageByTime(elapsedMinutes: number, targetMinutes: number): number {
  if (targetMinutes <= 0) return 1;
  const seg = targetMinutes / (MAX_STAGE - 1);
  return clampStage(1 + Math.floor(elapsedMinutes / seg));
}

/** task モード：完了割合を5段階に比例配分（全完了で stage5 完成） */
export function getStageByTasks(doneCount: number, totalCount: number): number {
  if (totalCount <= 0) return 1;
  return clampStage(1 + Math.round((doneCount / totalCount) * (MAX_STAGE - 1)));
}

/** free モード：1時間ごとに1段階（4時間で完成） */
export function getStageByFree(elapsedMinutes: number): number {
  return clampStage(1 + Math.floor(elapsedMinutes / FREE_STAGE_INTERVAL_MIN));
}

/** モードに応じて現在の stage を算出 */
export function getStage(config: GrowthConfig, elapsedMinutes: number): number {
  switch (config.mode) {
    case 'task': {
      const done = config.tasks.filter((t) => t.done).length;
      return getStageByTasks(done, config.tasks.length);
    }
    case 'time':
      return getStageByTime(elapsedMinutes, config.targetMinutes);
    case 'free':
    default:
      return getStageByFree(elapsedMinutes);
  }
}

/** モードに応じた完成までの全体進捗（0〜1） */
export function getOverallProgress(config: GrowthConfig, elapsedMinutes: number): number {
  switch (config.mode) {
    case 'task': {
      if (config.tasks.length === 0) return 0;
      const done = config.tasks.filter((t) => t.done).length;
      return Math.min(1, done / config.tasks.length);
    }
    case 'time':
      if (config.targetMinutes <= 0) return 0;
      return Math.min(1, elapsedMinutes / config.targetMinutes);
    case 'free':
    default:
      return Math.min(1, elapsedMinutes / (FREE_STAGE_INTERVAL_MIN * (MAX_STAGE - 1)));
  }
}

export function getNextStageMinutes(currentStage: number): number | null {
  const next = STAGE_THRESHOLDS.find((t) => t.stage === currentStage + 1);
  return next?.minutes ?? null;
}

export function getProgressToNextStage(totalMinutes: number): number {
  const stage = getCurrentStage(totalMinutes);
  const current = STAGE_THRESHOLDS.find((t) => t.stage === stage);
  const next = STAGE_THRESHOLDS.find((t) => t.stage === stage + 1);
  if (!next) return 1;
  const range = next.minutes - (current?.minutes ?? 0);
  const elapsed = totalMinutes - (current?.minutes ?? 0);
  return Math.min(elapsed / range, 1);
}
