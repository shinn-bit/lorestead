import { useEffect, useRef, useState } from 'react';
import { getVideoConfig } from '../../utils/stageCalculator';

interface Props {
  stage: number;
  isActive: boolean;
}

const FADE_MS = 700;

export function WorldPlayer({ stage, isActive }: Props) {
  const videoARef = useRef<HTMLVideoElement>(null);
  const videoBRef = useRef<HTMLVideoElement>(null);
  const preloadRef = useRef<HTMLVideoElement>(null);

  // A/B どちらが「前面（表示中）」か
  const aIsFrontRef = useRef(true);

  // z-index: 前面=10, 背面(フェードイン中)=20, 完全非表示=0
  const [aStyle, setAStyle] = useState<React.CSSProperties>({ opacity: 1, zIndex: 10 });
  const [bStyle, setBStyle] = useState<React.CSSProperties>({ opacity: 0, zIndex: 0 });

  const prevStageRef = useRef(0); // 0 = 未初期化
  const cleanupRef = useRef<(() => void) | null>(null);

  // ---------- 初期化（Stage 1: start → loop） ----------
  useEffect(() => {
    const vidA = videoARef.current;
    if (!vidA) return;

    const config = getVideoConfig(1);
    prevStageRef.current = 1;

    const startLoop = () => {
      vidA.src = config.loopSrc;
      vidA.loop = true;
      vidA.load();
      vidA.addEventListener('canplay', () => vidA.play().catch(() => {}), { once: true });
    };

    if (config.startSrc) {
      vidA.src = config.startSrc;
      vidA.loop = false;
      vidA.load();
      vidA.addEventListener('canplay', () => vidA.play().catch(() => {}), { once: true });
      vidA.addEventListener('ended', startLoop, { once: true });
    } else {
      startLoop();
    }

    // Stage 2 を先読み
    const next = getVideoConfig(2);
    if (preloadRef.current) {
      preloadRef.current.src = next.loopSrc;
      preloadRef.current.load();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- Stage 変化 → canplay 待ちクロスフェード ----------
  useEffect(() => {
    if (prevStageRef.current === 0 || prevStageRef.current === stage) return;
    prevStageRef.current = stage;

    // 前回の crossfade cleanup
    cleanupRef.current?.();

    const isFrontA = aIsFrontRef.current;
    const front = isFrontA ? videoARef.current : videoBRef.current;
    const back  = isFrontA ? videoBRef.current : videoARef.current;
    if (!front || !back) return;

    const config = getVideoConfig(stage);

    // バック側に新しい動画をセット
    back.src = config.loopSrc;
    back.loop = true;
    back.load();

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const onCanPlay = () => {
      if (cancelled) return;
      back.play().catch(() => {});

      // バックを前面に持ってきてフェードイン、フロントをフェードアウト
      if (isFrontA) {
        setBStyle({ opacity: 1, zIndex: 20, transition: `opacity ${FADE_MS}ms ease` });
        setAStyle({ opacity: 0, zIndex: 10, transition: `opacity ${FADE_MS}ms ease` });
      } else {
        setAStyle({ opacity: 1, zIndex: 20, transition: `opacity ${FADE_MS}ms ease` });
        setBStyle({ opacity: 0, zIndex: 10, transition: `opacity ${FADE_MS}ms ease` });
      }

      // フェード完了後に z-index を確定
      timer = setTimeout(() => {
        if (cancelled) return;
        aIsFrontRef.current = !isFrontA;
        if (!isFrontA) {
          // A が新フロント
          setAStyle({ opacity: 1, zIndex: 10 });
          setBStyle({ opacity: 0, zIndex: 0 });
        } else {
          // B が新フロント
          setBStyle({ opacity: 1, zIndex: 10 });
          setAStyle({ opacity: 0, zIndex: 0 });
        }
        // 次ステージを先読み
        const next = getVideoConfig(stage + 1);
        if (preloadRef.current && next) {
          preloadRef.current.src = next.loopSrc;
          preloadRef.current.load();
        }
      }, FADE_MS + 50);
    };

    back.addEventListener('canplay', onCanPlay, { once: true });

    cleanupRef.current = () => {
      cancelled = true;
      back.removeEventListener('canplay', onCanPlay);
      if (timer) clearTimeout(timer);
    };

    return () => { cleanupRef.current?.(); };
  }, [stage]);

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
      {/* 先読み専用 (非表示) */}
      <video ref={preloadRef} muted playsInline preload="auto" className="hidden" />

      {!isActive && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 30 }}>
          <p className="text-white/30 text-xs tracking-[0.25em] uppercase font-light">Paused</p>
        </div>
      )}
    </div>
  );
}
