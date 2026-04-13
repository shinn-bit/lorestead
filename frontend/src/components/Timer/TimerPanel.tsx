import type { ActivityType } from '../../hooks/useTimer';
import { getCurrentStage, getProgressToNextStage, STAGE_THRESHOLDS } from '../../utils/stageCalculator';

interface Props {
  isRunning: boolean;
  elapsedSeconds: number;
  totalMinutes: number;
  activityType: ActivityType;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onActivityChange: (type: ActivityType) => void;
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function TimerPanel({ isRunning, elapsedSeconds, totalMinutes, onStart, onPause, onReset }: Props) {
  const stage = getCurrentStage(totalMinutes);
  const progress = getProgressToNextStage(totalMinutes);
  const isCompleted = stage >= 9;
  const nextThreshold = STAGE_THRESHOLDS.find((t) => t.stage === stage + 1);

  return (
    <div
      className="flex flex-col gap-4 p-5 rounded-2xl select-none"
      style={{
        background: 'rgba(8,8,12,0.72)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
        width: 260,
      }}
    >
      {/* Drag handle hint */}
      <div className="flex justify-center -mt-1 mb-1 cursor-grab active:cursor-grabbing">
        <div className="w-8 h-1 rounded-full bg-white/15" />
      </div>

      {/* Stage info */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-white/30 uppercase tracking-widest">Prague</span>
        {isCompleted
          ? <span className="text-amber-400">Complete!</span>
          : <span className="text-white/40">Stage {stage} / 9</span>
        }
      </div>

      {/* Progress bar */}
      {!isCompleted && (
        <div>
          <div className="h-[3px] rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-white/50 transition-all duration-1000"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          {nextThreshold && (
            <p className="text-[11px] text-white/25 mt-1 text-right">
              Next stage in {formatMinutes(nextThreshold.minutes - totalMinutes)}
            </p>
          )}
        </div>
      )}

      {/* Session timer */}
      <div className="text-center py-1">
        <p className="text-[42px] font-thin tabular-nums text-white leading-none tracking-tight">
          {formatTime(elapsedSeconds)}
        </p>
        <p className="text-xs text-white/25 mt-2">Total {formatMinutes(totalMinutes)} focused</p>
      </div>

      {/* Start / Pause button */}
      <button
        onClick={isRunning ? onPause : onStart}
        className="w-full py-4 rounded-xl text-base font-medium transition-all active:scale-95"
        style={{
          background: isRunning
            ? 'rgba(255,255,255,0.08)'
            : 'rgba(255,255,255,0.92)',
          color: isRunning ? 'rgba(255,255,255,0.7)' : '#000',
          letterSpacing: '0.05em',
        }}
      >
        {isRunning ? 'Pause' : elapsedSeconds > 0 ? 'Resume' : 'Start'}
      </button>

      {/* Reset (subtle, only when paused and has elapsed) */}
      {!isRunning && elapsedSeconds > 0 && (
        <button
          onClick={onReset}
          className="text-xs text-white/20 hover:text-white/40 transition-colors text-center -mt-2"
        >
          Reset session
        </button>
      )}
    </div>
  );
}
