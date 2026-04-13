import { useEffect, useRef, useState } from 'react';
import { getVideoConfig } from '../../utils/stageCalculator';

interface Props {
  stage: number;
  isActive: boolean;
}

type VideoPhase = 'start' | 'loop';

export function WorldPlayer({ stage, isActive }: Props) {
  const config = getVideoConfig(stage);

  const [videoPhase, setVideoPhase] = useState<VideoPhase>(
    stage === 1 && config.startSrc ? 'start' : 'loop'
  );

  // 現在再生中のsrc
  const [currentSrc, setCurrentSrc] = useState<string>(
    stage === 1 && config.startSrc ? config.startSrc : config.loopSrc
  );
  const [nextSrc, setNextSrc] = useState<string | null>(null);
  const [fading, setFading] = useState(false);

  const currentRef = useRef<HTMLVideoElement>(null);
  const nextRef = useRef<HTMLVideoElement>(null);
  const prevStageRef = useRef(stage);

  // stage が変わったらクロスフェード
  useEffect(() => {
    if (stage === prevStageRef.current) return;
    prevStageRef.current = stage;

    const newConfig = getVideoConfig(stage);
    const target = newConfig.loopSrc;
    setNextSrc(target);
    setFading(true);

    const timeout = setTimeout(() => {
      setCurrentSrc(target);
      setNextSrc(null);
      setFading(false);
      setVideoPhase('loop');
    }, 800);

    return () => clearTimeout(timeout);
  }, [stage]);

  // start 動画が終わったら loop に切り替える
  const handleStartEnded = () => {
    if (videoPhase === 'start' && config.loopSrc) {
      setVideoPhase('loop');
      setCurrentSrc(config.loopSrc);
    }
  };

  // アクティブ状態による動画演出
  useEffect(() => {
    const vid = currentRef.current;
    if (!vid) return;
    if (isActive) {
      vid.playbackRate = 1.0;
    } else {
      vid.playbackRate = 0.3;
    }
  }, [isActive]);

  const isLoop = videoPhase === 'loop';

  return (
    <div className="relative w-full h-full bg-black">
      {/* 現在の動画 */}
      <video
        ref={currentRef}
        key={currentSrc}
        src={currentSrc}
        autoPlay
        muted
        playsInline
        loop={isLoop}
        onEnded={isLoop ? undefined : handleStartEnded}
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          opacity: fading ? 0 : 1,
          transition: 'opacity 0.8s ease',
          filter: isActive ? 'brightness(1)' : 'brightness(0.5)',
        }}
      />

      {/* 次の動画（クロスフェード用） */}
      {nextSrc && (
        <video
          ref={nextRef}
          key={nextSrc}
          src={nextSrc}
          autoPlay
          muted
          playsInline
          loop
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            opacity: fading ? 1 : 0,
            transition: 'opacity 0.8s ease',
          }}
        />
      )}

      {/* 非アクティブ時のオーバーレイ */}
      {!isActive && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.3)' }}
        >
          <p className="text-white/50 text-sm tracking-widest uppercase">Paused</p>
        </div>
      )}
    </div>
  );
}
