/**
 * 各ステージの世界動画は「normal」（高頻出・単発再生）に加え、
 * 単発イベント（book/coffee/dog/hands等）や、-1 → -2（ランダムに3〜5回ループ）→ -3
 * という3部構成のイベント（cat/talk/owl等）で構成される。
 * ここでは、ステージごとの動画一覧を定義し、重み付き抽選で次に流す1本（または3部構成の一連）を選ぶ。
 */
import { ASSET_BASE } from './assetBase';
import type { WorldId } from './worlds';

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

const BASE = `${ASSET_BASE}/assets/worlds`;

function stageDir(worldId: WorldId, stage: number): string {
  return `${BASE}/${worldId}/stage_${String(stage).padStart(2, '0')}`;
}

function single(src: string): SingleClip {
  return { kind: 'single', src };
}

function set(intro: string, loop: string | string[], outro: string): SetClip {
  return { kind: 'set', intro, loop: Array.isArray(loop) ? loop : [loop], outro };
}

/**
 * ありふれた一コマ（town: coffee/book/hands、ocean: map/water/horizon、
 * forest: water/knife/meat/mallet/notebook/vape）は高頻度枠、
 * 特別な来訪（town: dog/cat/talk/owl、ocean: seagull/hermet/turtle/crab/dolphine、
 * forest: bird/squirrel/figure/fox/butterflies）は低頻度枠（15:1でごく稀に出現）。
 */
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

type PathFn = (name: string) => string;

/**
 * イベント動画が用意されている世界（town / ocean / forest）は、そのステージのイベント一覧を返す。
 * 用意されていない世界は normal ループのみを常時再生する。
 */
export function getStageEvents(worldId: WorldId, stage: number): StageEvent[] {
  const d = stageDir(worldId, stage);
  const p: PathFn = (name) => `${d}/${name}`;

  switch (worldId) {
    case 'town':
      return townStageEvents(stage, p);
    case 'ocean':
      return oceanStageEvents(stage, p);
    case 'forest':
      return forestStageEvents(stage, p);
    default: {
      const pad = String(stage).padStart(2, '0');
      return buildEvents(single(p(`stage_${pad}_normal.mp4`)), []);
    }
  }
}

/** 中世の街：日常の一コマ（book/coffee/hands）＋ 特別な来客（dog/cat/talk/owl） */
function townStageEvents(stage: number, p: PathFn): StageEvent[] {
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

/**
 * 南国のビーチ・難破船：風景の変化（map/water/horizon）が高頻度枠、
 * 生きものの来訪（seagull/hermet/turtle/crab/dolphine）が低頻度枠。
 * town の stage_05 と違い normalRatio は既定（0.7）のまま＝ dolphine の出現率を owl 並みに保つ。
 */
function oceanStageEvents(stage: number, p: PathFn): StageEvent[] {
  switch (stage) {
    case 1:
      return buildEvents(single(p('stage_01_normal.mp4')), [
        { id: 'map', weight: HIGH_TIER_WEIGHT, clip: single(p('stage_01_map.mp4')) },
        { id: 'water', weight: HIGH_TIER_WEIGHT, clip: single(p('stage_01_water.mp4')) },
        { id: 'seagull', weight: LOW_TIER_WEIGHT, clip: set(p('stage_01_seagull-1.mp4'), p('stage_01_seagull-2.mp4'), p('stage_01_seagull-3.mp4')) },
      ]);
    case 2:
      return buildEvents(single(p('stage_02_normal.mp4')), [
        { id: 'map', weight: HIGH_TIER_WEIGHT, clip: single(p('stage_02_map.mp4')) },
        { id: 'water', weight: HIGH_TIER_WEIGHT, clip: single(p('stage_02_water.mp4')) },
        { id: 'hermet', weight: LOW_TIER_WEIGHT, clip: set(p('stage_02_hermet-1.mp4'), p('stage_02_hermet-2.mp4'), p('stage_02_hermet-3.mp4')) },
      ]);
    case 3:
      return buildEvents(single(p('stage_03_normal.mp4')), [
        { id: 'map', weight: HIGH_TIER_WEIGHT, clip: single(p('stage_03_map.mp4')) },
        { id: 'water', weight: HIGH_TIER_WEIGHT, clip: single(p('stage_03_water.mp4')) },
        { id: 'turtle', weight: LOW_TIER_WEIGHT, clip: set(p('stage_03_turtle-1.mp4'), p('stage_03_turtle-2.mp4'), p('stage_03_turtle-3.mp4')) },
      ]);
    case 4:
      return buildEvents(single(p('stage_04_normal.mp4')), [
        { id: 'horizon', weight: HIGH_TIER_WEIGHT, clip: single(p('stage_04_horizon.mp4')) },
        { id: 'water', weight: HIGH_TIER_WEIGHT, clip: single(p('stage_04_water.mp4')) },
        { id: 'crab', weight: LOW_TIER_WEIGHT, clip: set(p('stage_04_crab-1.mp4'), p('stage_04_crab-2.mp4'), p('stage_04_crab-3.mp4')) },
      ]);
    case 5:
      return buildEvents(single(p('stage_05_normal.mp4')), [
        { id: 'horizon', weight: HIGH_TIER_WEIGHT, clip: single(p('stage_05_horizon.mp4')) },
        { id: 'water', weight: HIGH_TIER_WEIGHT, clip: single(p('stage_05_water.mp4')) },
        { id: 'dolphine', weight: LOW_TIER_WEIGHT, clip: single(p('stage_05_dolphine.mp4')) },
      ]);
    default:
      return [];
  }
}

/**
 * 大樹の根本：手を動かす一コマ（water と、knife/meat/mallet/notebook/vape）が高頻度枠、
 * 森からの訪れ（bird/squirrel/figure/fox/butterflies）が低頻度枠。
 * town / ocean と違い、イベントはすべて1本で完結する（3部構成の set は使わない）。
 */
function forestStageEvents(stage: number, p: PathFn): StageEvent[] {
  switch (stage) {
    case 1:
      return buildEvents(single(p('stage_01_normal.mp4')), [
        { id: 'water', weight: HIGH_TIER_WEIGHT, clip: single(p('stage_01_water.mp4')) },
        { id: 'knife', weight: HIGH_TIER_WEIGHT, clip: single(p('stage_01_knife.mp4')) },
        { id: 'bird', weight: LOW_TIER_WEIGHT, clip: single(p('stage_01_bird.mp4')) },
      ]);
    case 2:
      return buildEvents(single(p('stage_02_normal.mp4')), [
        { id: 'water', weight: HIGH_TIER_WEIGHT, clip: single(p('stage_02_water.mp4')) },
        { id: 'meat', weight: HIGH_TIER_WEIGHT, clip: single(p('stage_02_meat.mp4')) },
        { id: 'squirrel', weight: LOW_TIER_WEIGHT, clip: single(p('stage_02_squirrel.mp4')) },
      ]);
    case 3:
      return buildEvents(single(p('stage_03_normal.mp4')), [
        { id: 'water', weight: HIGH_TIER_WEIGHT, clip: single(p('stage_03_water.mp4')) },
        { id: 'mallet', weight: HIGH_TIER_WEIGHT, clip: single(p('stage_03_mallet.mp4')) },
        { id: 'figure', weight: LOW_TIER_WEIGHT, clip: single(p('stage_03_figure.mp4')) },
      ]);
    case 4:
      return buildEvents(single(p('stage_04_normal.mp4')), [
        { id: 'water', weight: HIGH_TIER_WEIGHT, clip: single(p('stage_04_water.mp4')) },
        { id: 'notebook', weight: HIGH_TIER_WEIGHT, clip: single(p('stage_04_notebook.mp4')) },
        { id: 'fox', weight: LOW_TIER_WEIGHT, clip: single(p('stage_04_fox.mp4')) },
      ]);
    case 5:
      return buildEvents(single(p('stage_05_normal.mp4')), [
        { id: 'water', weight: HIGH_TIER_WEIGHT, clip: single(p('stage_05_water.mp4')) },
        { id: 'vape', weight: HIGH_TIER_WEIGHT, clip: single(p('stage_05_vape.mp4')) },
        { id: 'butterflies', weight: LOW_TIER_WEIGHT, clip: single(p('stage_05_butterflies.mp4')) },
      ]);
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

/** イベントのクリップを、実際に再生するURLの並び（巡）に展開する */
function expandClip(clip: EventClip): string[] {
  if (clip.kind === 'single') return [clip.src];
  const { intro, loop, outro } = clip;
  const repeats = randomLoopRepeats();
  const loopPart = Array.from({ length: repeats }, () => loop[Math.floor(Math.random() * loop.length)]);
  return [intro, ...loopPart, outro];
}

export interface EventPick {
  id: string;
  queue: string[];
  muted: boolean;
}

/** そのステージで選べるイベントid一覧（normal含む）。デバッグのイベント選択用 */
export function listStageEventIds(worldId: WorldId, stage: number): string[] {
  return getStageEvents(worldId, stage).map((e) => e.id);
}

/**
 * 指定した id のイベントの巡を決定的に作る（抽選しない）。デバッグ再生用。
 * 該当idが無ければ先頭（normal）にフォールバックする。
 */
export function buildForcedQueue(worldId: WorldId, stage: number, eventId: string): EventPick {
  const events = getStageEvents(worldId, stage);
  if (events.length === 0) return { id: '', queue: [], muted: true };
  const ev = events.find((e) => e.id === eventId) ?? events[0];
  return { id: ev.id, queue: expandClip(ev.clip), muted: ev.muted };
}

/**
 * ステージからイベントを1つ抽選し、実際に再生するクリップURLの並びに展開する。
 * excludeId を渡すと、その id（normalを除く）は今回の抽選から除外する
 * （＝同じ非normalイベントが連続で流れるのを防ぐ）。
 */
export function pickEventQueue(worldId: WorldId, stage: number, excludeId?: string): EventPick {
  const events = getStageEvents(worldId, stage);
  if (events.length === 0) return { id: '', queue: [], muted: true };

  const pool = excludeId && excludeId !== 'normal'
    ? events.filter((e) => e.id !== excludeId)
    : events;

  const ev = pickWeighted(pool.length > 0 ? pool : events);
  return { id: ev.id, queue: expandClip(ev.clip), muted: ev.muted };
}
