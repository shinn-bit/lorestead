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

const ACTIVITY_LABELS: Record<ActivityType, string> = {
  study: 'Study',
  work: 'Work',
  creative: 'Creative',
  other: 'Other',
};

const ACTIVITY_TYPES: ActivityType[] = ['study', 'work', 'creative', 'other'];

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

export function TimerPanel({
  isRunning,
  elapsedSeconds,
  totalMinutes,
  activityType,
  onStart,
  onPause,
  onReset,
  onActivityChange,
}: Props) {
  const stage = getCurrentStage(totalMinutes);
  const progress = getProgressToNextStage(totalMinutes);
  const isCompleted = stage >= 9;
  const nextThreshold = STAGE_THRESHOLDS.find((t) => t.stage === stage + 1);

  return (
    <div
      className="flex flex-col gap-4 p-6 rounded-2xl"
      style={{
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.1)',
        minWidth: 280,
      }}
    >
      {/* Stage badge */}
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest text-white/40">Prague</span>
        <span className="text-xs text-white/60">
          Stage {stage} / 9
        </span>
      </div>

      {/* Stage progress bar */}
      {!isCompleted && (
        <div>
          <div className="h-1 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-white/60 transition-all duration-1000"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          {nextThreshold && (
            <p className="text-xs text-white/30 mt-1 text-right">
              Next: {formatMinutes(nextThreshold.minutes - totalMinutes)} left
            </p>
          )}
        </div>
      )}

      {isCompleted && (
        <p className="text-xs text-amber-400 tracking-wider text-center">City Complete!</p>
      )}

      {/* Session timer */}
      <div className="text-center">
        <p className="text-5xl font-light tabular-nums text-white tracking-tight">
          {formatTime(elapsedSeconds)}
        </p>
        <p className="text-xs text-white/40 mt-1">Total: {formatMinutes(totalMinutes)}</p>
      </div>

      {/* Activity type */}
      <div className="flex gap-2 justify-center flex-wrap">
        {ACTIVITY_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => onActivityChange(type)}
            className="px-3 py-1 rounded-full text-xs transition-all"
            style={{
              background: activityType === type ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)',
              color: activityType === type ? '#fff' : 'rgba(255,255,255,0.4)',
              border: activityType === type ? '1px solid rgba(255,255,255,0.3)' : '1px solid transparent',
            }}
          >
            {ACTIVITY_LABELS[type]}
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex gap-3 justify-center">
        <button
          onClick={isRunning ? onPause : onStart}
          className="flex-1 py-3 rounded-xl text-sm font-medium transition-all"
          style={{
            background: isRunning ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.9)',
            color: isRunning ? '#fff' : '#000',
          }}
        >
          {isRunning ? 'Pause' : elapsedSeconds > 0 ? 'Resume' : 'Start'}
        </button>
        {elapsedSeconds > 0 && (
          <button
            onClick={onReset}
            className="px-4 py-3 rounded-xl text-sm text-white/40 transition-all"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
