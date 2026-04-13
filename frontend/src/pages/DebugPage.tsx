import { useTimer } from '../hooks/useTimer';
import { useVisibility } from '../hooks/useVisibility';
import { getCurrentStage, STAGE_THRESHOLDS } from '../utils/stageCalculator';
import { WorldPlayer } from '../components/World/WorldPlayer';
import { useRef } from 'react';

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function DebugPage() {
  const {
    isRunning,
    elapsedSeconds,
    totalMinutes,
    start,
    pause,
    reset,
    debugSetMinutes,
  } = useTimer();

  const { isActive } = useVisibility();
  const stage = getCurrentStage(totalMinutes);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative w-full h-dvh overflow-hidden bg-black">
      {/* World */}
      <div className="absolute inset-0">
        <WorldPlayer stage={stage} isActive={isActive && isRunning} />
      </div>

      {/* Debug overlay */}
      <div className="absolute inset-0 flex">
        {/* Left panel */}
        <div
          className="flex flex-col gap-4 p-5 m-4 rounded-2xl overflow-y-auto"
          style={{
            background: 'rgba(0,0,0,0.82)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,60,60,0.3)',
            width: 240,
            maxHeight: 'calc(100dvh - 32px)',
          }}
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-red-400 text-xs font-mono uppercase tracking-widest">Debug Mode</span>
          </div>

          {/* Current state */}
          <div className="rounded-xl p-3 text-xs font-mono" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <p className="text-white/40 mb-1">Status</p>
            <p className="text-white">Stage <span className="text-red-400">{stage}</span> / 9</p>
            <p className="text-white">{totalMinutes.toFixed(1)} min total</p>
            <p className="text-white">{String(Math.floor(elapsedSeconds / 60)).padStart(2,'0')}:{String(elapsedSeconds % 60).padStart(2,'0')} session</p>
            <p className="text-white/40 mt-1">{isRunning ? '▶ running' : '⏸ paused'}</p>
          </div>

          {/* Timer controls */}
          <div className="flex gap-2">
            <button
              onClick={isRunning ? pause : start}
              className="flex-1 py-2 rounded-lg text-xs transition-all"
              style={{ background: isRunning ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.85)', color: isRunning ? '#fff' : '#000' }}
            >
              {isRunning ? 'Pause' : 'Start'}
            </button>
            <button
              onClick={reset}
              className="px-3 py-2 rounded-lg text-xs text-white/40"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            >
              Reset
            </button>
          </div>

          {/* Stage jump buttons */}
          <div>
            <p className="text-white/30 text-xs mb-2 uppercase tracking-widest">Jump to Stage</p>
            <div className="flex flex-col gap-1">
              {STAGE_THRESHOLDS.map((t) => {
                const isCurrentStage = stage === t.stage;
                return (
                  <button
                    key={t.stage}
                    onClick={() => debugSetMinutes(t.minutes)}
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all text-xs"
                    style={{
                      background: isCurrentStage ? 'rgba(255,60,60,0.2)' : 'rgba(255,255,255,0.05)',
                      border: isCurrentStage ? '1px solid rgba(255,60,60,0.5)' : '1px solid transparent',
                    }}
                  >
                    <span className="text-white/70">Stage {t.stage}</span>
                    <span className="text-white/30 font-mono">
                      {t.minutes === 0 ? '0h' : formatMinutes(t.minutes)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom minutes */}
          <div>
            <p className="text-white/30 text-xs mb-2 uppercase tracking-widest">Custom minutes</p>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="number"
                min={0}
                max={1200}
                placeholder="e.g. 121"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && inputRef.current) {
                    debugSetMinutes(Number(inputRef.current.value));
                  }
                }}
                className="flex-1 px-3 py-2 rounded-lg text-xs text-white font-mono min-w-0"
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  outline: 'none',
                }}
              />
              <button
                onClick={() => inputRef.current && debugSetMinutes(Number(inputRef.current.value))}
                className="px-3 py-2 rounded-lg text-xs text-white/60"
                style={{ background: 'rgba(255,255,255,0.08)' }}
              >
                Go
              </button>
            </div>
          </div>

          {/* Back link */}
          <a
            href="/"
            className="text-xs text-white/20 hover:text-white/50 transition-colors text-center mt-auto"
          >
            ← Back to app
          </a>
        </div>
      </div>
    </div>
  );
}
