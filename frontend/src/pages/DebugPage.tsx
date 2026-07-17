import { useState, useEffect } from 'react';
import { getStageByTasks, MAX_STAGE } from '../utils/stageCalculator';
import { WorldPlayer } from '../components/World/WorldPlayer';
import { getGoal, setGoal, clearGoal, daysUntil, type Goal } from '../utils/goalStore';
import { listDailyRecords, clearDailyRecords, type DailyRecord } from '../utils/dailyRecordStore';

const DEBUG_TASK_TOTAL = 5;

export function DebugPage() {
  const [doneCount, setDoneCount] = useState(0);
  const stage = getStageByTasks(doneCount, DEBUG_TASK_TOTAL);

  const [goal, setGoalState] = useState<Goal | null>(() => getGoal());
  const [records, setRecords] = useState<DailyRecord[]>([]);

  function refreshRecords() {
    listDailyRecords().then(setRecords).catch(() => {});
  }

  useEffect(() => { refreshRecords(); }, []);

  function bumpGoal(days: number) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    const str = d.toISOString().slice(0, 10);
    setGoal(str, 'Debug Goal');
    setGoalState({ date: str, label: 'Debug Goal' });
  }

  function handleClearGoal() {
    clearGoal();
    setGoalState(null);
  }

  async function handleClearRecords() {
    await clearDailyRecords();
    refreshRecords();
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
            width: 260,
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
              Stage <span className="text-red-400 font-bold">{stage}</span> / {MAX_STAGE}
            </p>
            <p className="text-white">Tasks {doneCount} / {DEBUG_TASK_TOTAL}</p>
          </div>

          {/* Task done-count jump */}
          <div>
            <p className="text-white/30 text-xs mb-2 uppercase tracking-widest">Tasks done</p>
            <div className="flex gap-1">
              {Array.from({ length: DEBUG_TASK_TOTAL + 1 }, (_, i) => i).map((n) => (
                <button
                  key={n}
                  onClick={() => setDoneCount(n)}
                  className="flex-1 py-2 rounded-lg text-xs transition-all"
                  style={{
                    background: doneCount === n ? 'rgba(255,60,60,0.25)' : 'rgba(255,255,255,0.06)',
                    border: doneCount === n ? '1px solid rgba(255,60,60,0.5)' : '1px solid transparent',
                    color: '#fff',
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Stage jump */}
          <div>
            <p className="text-white/30 text-xs mb-2 uppercase tracking-widest">Jump to Stage</p>
            <div className="flex flex-col gap-1">
              {Array.from({ length: MAX_STAGE }, (_, i) => i + 1).map((s) => {
                const n = s === 1 ? 0 : Math.round(((s - 1) / (MAX_STAGE - 1)) * DEBUG_TASK_TOTAL);
                return (
                  <button
                    key={s}
                    onClick={() => setDoneCount(n)}
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all"
                    style={{
                      background: stage === s ? 'rgba(255,60,60,0.2)' : 'rgba(255,255,255,0.05)',
                      border: stage === s ? '1px solid rgba(255,60,60,0.5)' : '1px solid transparent',
                    }}
                  >
                    <span className="text-white/70">Stage {s}</span>
                    <span className="text-white/30 font-mono">{n}/{DEBUG_TASK_TOTAL}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Goal date */}
          <div>
            <p className="text-white/30 text-xs mb-2 uppercase tracking-widest">Goal date</p>
            <p className="text-white text-xs font-mono mb-2">
              {goal ? `${goal.label} · ${goal.date}` : '(none)'} {goal && `· ${daysUntil(goal.date)}d`}
            </p>
            <div className="flex gap-2">
              <button onClick={() => bumpGoal(7)} className="flex-1 py-2 rounded-lg text-xs text-white/70" style={{ background: 'rgba(255,255,255,0.06)' }}>+7d</button>
              <button onClick={() => bumpGoal(30)} className="flex-1 py-2 rounded-lg text-xs text-white/70" style={{ background: 'rgba(255,255,255,0.06)' }}>+30d</button>
              <button onClick={handleClearGoal} className="flex-1 py-2 rounded-lg text-xs text-white/40" style={{ background: 'rgba(255,255,255,0.06)' }}>Clear</button>
            </div>
          </div>

          {/* Daily records */}
          <div>
            <p className="text-white/30 text-xs mb-2 uppercase tracking-widest">Daily records ({records.length})</p>
            <div className="flex flex-col gap-1 mb-2" style={{ maxHeight: 140, overflowY: 'auto' }}>
              {records.map((r) => (
                <div key={r.id} className="text-white/60 text-xs font-mono px-2 py-1 rounded" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  {r.date} · stage {r.stage} · {r.isCompleted ? 'done' : 'partial'} · {r.studied ? 'studied' : '-'}
                </div>
              ))}
              {records.length === 0 && <p className="text-white/20 text-xs">(empty)</p>}
            </div>
            <div className="flex gap-2">
              <button onClick={refreshRecords} className="flex-1 py-2 rounded-lg text-xs text-white/70" style={{ background: 'rgba(255,255,255,0.06)' }}>Refresh</button>
              <button onClick={handleClearRecords} className="flex-1 py-2 rounded-lg text-xs text-red-300" style={{ background: 'rgba(180,30,30,0.15)' }}>Clear all</button>
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
