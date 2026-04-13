import { STAGE_THRESHOLDS } from '../../utils/stageCalculator';

interface Props {
  totalMinutes: number;
  onSetMinutes: (minutes: number) => void;
  onClose: () => void;
}

export function DebugPanel({ totalMinutes, onSetMinutes, onClose }: Props) {
  return (
    <div
      className="fixed top-4 right-4 z-50 flex flex-col gap-3 p-4 rounded-2xl text-sm"
      style={{
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,80,80,0.4)',
        minWidth: 220,
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-red-400 text-xs font-mono uppercase tracking-widest">Debug</span>
        <button onClick={onClose} className="text-white/30 hover:text-white text-xs">✕</button>
      </div>

      <div>
        <p className="text-white/40 text-xs mb-2">Current: {totalMinutes.toFixed(1)} min</p>
        <div className="flex flex-col gap-1">
          {STAGE_THRESHOLDS.map((t) => (
            <button
              key={t.stage}
              onClick={() => onSetMinutes(t.minutes)}
              className="flex items-center justify-between px-3 py-1.5 rounded-lg text-left transition-all"
              style={{
                background:
                  totalMinutes >= t.minutes &&
                  (t.stage === 9 || totalMinutes < (STAGE_THRESHOLDS[t.stage]?.minutes ?? Infinity))
                    ? 'rgba(255,80,80,0.2)'
                    : 'rgba(255,255,255,0.06)',
                border:
                  totalMinutes >= t.minutes &&
                  (t.stage === 9 || totalMinutes < (STAGE_THRESHOLDS[t.stage]?.minutes ?? Infinity))
                    ? '1px solid rgba(255,80,80,0.4)'
                    : '1px solid transparent',
              }}
            >
              <span className="text-white/70">Stage {t.stage}</span>
              <span className="text-white/30 font-mono text-xs">
                {t.minutes === 0 ? '0h' : `${t.minutes / 60}h`}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-white/40 text-xs mb-1">Set custom minutes</p>
        <input
          type="number"
          min={0}
          max={1200}
          defaultValue={Math.floor(totalMinutes)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onSetMinutes(Number((e.target as HTMLInputElement).value));
            }
          }}
          className="w-full px-3 py-1.5 rounded-lg text-xs text-white font-mono"
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.1)',
            outline: 'none',
          }}
          placeholder="minutes (Enter to apply)"
        />
      </div>
    </div>
  );
}
