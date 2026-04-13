export interface StageThreshold {
  stage: number;
  minutes: number;
}

export const STAGE_THRESHOLDS: StageThreshold[] = [
  { stage: 1, minutes: 0 },
  { stage: 2, minutes: 120 },
  { stage: 3, minutes: 240 },
  { stage: 4, minutes: 360 },
  { stage: 5, minutes: 540 },
  { stage: 6, minutes: 720 },
  { stage: 7, minutes: 900 },
  { stage: 8, minutes: 1080 },
  { stage: 9, minutes: 1200 },
];

export function getCurrentStage(totalMinutes: number): number {
  const stage = STAGE_THRESHOLDS.filter((t) => totalMinutes >= t.minutes).pop();
  return stage?.stage ?? 1;
}

export interface VideoConfig {
  /** 最初に1回だけ流す動画（stage 1 のみ） */
  startSrc?: string;
  /** ループ再生する動画 */
  loopSrc: string;
}

export function getVideoConfig(stage: number): VideoConfig {
  const base = '/assets/worlds/prague';
  if (stage === 1) {
    return {
      startSrc: `${base}/stage_01_start.mp4`,
      loopSrc: `${base}/stage_01_loop.mp4`,
    };
  }
  const pad = String(stage).padStart(2, '0');
  return { loopSrc: `${base}/stage_0${pad}.mp4` };
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
