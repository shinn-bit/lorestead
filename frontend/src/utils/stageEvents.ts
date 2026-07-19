/**
 * 各ステージの世界動画は「normal」（高頻出・単発再生）に加え、
 * 単発イベント（book/coffee/dog/hands等）や、-1 → -2（ランダムに3〜5回ループ）→ -3
 * という3部構成のイベント（cat/talk/owl等）で構成される。
 * ここでは、ステージごとの動画一覧を定義し、重み付き抽選で次に流す1本（または3部構成の一連）を選ぶ。
 */

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
}

const BASE = '/assets/worlds/town';

function stageDir(stage: number): string {
  return `${BASE}/stage_${String(stage).padStart(2, '0')}`;
}

function single(src: string): SingleClip {
  return { kind: 'single', src };
}

function set(intro: string, loop: string | string[], outro: string): SetClip {
  return { kind: 'set', intro, loop: Array.isArray(loop) ? loop : [loop], outro };
}

/** normal の重みを「他イベント数」に合わせ、常に50%以上の出現率になるようにする */
function buildEvents(normal: EventClip, others: { id: string; clip: EventClip }[]): StageEvent[] {
  const normalWeight = Math.max(others.length, 1);
  return [
    { id: 'normal', weight: normalWeight, clip: normal },
    ...others.map((o) => ({ id: o.id, weight: 1, clip: o.clip })),
  ];
}

export function getStageEvents(stage: number): StageEvent[] {
  const d = stageDir(stage);
  const p = (name: string) => `${d}/${name}`;

  switch (stage) {
    case 1:
      return buildEvents(single(p('stage_01_normal.mp4')), [
        { id: 'book', clip: single(p('stage_01_book.mp4')) },
        { id: 'coffee', clip: single(p('stage_01_coffee.mp4')) },
        { id: 'hands', clip: single(p('stage_01_hands.mp4')) },
      ]);
    case 2:
      return buildEvents(single(p('stage_02_normal.mp4')), [
        { id: 'book', clip: single(p('stage_02_book.mp4')) },
        { id: 'coffee', clip: single(p('stage_02_coffee.mp4')) },
        { id: 'dog', clip: single(p('stage_02_dog.mp4')) },
      ]);
    case 3:
      return buildEvents(single(p('stage_03_normal.mp4')), [
        { id: 'book', clip: single(p('stage_03_book.mp4')) },
        { id: 'coffee', clip: single(p('stage_03_coffee.mp4')) },
        { id: 'cat', clip: set(p('stage_03_cat-1.mp4'), p('stage_03_cat-2.mp4'), p('stage_03_cat-3.mp4')) },
      ]);
    case 4:
      return buildEvents(single(p('stage_04_normal.mp4')), [
        { id: 'coffee', clip: single(p('stage_04_coffee.mp4')) },
        { id: 'hands', clip: single(p('stage_04_hands.mp4')) },
        {
          id: 'talk',
          clip: set(
            p('stage_04_talk-1.mp4'),
            [p('stage_04_talk-2-1.mp4'), p('stage_04_talk-2-2.mp4')],
            p('stage_04_talk-3.mp4'),
          ),
        },
      ]);
    case 5:
      return buildEvents(single(p('stage_05_normal.mp4')), [
        { id: 'coffee', clip: single(p('stage_05_coffee.mp4')) },
        { id: 'owl', clip: set(p('stage_05_owl-1.mp4'), p('stage_05_owl-2.mp4'), p('stage_05_owl-3.mp4')) },
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

/** ステージからイベントを1つ抽選し、実際に再生するクリップURLの並びに展開する */
export function pickEventQueue(stage: number): string[] {
  const events = getStageEvents(stage);
  if (events.length === 0) return [];

  const ev = pickWeighted(events);
  if (ev.clip.kind === 'single') return [ev.clip.src];

  const { intro, loop, outro } = ev.clip;
  const repeats = randomLoopRepeats();
  const loopPart = Array.from({ length: repeats }, () => loop[Math.floor(Math.random() * loop.length)]);
  return [intro, ...loopPart, outro];
}
