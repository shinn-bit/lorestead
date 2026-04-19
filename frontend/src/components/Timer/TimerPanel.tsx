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

const panelStyle: React.CSSProperties = {
  background: 'var(--color-box-bg)',
  backdropFilter: 'blur(24px)',
  border: '1px solid var(--color-gold)',
  borderRadius: '4px',
  width: 270,
  padding: '20px 22px',
  display: 'flex',
  flexDirection: 'column',
  gap: '14px',
  userSelect: 'none',
};

const goldButtonStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 0',
  background: 'transparent',
  border: '1px solid var(--color-gold)',
  borderRadius: '3px',
  color: 'var(--color-gold)',
  fontFamily: 'var(--font-title)',
  fontSize: '0.8rem',
  letterSpacing: '0.18em',
  textTransform: 'uppercase' as const,
  cursor: 'pointer',
  transition: 'background 0.2s, color 0.2s',
};

export function TimerPanel({ isRunning, elapsedSeconds, totalMinutes, onStart, onPause, onReset }: Props) {
  const stage = getCurrentStage(totalMinutes);
  const progress = getProgressToNextStage(totalMinutes);
  const isCompleted = stage >= 9;
  const nextThreshold = STAGE_THRESHOLDS.find((t) => t.stage === stage + 1);

  return (
    <div style={panelStyle}>
      {/* Drag handle */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '-6px', marginBottom: '-4px', cursor: 'grab' }}>
        <div style={{ width: 32, height: 3, borderRadius: 9999, background: 'rgba(201,168,76,0.3)' }} />
      </div>

      {/* World + Stage */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: '0.68rem',
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            color: 'rgba(245,230,200,0.45)',
          }}
        >
          Medieval Town
        </span>
        {isCompleted ? (
          <span style={{ fontFamily: 'var(--font-title)', fontSize: '0.68rem', color: 'var(--color-gold)' }}>
            Complete!
          </span>
        ) : (
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.68rem', color: 'rgba(245,230,200,0.4)', letterSpacing: '0.1em' }}>
            Phase {stage}
          </span>
        )}
      </div>

      {/* Progress bar */}
      {!isCompleted && (
        <div>
          <div
            style={{
              height: 2,
              borderRadius: 9999,
              background: 'rgba(201,168,76,0.18)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                borderRadius: 9999,
                background: 'var(--color-gold)',
                width: `${progress * 100}%`,
                transition: 'width 1s linear',
              }}
            />
          </div>
          {nextThreshold && (
            <p
              style={{
                fontSize: '0.65rem',
                color: 'rgba(245,230,200,0.3)',
                marginTop: 4,
                textAlign: 'right',
                fontFamily: 'var(--font-ui)',
              }}
            >
              Next stage in {formatMinutes(nextThreshold.minutes - totalMinutes)}
            </p>
          )}
        </div>
      )}

      {/* Session elapsed timer */}
      <div style={{ textAlign: 'center', padding: '4px 0 2px' }}>
        <p
          style={{
            fontFamily: 'var(--font-timer)',
            fontSize: '2.8rem',
            fontWeight: 400,
            color: 'var(--color-text)',
            lineHeight: 1,
            letterSpacing: '0.05em',
          }}
        >
          {formatTime(elapsedSeconds)}
        </p>
        <p
          style={{
            fontSize: '0.65rem',
            color: 'rgba(245,230,200,0.3)',
            marginTop: 8,
            fontFamily: 'var(--font-ui)',
            letterSpacing: '0.12em',
          }}
        >
          Total {formatMinutes(totalMinutes)} focused
        </p>
      </div>

      {/* Start / Pause button */}
      <button
        onClick={isRunning ? onPause : onStart}
        style={{
          ...goldButtonStyle,
          ...(isRunning
            ? { background: 'var(--color-gold-dim)', color: 'var(--color-gold)' }
            : {}),
        }}
        onMouseEnter={e => {
          if (!isRunning) (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-gold-dim)';
        }}
        onMouseLeave={e => {
          if (!isRunning) (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
        }}
      >
        {isRunning ? 'Pause' : elapsedSeconds > 0 ? 'Resume' : 'Start'}
      </button>

      {/* Reset (only when paused with elapsed time) */}
      {!isRunning && elapsedSeconds > 0 && (
        <button
          onClick={onReset}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'rgba(245,230,200,0.25)',
            fontSize: '0.68rem',
            fontFamily: 'var(--font-ui)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            textAlign: 'center',
            marginTop: '-6px',
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(245,230,200,0.5)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(245,230,200,0.25)')}
        >
          End session
        </button>
      )}
    </div>
  );
}
