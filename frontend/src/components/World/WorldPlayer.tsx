import { useEffect, useRef, useState } from 'react';
import { pickEventQueue, buildForcedQueue, type EventPick } from '../../utils/stageEvents';
import { getBundledStillSrc } from '../../utils/stageCalculator';
import { useI18n } from '../../i18n/I18nContext';
import type { WorldId } from '../../utils/worlds';

interface Props {
  worldId: WorldId;
  stage: number;
  isActive: boolean;
  /** マイクボタンで音声が許可されているか（既定オフ） */
  audioOn: boolean;
  /**
   * デバッグ再生用：特定イベントを固定表示する。'random'/未指定なら通常の抽選。
   * 指定時は「そのイベント ⇄ normal」を交互に流す（すぐ確認でき、かつ間延びしない）。
   */
  forceEventId?: string | null;
}

interface PendingTransition {
  cleanup: () => void;
}

interface NextPick {
  src: string;
  /** このクリップを音ありで再生するか（巡全体で共通） */
  muted: boolean;
  /** 巡（キュー）を使い切っていた場合、新しく抽選した巡 */
  newTurn?: { id: string; queue: string[]; muted: boolean };
}

/**
 * video.play() は稀にcanplay直後の呼び出しだと(ブラウザの自動再生ポリシー等により)
 * 一度だけ拒否されることがある。短い間隔で数回リトライする。
 */
function attemptPlay(video: HTMLVideoElement, retriesLeft = 5) {
  video.play().catch(() => {
    if (retriesLeft > 0) {
      setTimeout(() => attemptPlay(video, retriesLeft - 1), 150);
    }
  });
}

export function WorldPlayer({ worldId, stage, isActive, audioOn, forceEventId }: Props) {
  const { t } = useI18n();
  const videoARef = useRef<HTMLVideoElement>(null);
  const videoBRef = useRef<HTMLVideoElement>(null);
  // 動画（CDN）が読めない状態。素のvideo要素の再生ボタンが露出するのを防ぎ、
  // 同梱の静止画に差し替えて「オフラインである」ことを伝える。
  const [stalled, setStalled] = useState(false);
  // 見張り番（命令的なコールバック）から最新値を読むためのミラー
  const stalledRef = useRef(false);
  // 前面のvideoがまだフレームを持っていない状態（クリップの切り替わり、画面回転直後など）。
  // 素のvideo要素は、フレームが無いと巨大な再生ボタンのプレースホルダを描いてしまう。
  const [covered, setCovered] = useState(true);
  // 命令的なコールバック（onended/onplaying等）から常に最新値を読めるようref化
  const audioOnRef = useRef(audioOn);
  const worldIdRef = useRef(worldId);
  worldIdRef.current = worldId;
  const forceEventIdRef = useRef(forceEventId);
  forceEventIdRef.current = forceEventId;

  // A/B どちらが「前面（表示中）」か
  const aIsFrontRef = useRef(true);

  // z-index: 前面=10, 背面(フェードイン中)=20, 完全非表示=0
  const [aStyle, setAStyle] = useState<React.CSSProperties>({ opacity: 1, zIndex: 10 });
  const [bStyle, setBStyle] = useState<React.CSSProperties>({ opacity: 0, zIndex: 0 });

  const stageRef = useRef(0);
  // 現在の「巡」（1回に流すクリップの並び。単発イベントなら1本、-1→-2×n→-3のセットなら複数本）
  const queueRef = useRef<string[]>([]);
  const queueIdxRef = useRef(0);
  const pendingRef = useRef<PendingTransition | null>(null);
  // 直前に選ばれた非normalイベントのid（同じイベントが連続で流れるのを防ぐため）
  const lastEventIdRef = useRef<string | undefined>(undefined);
  // 現在の巡は音ありで再生するか
  const turnMutedRef = useRef(true);
  // 現在アイドル中（裏）のvideo要素に先読みしてある「次のクリップ」
  const preloadRef = useRef<NextPick | null>(null);

  function frontVideo() {
    return aIsFrontRef.current ? videoARef.current : videoBRef.current;
  }
  function backVideo() {
    return aIsFrontRef.current ? videoBRef.current : videoARef.current;
  }

  /** 巡の状態を確定させる（新しい巡が来ていればそれに切り替え、なければ次の位置に進める） */
  function beginTurn(turn: { id: string; queue: string[]; muted: boolean }) {
    lastEventIdRef.current = turn.id;
    queueRef.current = turn.queue;
    queueIdxRef.current = 0;
    turnMutedRef.current = turn.muted;
  }

  /**
   * 新しい巡（1回に流すイベント）を選ぶ。
   * forceEventId が指定されていれば抽選せず「そのイベント ⇄ normal」を交互に返す。
   */
  function pickTurn(): EventPick {
    const forced = forceEventIdRef.current;
    if (forced && forced !== 'random') {
      const nextId = lastEventIdRef.current === forced ? 'normal' : forced;
      return buildForcedQueue(worldIdRef.current, stageRef.current, nextId);
    }
    return pickEventQueue(worldIdRef.current, stageRef.current, lastEventIdRef.current);
  }

  /** 「次に流すクリップ」を副作用なしに計算する（巡の続き、または新しい巡の1本目） */
  function computeNext(): NextPick {
    const nextIdx = queueIdxRef.current + 1;
    if (nextIdx < queueRef.current.length) {
      return { src: queueRef.current[nextIdx], muted: turnMutedRef.current };
    }
    const { id, queue, muted } = pickTurn();
    return { src: queue[0] ?? '', muted, newTurn: { id, queue, muted } };
  }

  function commit(next: NextPick) {
    if (next.newTurn) beginTurn(next.newTurn);
    else queueIdxRef.current += 1;
  }

  /** 現在アイドル中のvideo要素に、次のクリップを裏側で読み込ませておく（つなぎ目の待ち時間をなくす） */
  function schedulePreload() {
    const back = backVideo();
    if (!back) return;
    const next = computeNext();
    if (!next.src) {
      preloadRef.current = null;
      return;
    }
    preloadRef.current = next;
    // 表に出るまでは無音のまま先読みする（切り替わる前に音が鳴り出さないように）
    back.muted = true;
    back.src = next.src;
    back.loop = false;
    back.load();
  }

  function playClip(video: HTMLVideoElement) {
    video.loop = false;
    video.onended = handleEnded;
    attemptPlay(video);
  }

  function handleEnded() {
    const pre = preloadRef.current;
    const next = pre ?? computeNext();
    preloadRef.current = null;
    commit(next);
    if (next.src) crossfadeTo(next.src, !!pre, next.muted);
  }

  /**
   * src への切り替え。alreadyPreloaded=true なら、裏のvideoは既に先読み済みなので
   * 読み込み待ちをスキップできる。実際に描画が始まる 'playing' を待ってから、
   * フェードは行わず瞬時に前面を入れ替える（クロスフェード演出はなし）。
   * muted は、この巡を音ありで再生するか（表に出た瞬間にだけ適用する）。
   */
  function crossfadeTo(src: string, alreadyPreloaded: boolean, muted: boolean) {
    // 進行中の遷移があれば打ち切る（ステージ切替とクリップ終端が接近した場合の競合防止）
    pendingRef.current?.cleanup();

    const isFrontA = aIsFrontRef.current;
    const back = isFrontA ? videoBRef.current : videoARef.current;
    const oldFront = isFrontA ? videoARef.current : videoBRef.current;
    if (!back) return;

    // 旧フロント側の onended を即座に解除し、二重発火を防ぐ
    if (oldFront) oldFront.onended = null;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const cutToFront = () => {
      if (cancelled) return;
      back.onplaying = null;
      if (timer) clearTimeout(timer);

      // 実際に表に出る瞬間にだけ音を解禁する（先読み・再生開始待ちの間は無音のまま）。
      // マイクボタンがオフなら、イベント側の設定に関わらず無音のまま。
      back.muted = muted || !audioOnRef.current;
      aIsFrontRef.current = !isFrontA;
      oldFront?.pause();
      if (isFrontA) {
        setBStyle({ opacity: 1, zIndex: 10 });
        setAStyle({ opacity: 0, zIndex: 0 });
      } else {
        setAStyle({ opacity: 1, zIndex: 10 });
        setBStyle({ opacity: 0, zIndex: 0 });
      }
      pendingRef.current = null;
      // 次のクリップをすぐに裏で先読みし始める
      schedulePreload();
    };

    // play() を呼んだ後、実際に描画が始まる 'playing' を待ってから切り替える。
    // 保険として、稀に 'playing' が発火しないケースに備え最大250msでタイムアウトさせる。
    const startAndWaitPlaying = () => {
      back.onended = handleEnded;
      back.onplaying = cutToFront;
      attemptPlay(back);
      timer = setTimeout(cutToFront, 250);
    };

    const cleanup = () => {
      cancelled = true;
      back.removeEventListener('canplay', onCanPlay);
      back.onplaying = null;
      if (timer) clearTimeout(timer);
    };

    const onCanPlay = () => {
      if (cancelled) return;
      startAndWaitPlaying();
    };

    const isReady = back.readyState >= 2; // HAVE_CURRENT_DATA 以上

    if (alreadyPreloaded && isReady) {
      startAndWaitPlaying();
    } else {
      back.muted = true; // 表に出るまでは無音（cutToFrontで解禁する）
      back.src = src;
      back.loop = false;
      back.load();
      back.addEventListener('canplay', onCanPlay, { once: true });
    }

    pendingRef.current = { cleanup };
  }

  // ---------- 初期化（最初のイベントを抽選して再生） ----------
  useEffect(() => {
    const vidA = videoARef.current;
    if (!vidA) return;

    stageRef.current = stage;
    const pick = pickTurn();
    beginTurn(pick);
    const first = pick.queue[0];
    if (first) {
      vidA.muted = pick.muted || !audioOnRef.current;
      vidA.src = first;
      vidA.loop = false;
      vidA.load();
      vidA.addEventListener('canplay', () => {
        playClip(vidA);
        schedulePreload();
      }, { once: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- Stage 変化 → 新しいイベントを抽選してクロスフェード ----------
  useEffect(() => {
    if (stageRef.current === 0 || stageRef.current === stage) {
      stageRef.current = stage;
      return;
    }
    stageRef.current = stage;
    preloadRef.current = null; // 旧ステージ向けの先読みは無効化
    const pick = pickTurn();
    beginTurn(pick);
    const first = pick.queue[0];
    if (first) crossfadeTo(first, false, pick.muted);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  // ---------- 通信断：静止画にフォールバックし、復帰したら再生し直す ----------
  function markStalled(v: boolean) {
    stalledRef.current = v;
    setStalled(v);
  }

  function handleVideoError() {
    markStalled(true);
  }

  function handleVideoPlaying() {
    markStalled(false);
  }

  /** 失敗したままのsrcは load() し直さないと再取得されない（play()だけでは復帰しない） */
  function reloadFront() {
    const front = frontVideo();
    if (!front?.src) return;
    front.load();
    attemptPlay(front);
  }

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) markStalled(true);

    function onOffline() {
      markStalled(true);
    }
    window.addEventListener('offline', onOffline);
    window.addEventListener('online', reloadFront);
    return () => {
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', reloadFront);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- 前面videoがフレームを持つまで静止画で覆う ----------
  // クリップの切り替え時に 'playing' が250ms以内に来ないと、フレームの無いvideoが
  // 前面に出て再生ボタンが露出する（回転直後も同様にデコーダが作り直される）。
  useEffect(() => {
    const interval = setInterval(() => {
      const front = frontVideo();
      // HAVE_CURRENT_DATA 未満＝表示できるフレームが無い
      setCovered(!front || front.readyState < 2);
    }, 120);
    return () => clearInterval(interval);
  }, []);

  // ---------- 見張り番：再生が止まったままになっていたら復帰させる ----------
  // (自動再生ポリシー等でplay()が拒否され続けた場合の保険。ユーザー操作時と定期チェックの両方で確認する)
  useEffect(() => {
    function resumeIfStuck() {
      // 読み込みに失敗している間は、通信が戻ったかどうかに関わらず定期的に取得し直す。
      // AndroidのWebViewでは 'online' が発火しないことがあり、イベント頼みだと
      // 圏外表示のまま復帰しなくなる。
      if (stalledRef.current) {
        reloadFront();
        return;
      }
      const front = frontVideo();
      if (!front || !front.paused) return;
      if (front.ended) {
        handleEnded();
      } else {
        attemptPlay(front, 2);
      }
    }
    document.addEventListener('pointerdown', resumeIfStuck);
    document.addEventListener('keydown', resumeIfStuck);
    const interval = setInterval(resumeIfStuck, 5000);
    return () => {
      document.removeEventListener('pointerdown', resumeIfStuck);
      document.removeEventListener('keydown', resumeIfStuck);
      clearInterval(interval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- アクティブ状態 ----------
  useEffect(() => {
    [videoARef, videoBRef].forEach((ref) => {
      if (!ref.current) return;
      ref.current.playbackRate = isActive ? 1.0 : 0.3;
    });
  }, [isActive]);

  // ---------- 音声トグル：切り替えた瞬間、今流れているクリップにも即反映する ----------
  useEffect(() => {
    audioOnRef.current = audioOn;
    const front = frontVideo();
    if (front) front.muted = turnMutedRef.current || !audioOn;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioOn]);

  const brightness = isActive ? 'brightness(1)' : 'brightness(0.45)';

  const fallbackStill = getBundledStillSrc(worldId, stage);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      <video
        ref={videoARef}
        playsInline
        poster={fallbackStill}
        onError={handleVideoError}
        onPlaying={handleVideoPlaying}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ ...aStyle, filter: brightness }}
      />
      <video
        ref={videoBRef}
        playsInline
        poster={fallbackStill}
        onError={handleVideoError}
        onPlaying={handleVideoPlaying}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ ...bStyle, filter: brightness }}
      />

      {/* 動画が見せられない間はその段階の静止画で覆う（z-indexは前面10/背面20より上）。
          文言を出すのは通信が切れているときだけで、クリップの繋ぎ目では静止画だけを挟む。 */}
      {(stalled || covered) && (
        <div className="world-offline" style={{ zIndex: 30 }}>
          {fallbackStill && (
            <img
              src={fallbackStill}
              alt=""
              className="world-offline-still"
              style={{ filter: brightness }}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          )}
          {stalled && <p className="world-offline-note">{t('offline_note')}</p>}
        </div>
      )}
    </div>
  );
}
