import { useEffect, useRef, useState } from 'react';
import { getVideoConfig } from '../../utils/stageCalculator';

interface Props {
  stage: number;
  isActive: boolean;
}

const FADE_MS = 800;

export function WorldPlayer({ stage, isActive }: Props) {
  // A/B 2枚のvideoを常にDOMに保持し、opacityでクロスフェード
  const videoARef = useRef<HTMLVideoElement>(null);
  const videoBRef = useRef<HTMLVideoElement>(null);

  // true = A が前面, false = B が前面
  const [aIsFront, setAIsFront] = useState(true);
  const [aOpacity, setAOpacity] = useState(1);
  const [bOpacity, setBOpacity] = useState(0);

  const prevStageRef = useRef<number>(-1);
  // stage 1 の start 動画を再生したかどうか
  const startPlayedRef = useRef(false);

  const backRef = () => (aIsFront ? videoBRef : videoARef);

  // 初回マウント: stage 1 の start 動画を A に流す
  useEffect(() => {
    const config = getVideoConfig(1);
    const vid = videoARef.current;
    if (!vid) return;

    if (config.startSrc && !startPlayedRef.current) {
      startPlayedRef.current = true;
      vid.src = config.startSrc;
      vid.loop = false;
      vid.load();
      vid.play().catch(() => {});

      vid.onended = () => {
        vid.src = config.loopSrc;
        vid.loop = true;
        vid.load();
        vid.play().catch(() => {});
        vid.onended = null;
      };
    } else {
      vid.src = config.loopSrc;
      vid.loop = true;
      vid.load();
      vid.play().catch(() => {});
    }

    prevStageRef.current = 1;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // stage が変わったらクロスフェード
  useEffect(() => {
    if (prevStageRef.current === stage || prevStageRef.current === -1) return;
    prevStageRef.current = stage;

    const config = getVideoConfig(stage);
    const back = backRef().current;
    if (!back) return;

    // バック側に新しい動画をセット
    back.src = config.loopSrc;
    back.loop = true;
    back.load();
    back.play().catch(() => {});

    // フェードアニメーション
    if (aIsFront) {
      setBOpacity(1);
      setTimeout(() => {
        setAOpacity(0);
        setAIsFront(false);
      }, FADE_MS);
    } else {
      setAOpacity(1);
      setTimeout(() => {
        setBOpacity(0);
        setAIsFront(true);
      }, FADE_MS);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  // アクティブ状態で再生速度・明るさを変える
  useEffect(() => {
    const update = (vid: HTMLVideoElement | null) => {
      if (!vid) return;
      vid.playbackRate = isActive ? 1.0 : 0.3;
    };
    update(videoARef.current);
    update(videoBRef.current);
  }, [isActive]);

  // 次のステージの動画を先読み
  useEffect(() => {
    const nextConfig = getVideoConfig(stage + 1);
    if (!nextConfig) return;
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'video';
    link.href = nextConfig.loopSrc;
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, [stage]);

  const brightness = isActive ? 'brightness(1)' : 'brightness(0.45)';

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      <video
        ref={videoARef}
        autoPlay
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          opacity: aOpacity,
          transition: `opacity ${FADE_MS}ms ease`,
          filter: brightness,
        }}
      />
      <video
        ref={videoBRef}
        autoPlay
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          opacity: bOpacity,
          transition: `opacity ${FADE_MS}ms ease`,
          filter: brightness,
        }}
      />

      {!isActive && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-white/30 text-xs tracking-[0.25em] uppercase font-light">Paused</p>
        </div>
      )}
    </div>
  );
}
