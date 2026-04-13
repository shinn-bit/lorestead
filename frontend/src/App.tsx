import { useState, useEffect } from 'react';
import { useTimer } from './hooks/useTimer';
import { useVisibility } from './hooks/useVisibility';
import { getCurrentStage } from './utils/stageCalculator';
import { WorldPlayer } from './components/World/WorldPlayer';
import { TimerPanel } from './components/Timer/TimerPanel';
import { DebugPanel } from './components/Debug/DebugPanel';

export default function App() {
  const {
    isRunning,
    elapsedSeconds,
    totalMinutes,
    activityType,
    setActivityType,
    start,
    pause,
    reset,
    debugSetMinutes,
  } = useTimer();

  const { isActive } = useVisibility();
  const stage = getCurrentStage(totalMinutes);

  const [showDebug, setShowDebug] = useState(false);

  // Dキーでデバッグパネルをトグル
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'd' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setShowDebug((v) => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="relative w-full h-dvh overflow-hidden bg-black">
      {/* World video - full screen */}
      <div className="absolute inset-0">
        <WorldPlayer stage={stage} isActive={isActive && isRunning} />
      </div>

      {/* Timer UI - bottom center */}
      <div className="absolute inset-0 flex items-end justify-center pb-10 px-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-sm">
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

      {/* App name - top left */}
      <div className="absolute top-6 left-6 pointer-events-none">
        <p className="text-white/20 text-xs tracking-[0.3em] uppercase">Lorestead</p>
      </div>

      {/* Debug toggle button - top right */}
      <button
        onClick={() => setShowDebug((v) => !v)}
        className="absolute top-4 right-4 text-white/20 hover:text-red-400 text-xs font-mono transition-colors"
        title="Debug panel (Ctrl+D)"
      >
        [debug]
      </button>

      {/* Debug panel */}
      {showDebug && (
        <DebugPanel
          totalMinutes={totalMinutes}
          onSetMinutes={debugSetMinutes}
          onClose={() => setShowDebug(false)}
        />
      )}
    </div>
  );
}
