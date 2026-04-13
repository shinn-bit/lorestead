import { useTimer } from '../hooks/useTimer';
import { useVisibility } from '../hooks/useVisibility';
import { useDraggable } from '../hooks/useDraggable';
import { getCurrentStage } from '../utils/stageCalculator';
import { WorldPlayer } from '../components/World/WorldPlayer';
import { TimerPanel } from '../components/Timer/TimerPanel';

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
  const stage = getCurrentStage(totalMinutes);

  // タイマーの初期位置: 画面下部中央
  const initX = typeof window !== 'undefined' ? window.innerWidth / 2 - 130 : 100;
  const initY = typeof window !== 'undefined' ? window.innerHeight - 280 : 400;
  const { pos, onMouseDown, onTouchStart } = useDraggable({ x: initX, y: initY });

  return (
    <div className="relative w-full h-dvh overflow-hidden bg-black">
      {/* World full-screen */}
      <div className="absolute inset-0">
        <WorldPlayer stage={stage} isActive={isActive && isRunning} />
      </div>

      {/* App name */}
      <div className="absolute top-6 left-6 pointer-events-none" style={{ zIndex: 50 }}>
        <p className="text-white/20 text-xs tracking-[0.3em] uppercase">Lorestead</p>
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
    </div>
  );
}
