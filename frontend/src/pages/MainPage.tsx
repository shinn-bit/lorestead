import { useState, useEffect, useRef } from 'react';
import { useTimer } from '../hooks/useTimer';
import { useVisibility } from '../hooks/useVisibility';
import { useDraggable } from '../hooks/useDraggable';
import { useAuth } from '../context/AuthContext';
import { getCurrentStage } from '../utils/stageCalculator';
import { WorldPlayer } from '../components/World/WorldPlayer';
import { TimerPanel } from '../components/Timer/TimerPanel';
import { AuthModal } from '../components/Auth/AuthModal';

export function MainPage() {
  const {
    isRunning,
    elapsedSeconds,
    totalMinutes,
    activityType,
    setActivityType,
    start,
    pause,
    reset,
  } = useTimer();

  const { isActive } = useVisibility();
  const { isLoggedIn, signOut, syncProgress } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const stage = getCurrentStage(totalMinutes);

  // タイマー停止時にサーバーへ同期
  const prevRunning = useRef(false);
  const sessionStartRef = useRef<string>(new Date().toISOString());

  useEffect(() => {
    if (prevRunning.current && !isRunning && elapsedSeconds > 0) {
      const minutes = elapsedSeconds / 60;
      syncProgress(minutes).catch(() => {});
    }
    if (!prevRunning.current && isRunning) {
      sessionStartRef.current = new Date().toISOString();
    }
    prevRunning.current = isRunning;
  }, [isRunning, elapsedSeconds, syncProgress]);

  const initX = typeof window !== 'undefined' ? window.innerWidth / 2 - 130 : 100;
  const initY = typeof window !== 'undefined' ? window.innerHeight - 280 : 400;
  const { pos, onMouseDown, onTouchStart } = useDraggable({ x: initX, y: initY });

  return (
    <div className="relative w-full h-dvh overflow-hidden bg-black">
      <div className="absolute inset-0">
        <WorldPlayer stage={stage} isActive={isActive && isRunning} />
      </div>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 pt-6" style={{ zIndex: 50 }}>
        <p className="text-white/20 text-xs tracking-[0.3em] uppercase pointer-events-none">Lorestead</p>
        {isLoggedIn ? (
          <button
            onClick={signOut}
            className="text-xs text-white/20 hover:text-white/50 transition-colors"
          >
            Sign out
          </button>
        ) : (
          <button
            onClick={() => setShowAuth(true)}
            className="text-xs text-white/40 hover:text-white/70 transition-colors"
          >
            Sign in to save progress
          </button>
        )}
      </div>

      {/* Draggable timer */}
      <div
        className="absolute cursor-grab active:cursor-grabbing"
        style={{ left: pos.x, top: pos.y, touchAction: 'none', zIndex: 50 }}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
      >
        <TimerPanel
          isRunning={isRunning}
          elapsedSeconds={elapsedSeconds}
          totalMinutes={totalMinutes}
          activityType={activityType}
          onStart={start}
          onPause={pause}
          onReset={reset}
          onActivityChange={setActivityType}
        />
      </div>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}
