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
