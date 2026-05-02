import { useRef, useState } from 'react';
import { useTimer } from '../hooks/useTimer';
import { getCurrentStage, STAGE_THRESHOLDS } from '../utils/stageCalculator';
import { WorldPlayer } from '../components/World/WorldPlayer';
import { generateTimelapse, downloadBlob } from '../utils/timelapse';

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function DebugPage() {
  const { isRunning, elapsedSeconds, totalMinutes, start, pause, reset, debugSetMinutes } = useTimer();
  const stage = getCurrentStage(totalMinutes);
  const inputRef = useRef<HTMLInputElement>(null);
  const [genProgress, setGenProgress] = useState<number | null>(null);

  async function handleGenerateTimelapse() {
    if (genProgress !== null) return;
    setGenProgress(0);
    try {
      const blob = await generateTimelapse(
        stage,
        totalMinutes,
        elapsedSeconds,
        [],
        (ratio) => setGenProgress(Math.round(ratio * 100)),
      );
      const date = new Date().toISOString().slice(0, 10);
      downloadBlob(blob, `debug_timelapse_stage${stage}_${date}.webm`);
    } catch (e) {
      console.error(e);
    } finally {
      setGenProgress(null);
    }
  }

  return (
    <div className="relative w-full h-dvh overflow-hidden bg-black">
      {/* World - debug page では常に明るく表示 */}
      <div className="absolute inset-0">
        <WorldPlayer stage={stage} isActive={true} />
      </div>

      {/* Debug panel */}
      <div className="absolute inset-0 flex pointer-events-none" style={{ zIndex: 50 }}>
        <div
          className="flex flex-col gap-4 p-5 m-4 rounded-2xl overflow-y-auto pointer-events-auto"
          style={{
            background: 'rgba(0,0,0,0.82)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,60,60,0.3)',
            width: 240,
            maxHeight: 'calc(100dvh - 32px)',
          }}
        >
          {/* Header */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-red-400 text-xs font-mono uppercase tracking-widest">Debug</span>
          </div>

          {/* State readout */}
          <div className="rounded-xl p-3 text-xs font-mono" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <p className="text-white/40 mb-1">Current state</p>
            <p className="text-white">
              Stage <span className="text-red-400 font-bold">{stage}</span> / 9
            </p>
            <p className="text-white">{totalMinutes.toFixed(1)} min total</p>
            <p className="text-white">
              {String(Math.floor(elapsedSeconds / 60)).padStart(2, '0')}:
              {String(elapsedSeconds % 60).padStart(2, '0')} session
            </p>
            <p className="text-white/40 mt-1">{isRunning ? '▶ running' : '⏸ stopped'}</p>
          </div>

          {/* Timer controls */}
          <div className="flex gap-2">
            <button
              onClick={isRunning ? pause : start}
              className="flex-1 py-2 rounded-lg text-xs transition-all"
              style={{
                background: isRunning ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.85)',
                color: isRunning ? '#fff' : '#000',
              }}
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

          {/* +1H / -1H */}
          <div>
            <p className="text-white/30 text-xs mb-2 uppercase tracking-widest">Time adjust</p>
            <div className="flex gap-2">
              <button
                onClick={() => debugSetMinutes(Math.max(0, totalMinutes - 60))}
                disabled={totalMinutes === 0}
                className="flex-1 py-2 rounded-lg text-xs text-white/70 transition-all"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  opacity: totalMinutes === 0 ? 0.35 : 1,
                }}
              >
                − 1H
              </button>
              <button
                onClick={() => debugSetMinutes(totalMinutes + 60)}
                className="flex-1 py-2 rounded-lg text-xs text-white/70 transition-all"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              >
                + 1H
              </button>
            </div>
          </div>

          {/* Timelapse */}
          <div>
            <p className="text-white/30 text-xs mb-2 uppercase tracking-widest">Timelapse</p>
            <button
              onClick={handleGenerateTimelapse}
              disabled={genProgress !== null}
              className="w-full py-2 rounded-lg text-xs transition-all"
              style={{
                background: genProgress !== null ? 'rgba(212,175,55,0.08)' : 'rgba(212,175,55,0.18)',
                border: '1px solid rgba(212,175,55,0.4)',
                color: genProgress !== null ? 'rgba(212,175,55,0.5)' : '#d4af37',
                cursor: genProgress !== null ? 'not-allowed' : 'pointer',
              }}
            >
              {genProgress !== null ? `Generating… ${genProgress}%` : 'Generate & Download'}
            </button>
            {genProgress !== null && (
              <div
                className="mt-2 rounded-full overflow-hidden"
                style={{ height: 3, background: 'rgba(255,255,255,0.08)' }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${genProgress}%`,
                    background: '#d4af37',
                    transition: 'width 0.2s',
                  }}
                />
              </div>
            )}
          </div>

          {/* Stage jump */}
          <div>
            <p className="text-white/30 text-xs mb-2 uppercase tracking-widest">Jump to Stage</p>
            <div className="flex flex-col gap-1">
              {STAGE_THRESHOLDS.map((t) => (
                <button
                  key={t.stage}
                  onClick={() => debugSetMinutes(t.minutes)}
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all"
                  style={{
                    background: stage === t.stage ? 'rgba(255,60,60,0.2)' : 'rgba(255,255,255,0.05)',
                    border: stage === t.stage ? '1px solid rgba(255,60,60,0.5)' : '1px solid transparent',
                  }}
                >
                  <span className="text-white/70">Stage {t.stage}</span>
                  <span className="text-white/30 font-mono">
                    {t.minutes === 0 ? '0h' : formatMinutes(t.minutes)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom minutes input */}
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
