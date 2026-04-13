const STAGE_THRESHOLDS = [
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
