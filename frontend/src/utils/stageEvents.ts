/**
 * 各ステージの世界動画は「normal」（高頻出・単発再生）に加え、
 * 単発イベント（book/coffee/dog/hands等）や、-1 → -2（ランダムに3〜5回ループ）→ -3
 * という3部構成のイベント（cat/talk/owl等）で構成される。
 * ここでは、ステージごとの動画一覧を定義し、重み付き抽選で次に流す1本（または3部構成の一連）を選ぶ。
 */
import { ASSET_BASE } from './assetBase';

export interface SingleClip {
  kind: 'single';
  src: string;
}

export interface SetClip {
  kind: 'set';
  intro: string;
  /** ループ区間。複数指定した場合は繰り返しごとにランダムに1本を選ぶ（例: talk-2-1 / talk-2-2） */
  loop: string[];
  outro: string;
}

export type EventClip = SingleClip | SetClip;

export interface StageEvent {
  id: string;
  weight: number;
  clip: EventClip;
  /**
   * true なら無音で再生する（現在は全イベント音あり）。
   * 実際に音を出すかは、これに加えてマイクボタンのオン/オフでも決まる。
   */
  muted: boolean;
}

const BASE = `${ASSET_BASE}/assets/worlds/town`;

function stageDir(stage: number): string {
  return `${BASE}/stage_${String(stage).padStart(2, '0')}`;
}

function single(src: string): SingleClip {
  return { kind: 'single', src };
}

function set(intro: string, loop: string | string[], outro: string): SetClip {
  return { kind: 'set', intro, loop: Array.isArray(loop) ? loop : [loop], outro };
}

/** 日常の一コマ（coffee/book/hands）は高頻度枠、特別な来客（dog/cat/talk/owl）は低頻度枠（15:1でごく稀に出現） */
const HIGH_TIER_WEIGHT = 15;
const LOW_TIER_WEIGHT = 1;

/**
 * normal の出現率を指定した比率（既定70%、stage_05のみ82%）に固定しつつ、
 * 他イベントは重み比のまま normal 以外の枠を分け合う。
 * 全イベント音あり（マイクボタンがオンの場合のみ実際に音が出る）。
 */
function buildEvents(
  normal: EventClip,
  others: { id: string; clip: EventClip; weight: number; muted?: boolean }[],
  normalRatio = 0.7,
): StageEvent[] {
  const othersWeightSum = others.reduce((s, o) => s + o.weight, 0);
  const normalWeight = othersWeightSum > 0
    ? (normalRatio / (1 - normalRatio)) * othersWeightSum
    : 1;
  return [
    { id: 'normal', weight: normalWeight, clip: normal, muted: false },
    ...others.map((o) => ({ id: o.id, weight: o.weight, clip: o.clip, muted: o.muted ?? false })),
  ];
}

export function getStageEvents(stage: number): StageEvent[] {
  const d = stageDir(stage);
  const p = (name: string) => `${d}/${name}`;

  switch (stage) {
    case 1:
      return buildEvents(single(p('stage_01_normal.mp4')), [
        { id: 'book', weight: HIGH_TIER_WEIGHT, clip: single(p('stage_01_book.mp4')), muted: false },
        { id: 'coffee', weight: HIGH_TIER_WEIGHT, clip: single(p('stage_01_coffee.mp4')), muted: false },
        { id: 'hands', weight: HIGH_TIER_WEIGHT, clip: single(p('stage_01_hands.mp4')), muted: false },
      ]);
    case 2:
      return buildEvents(single(p('stage_02_normal.mp4')), [
        { id: 'book', weight: HIGH_TIER_WEIGHT, clip: single(p('stage_02_book.mp4')), muted: false },
        { id: 'coffee', weight: HIGH_TIER_WEIGHT, clip: single(p('stage_02_coffee.mp4')), muted: false },
        { id: 'dog', weight: LOW_TIER_WEIGHT, clip: single(p('stage_02_dog.mp4')) },
      ]);
    case 3:
      return buildEvents(single(p('stage_03_normal.mp4')), [
        { id: 'book', weight: HIGH_TIER_WEIGHT, clip: single(p('stage_03_book.mp4')), muted: false },
        { id: 'coffee', weight: HIGH_TIER_WEIGHT, clip: single(p('stage_03_coffee.mp4')), muted: false },
        { id: 'cat', weight: LOW_TIER_WEIGHT, clip: set(p('stage_03_cat-1.mp4'), p('stage_03_cat-2.mp4'), p('stage_03_cat-3.mp4')) },
      ]);
    case 4:
      return buildEvents(single(p('stage_04_normal.mp4')), [
        { id: 'coffee', weight: HIGH_TIER_WEIGHT, clip: single(p('stage_04_coffee.mp4')), muted: false },
        { id: 'hands', weight: HIGH_TIER_WEIGHT, clip: single(p('stage_04_hands.mp4')), muted: false },
        {
          id: 'talk',
          weight: LOW_TIER_WEIGHT,
          clip: set(
            p('stage_04_talk-1.mp4'),
            [p('stage_04_talk-2-1.mp4'), p('stage_04_talk-2-2.mp4')],
            p('stage_04_talk-3.mp4'),
          ),
        },
      ]);
    case 5:
      return buildEvents(single(p('stage_05_normal.mp4')), [
        { id: 'coffee', weight: HIGH_TIER_WEIGHT, clip: single(p('stage_05_coffee.mp4')), muted: false },
        { id: 'owl', weight: LOW_TIER_WEIGHT, clip: set(p('stage_05_owl-1.mp4'), p('stage_05_owl-2.mp4'), p('stage_05_owl-3.mp4')) },
      ], 0.82);
    default:
      return [];
  }
}

function pickWeighted(events: StageEvent[]): StageEvent {
  const total = events.reduce((s, e) => s + e.weight, 0);
  let r = Math.random() * total;
  for (const e of events) {
    if (r < e.weight) return e;
    r -= e.weight;
  }
  return events[events.length - 1];
}

/** ループ区間の繰り返し回数（3〜5回、ランダム） */
function randomLoopRepeats(): number {
  return 3 + Math.floor(Math.random() * 3);
}

export interface EventPick {
  id: string;
  queue: string[];
  muted: boolean;
}

/**
 * ステージからイベントを1つ抽選し、実際に再生するクリップURLの並びに展開する。
 * excludeId を渡すと、その id（normalを除く）は今回の抽選から除外する
 * （＝同じ非normalイベントが連続で流れるのを防ぐ）。
 */
export function pickEventQueue(stage: number, excludeId?: string): EventPick {
  const events = getStageEvents(stage);
  if (events.length === 0) return { id: '', queue: [], muted: true };

  const pool = excludeId && excludeId !== 'normal'
    ? events.filter((e) => e.id !== excludeId)
    : events;

  const ev = pickWeighted(pool.length > 0 ? pool : events);
  const queue = ev.clip.kind === 'single'
    ? [ev.clip.src]
    : (() => {
        const { intro, loop, outro } = ev.clip as SetClip;
        const repeats = randomLoopRepeats();
        const loopPart = Array.from({ length: repeats }, () => loop[Math.floor(Math.random() * loop.length)]);
        return [intro, ...loopPart, outro];
      })();

  return { id: ev.id, queue, muted: ev.muted };
}
