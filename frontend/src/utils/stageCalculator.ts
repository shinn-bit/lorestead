import { ASSET_BASE } from './assetBase';
import { DEFAULT_WORLD_ID, type WorldId } from './worlds';

export const MAX_STAGE = 5;

export interface VideoConfig {
  /** ループ再生する動画 */
  loopSrc?: string;
}

/**
 * サブ画面・ミニプレイヤーなど、複数イベント動画を抽選せず常時ループでよい場面向けの
 * シンプルな1本（そのステージの「normal」クリップ）。イベント抽選・3部構成の再生は
 * メインのWorldPlayerが utils/stageEvents.ts を使って行う。
 */
export function getVideoConfig(worldId: WorldId, stage: number): VideoConfig {
  if (stage < 1 || stage > MAX_STAGE) return {};
  const pad = String(stage).padStart(2, '0');
  return { loopSrc: `${ASSET_BASE}/assets/worlds/${worldId}/stage_${pad}/stage_${pad}_normal.mp4` };
}

/**
 * 各ステージの静止画（カレンダーのサムネイルなど、動画を再生せず1枚で見せたい場面用）。
 * /public/assets/worlds/<world>/stills/stage_01.png 〜 stage_05.png に配置する。
 * まだ用意されていない場合は呼び出し側で onError フォールバックすること。
 * worldId が未指定（過去のレコードにworldIdがない場合）は既定の世界にフォールバックする。
 */
export function getStillSrc(worldId: WorldId | undefined, stage: number): string | undefined {
  if (stage < 1 || stage > MAX_STAGE) return undefined;
  const pad = String(stage).padStart(2, '0');
  return `${ASSET_BASE}/assets/worlds/${worldId ?? DEFAULT_WORLD_ID}/stills/stage_${pad}.png`;
}

// ── タスク型成長 ───────────────────────────────────────

export interface TaskItem {
  id: string;
  label: string;
  done: boolean;
}

export interface GrowthConfig {
  /** 今日達成するタスク */
  tasks: TaskItem[];
}

function clampStage(stage: number): number {
  return Math.min(MAX_STAGE, Math.max(1, stage));
}

/**
 * 完了割合を5段階に比例配分。
 * 分母は「タスク数 - 1」：最後のタスクに取り組んでいる間に完成した街（stage5）が
 * 見えるようにするため（全タスク完了と同時にstage5だと、完成を眺める時間がない）。
 * タスク1つの日は従来どおり 1 → 5。
 */
export function getStageByTasks(doneCount: number, totalCount: number): number {
  if (totalCount <= 0) return 1;
  const span = Math.max(totalCount - 1, 1);
  return clampStage(1 + Math.round((doneCount / span) * (MAX_STAGE - 1)));
}

/** タスクの完了状況から現在の stage を算出 */
export function getStage(config: GrowthConfig): number {
  const done = config.tasks.filter((t) => t.done).length;
  return getStageByTasks(done, config.tasks.length);
}

/** 完成までの全体進捗（0〜1） */
export function getOverallProgress(config: GrowthConfig): number {
  if (config.tasks.length === 0) return 0;
  const done = config.tasks.filter((t) => t.done).length;
  return Math.min(1, done / config.tasks.length);
}
