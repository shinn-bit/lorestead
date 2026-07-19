import { useEffect, useRef, useState } from 'react';
import { pickEventQueue } from '../../utils/stageEvents';

interface Props {
  stage: number;
  isActive: boolean;
}

const FADE_MS = 700;

interface PendingTransition {
  cleanup: () => void;
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

export function WorldPlayer({ stage, isActive }: Props) {
  const videoARef = useRef<HTMLVideoElement>(null);
  const videoBRef = useRef<HTMLVideoElement>(null);

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

  /** 現在のステージから新しいイベントを抽選し、キューを差し替える */
  function startNewTurn(): string[] {
    const q = pickEventQueue(stageRef.current);
    queueRef.current = q;
    queueIdxRef.current = 0;
    return q;
  }

  /** 今の巡の次のクリップ。巡を使い切っていたら新しいイベントを抽選する */
  function nextClipSrc(): string | null {
    queueIdxRef.current += 1;
    if (queueIdxRef.current >= queueRef.current.length) {
      const q = startNewTurn();
      return q[0] ?? null;
    }
    return queueRef.current[queueIdxRef.current] ?? null;
  }

  function playClip(video: HTMLVideoElement) {
    video.loop = false;
    video.onended = handleEnded;
    attemptPlay(video);
  }

  function handleEnded() {
    const src = nextClipSrc();
    if (src) crossfadeTo(src);
  }

  function crossfadeTo(src: string) {
    // 進行中の遷移があれば打ち切る（ステージ切替とクリップ終端が接近した場合の競合防止）
    pendingRef.current?.cleanup();

    const isFrontA = aIsFrontRef.current;
    const back = isFrontA ? videoBRef.current : videoARef.current;
    const oldFront = isFrontA ? videoARef.current : videoBRef.current;
    if (!back) return;

    // 旧フロント側の onended を即座に解除し、二重発火を防ぐ
    if (oldFront) oldFront.onended = null;

    back.src = src;
    back.loop = false;
    back.load();

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const onCanPlay = () => {
      if (cancelled) return;
      playClip(back);

      if (isFrontA) {
        setBStyle({ opacity: 1, zIndex: 20, transition: `opacity ${FADE_MS}ms ease` });
        setAStyle({ opacity: 0, zIndex: 10, transition: `opacity ${FADE_MS}ms ease` });
      } else {
        setAStyle({ opacity: 1, zIndex: 20, transition: `opacity ${FADE_MS}ms ease` });
        setBStyle({ opacity: 0, zIndex: 10, transition: `opacity ${FADE_MS}ms ease` });
      }

      timer = setTimeout(() => {
        if (cancelled) return;
        aIsFrontRef.current = !isFrontA;
        oldFront?.pause();
        if (!isFrontA) {
          setAStyle({ opacity: 1, zIndex: 10 });
          setBStyle({ opacity: 0, zIndex: 0 });
        } else {
          setBStyle({ opacity: 1, zIndex: 10 });
          setAStyle({ opacity: 0, zIndex: 0 });
        }
        pendingRef.current = null;
      }, FADE_MS + 50);
    };

    back.addEventListener('canplay', onCanPlay, { once: true });

    pendingRef.current = {
      cleanup: () => {
        cancelled = true;
        back.removeEventListener('canplay', onCanPlay);
        if (timer) clearTimeout(timer);
      },
    };
  }

  // ---------- 初期化（最初のイベントを抽選して再生） ----------
  useEffect(() => {
    const vidA = videoARef.current;
    if (!vidA) return;

    stageRef.current = stage;
    const q = startNewTurn();
    const first = q[0];
    if (first) {
      vidA.src = first;
      vidA.loop = false;
      vidA.load();
      vidA.addEventListener('canplay', () => playClip(vidA), { once: true });
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
    const q = startNewTurn();
    const first = q[0];
    if (first) crossfadeTo(first);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  // ---------- 見張り番：再生が止まったままになっていたら復帰させる ----------
  // (自動再生ポリシー等でplay()が拒否され続けた場合の保険。ユーザー操作時と定期チェックの両方で確認する)
  useEffect(() => {
    function resumeIfStuck() {
      const front = aIsFrontRef.current ? videoARef.current : videoBRef.current;
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

  const brightness = isActive ? 'brightness(1)' : 'brightness(0.45)';

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      <video
        ref={videoARef}
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ ...aStyle, filter: brightness }}
      />
      <video
        ref={videoBRef}
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ ...bStyle, filter: brightness }}
      />
    </div>
  );
}
