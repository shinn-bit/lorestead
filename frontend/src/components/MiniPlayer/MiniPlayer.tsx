import { useEffect, useRef } from 'react';
import { useDraggable } from '../../hooks/useDraggable';

// ── PiP window content (no dragging — OS handles window dragging) ──────────
interface PiPProps {
  stage: number;
  isRunning: boolean;
  isActive: boolean;
  totalAccumulatedTime: number;
  onTogglePlay: () => void;
  onClose: () => void;
}

export function PiPView({ stage, isRunning, isActive, totalAccumulatedTime, onTogglePlay, onClose }: PiPProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const prevStageRef = useRef(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.src = `/assets/worlds/prague/stage_0${stage}.mp4`;
    video.load();
    video.play().catch(() => {});
    prevStageRef.current = stage;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || prevStageRef.current === stage) return;
    prevStageRef.current = stage;
    video.src = `/assets/worlds/prague/stage_0${stage}.mp4`;
    video.load();
    video.play().catch(() => {});
  }, [stage]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = isActive ? 1.0 : 0.3;
  }, [isActive]);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#15171a' }}>
      {/* Video fills top portion */}
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

      {/* Controls row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px',
        gap: 10,
        flexShrink: 0,
      }}>
        <span style={{
          fontFamily: "'Cinzel', serif",
          fontSize: 18,
          fontWeight: 300,
          color: '#f5e6d3',
          letterSpacing: '0.05em',
          lineHeight: 1,
        }}>
          {formatTime(totalAccumulatedTime)}
        </span>
        <button
          onClick={onTogglePlay}
          style={{
            background: 'rgba(212,175,55,0.15)',
            border: '1px solid rgba(212,175,55,0.4)',
            color: '#f5e6d3',
            fontFamily: "'Cinzel', serif",
            fontSize: 10,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            padding: '6px 14px',
            borderRadius: 9999,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {isRunning ? 'Pause' : 'Start'}
        </button>
      </div>
    </div>
  );
}

interface Props {
  stage: number;
  isRunning: boolean;
  isActive: boolean;
  totalAccumulatedTime: number; // seconds
  onTogglePlay: () => void;
  onExpand: () => void;
}

function formatTime(seconds: number): string {
  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

export function MiniPlayer({ stage, isRunning, isActive, totalAccumulatedTime, onTogglePlay, onExpand }: Props) {
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
    video.src = `/assets/worlds/prague/stage_0${stage}.mp4`;
    video.load();
    video.play().catch(() => {});
  }, [stage]);

  // 初回マウント時
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.src = `/assets/worlds/prague/stage_0${stage}.mp4`;
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

      {/* コントロールエリア */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px',
        gap: 10,
      }}>
        {/* タイマー */}
        <span style={{
          fontFamily: "'Cinzel', serif",
          fontSize: 18,
          fontWeight: 300,
          color: '#f5e6d3',
          letterSpacing: '0.05em',
          lineHeight: 1,
        }}>
          {formatTime(totalAccumulatedTime)}
        </span>

        {/* 再生/停止ボタン */}
        <button
          onClick={onTogglePlay}
          style={{
            background: 'rgba(212,175,55,0.15)',
            border: '1px solid rgba(212,175,55,0.4)',
            color: '#f5e6d3',
            fontFamily: "'Cinzel', serif",
            fontSize: 10,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            padding: '6px 14px',
            borderRadius: 9999,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {isRunning ? 'Pause' : 'Start'}
        </button>
      </div>
    </div>
  );
}
