import { useEffect, useRef } from 'react';
import { useDraggable } from '../../hooks/useDraggable';
import { getVideoConfig, MAX_STAGE } from '../../utils/stageCalculator';
import type { WorldId } from '../../utils/worlds';

function getLoopSrc(worldId: WorldId, stage: number): string {
  const config = getVideoConfig(worldId, stage);
  return config.loopSrc ?? (getVideoConfig(worldId, MAX_STAGE).loopSrc as string);
}

// ── PiP window content (no dragging — OS handles window dragging) ──────────
interface PiPProps {
  worldId: WorldId;
  stage: number;
  isActive: boolean;
  onClose: () => void;
}

export function PiPView({ worldId, stage, isActive, onClose }: PiPProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const prevStageRef = useRef(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.src = getLoopSrc(worldId, stage);
    video.load();
    video.play().catch(() => {});
    prevStageRef.current = stage;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || prevStageRef.current === stage) return;
    prevStageRef.current = stage;
    video.src = getLoopSrc(worldId, stage);
    video.load();
    video.play().catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = isActive ? 1.0 : 0.3;
  }, [isActive]);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#15171a' }}>
      {/* Video fills the window */}
      <div style={{ position: 'relative', flex: 1, background: '#000', minHeight: 0 }}>
        <video
          ref={videoRef}
          muted
          playsInline
          loop
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: isActive ? 'brightness(1)' : 'brightness(0.45)',
          }}
        />
        {/* Close button */}
        <button
          onClick={onClose}
          title="Close"
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 26,
            height: 26,
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.55)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: 'rgba(245,230,211,0.8)',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            lineHeight: 1,
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

interface Props {
  worldId: WorldId;
  stage: number;
  isActive: boolean;
  onExpand: () => void;
}

export function MiniPlayer({ worldId, stage, isActive, onExpand }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const prevStageRef = useRef(0);

  const { pos, onMouseDown, onTouchStart } = useDraggable({
    x: window.innerWidth - 300,
    y: window.innerHeight - 220,
  });

  // ステージが変わったら動画を切り替え
  useEffect(() => {
    const video = videoRef.current;
    if (!video || prevStageRef.current === stage) return;
    prevStageRef.current = stage;
    video.src = getLoopSrc(worldId, stage);
    video.load();
    video.play().catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  // 初回マウント時
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.src = getLoopSrc(worldId, stage);
    video.load();
    video.play().catch(() => {});
    prevStageRef.current = stage;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // アクティブ状態に応じて再生速度・明るさ変更
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = isActive ? 1.0 : 0.3;
  }, [isActive]);

  return (
    <div
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        width: 272,
        zIndex: 9999,
        borderRadius: 20,
        overflow: 'hidden',
        background: '#15171a',
        border: '1px solid rgba(212,175,55,0.35)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
        cursor: 'grab',
        userSelect: 'none',
      }}
    >
      {/* 動画エリア */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#000' }}>
        <video
          ref={videoRef}
          muted
          playsInline
          loop
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: isActive ? 'brightness(1)' : 'brightness(0.45)',
          }}
        />

        {/* Expand ボタン（右上） */}
        <button
          onClick={onExpand}
          title="Expand"
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.55)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: 'rgba(245,230,211,0.8)',
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            lineHeight: 1,
          }}
        >
          ⤢
        </button>
      </div>
    </div>
  );
}
