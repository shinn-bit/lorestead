import { useState } from 'react';

interface Props {
  onStartTime: (targetMinutes: number) => void;
  onStartTasks: (labels: string[]) => void;
  onStartFree: () => void;
}

type Tab = 'time' | 'task';

const HOUR_PRESETS = [1, 2, 4, 8];

const goldBtn: React.CSSProperties = {
  background: 'rgba(212,175,55,0.15)',
  border: '1px solid rgba(212,175,55,0.6)',
  color: '#f5e6d3',
  fontFamily: "'Cinzel', serif",
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  borderRadius: 9999,
  cursor: 'pointer',
  transition: 'all 0.2s',
};

export function SetupScreen({ onStartTime, onStartTasks, onStartFree }: Props) {
  const [tab, setTab] = useState<Tab>('time');

  // time モード
  const [hours, setHours] = useState<number>(2);

  // task モード
  const [tasks, setTasks] = useState<string[]>(['', '', '']);

  const nonEmptyTasks = tasks.map((t) => t.trim()).filter((t) => t.length > 0);

  function updateTask(i: number, value: string) {
    setTasks((prev) => prev.map((t, idx) => (idx === i ? value : t)));
  }
  function addTask() {
    setTasks((prev) => [...prev, '']);
  }
  function removeTask(i: number) {
    setTasks((prev) => (prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== i)));
  }

  function beginTime() {
    const h = Number.isFinite(hours) && hours > 0 ? hours : 1;
    onStartTime(Math.round(h * 60));
  }
  function beginTasks() {
    if (nonEmptyTasks.length === 0) return;
    onStartTasks(nonEmptyTasks);
  }

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center"
      style={{ background: 'rgba(15,17,20,0.92)', zIndex: 20 }}
    >
      <div
        className="flex flex-col gap-7"
        style={{ width: 'min(92vw, 460px)', maxHeight: '88vh', overflowY: 'auto' }}
      >
        {/* タイトル */}
        <div className="flex flex-col items-center gap-2">
          <h2
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: 22,
              letterSpacing: '0.18em',
              color: '#f5e6d3',
              textTransform: 'uppercase',
            }}
          >
            How will your world grow?
          </h2>
          <p style={{ fontFamily: 'sans-serif', fontSize: 13, color: 'rgba(245,230,211,0.45)', letterSpacing: '0.04em' }}>
            Choose a goal — the town grows as you progress.
          </p>
        </div>

        {/* モードタブ */}
        <div className="flex gap-2">
          {(['time', 'task'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1,
                padding: '12px 0',
                borderRadius: 14,
                cursor: 'pointer',
                fontFamily: "'Cinzel', serif",
                fontSize: 13,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                transition: 'all 0.2s',
                background: tab === t ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)',
                border: tab === t ? '1px solid rgba(212,175,55,0.55)' : '1px solid rgba(255,255,255,0.08)',
                color: tab === t ? '#f5e6d3' : 'rgba(245,230,211,0.5)',
              }}
            >
              {t === 'time' ? 'By Time' : 'By Tasks'}
            </button>
          ))}
        </div>

        {/* ── Time モード ── */}
        {tab === 'time' && (
          <div className="flex flex-col gap-5">
            <p style={{ fontFamily: 'sans-serif', fontSize: 12, color: 'rgba(245,230,211,0.4)', letterSpacing: '0.05em', textAlign: 'center' }}>
              Your goal time is split into 5 stages. Reach it to complete the town.
            </p>

            {/* プリセット */}
            <div className="flex gap-2">
              {HOUR_PRESETS.map((h) => (
                <button
                  key={h}
                  onClick={() => setHours(h)}
                  style={{
                    flex: 1,
                    padding: '12px 0',
                    borderRadius: 12,
                    cursor: 'pointer',
                    fontFamily: "'Cinzel', serif",
                    fontSize: 14,
                    transition: 'all 0.2s',
                    background: hours === h ? 'rgba(212,175,55,0.18)' : 'rgba(255,255,255,0.04)',
                    border: hours === h ? '1px solid rgba(212,175,55,0.55)' : '1px solid rgba(255,255,255,0.08)',
                    color: hours === h ? '#f5e6d3' : 'rgba(245,230,211,0.55)',
                  }}
                >
                  {h}h
                </button>
              ))}
            </div>

            {/* カスタム */}
            <div className="flex items-center gap-3">
              <span style={{ fontFamily: 'sans-serif', fontSize: 12, color: 'rgba(245,230,211,0.4)', letterSpacing: '0.05em' }}>
                Custom
              </span>
              <input
                type="number"
                min={0.5}
                max={24}
                step={0.5}
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
                className="flex-1 min-w-0"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  color: '#f5e6d3',
                  fontFamily: "'Cinzel', serif",
                  fontSize: 14,
                  outline: 'none',
                }}
              />
              <span style={{ fontFamily: 'sans-serif', fontSize: 12, color: 'rgba(245,230,211,0.4)' }}>hours</span>
            </div>

            <button onClick={beginTime} style={{ ...goldBtn, padding: '15px 0', fontSize: 14 }}>
              Begin · {hours > 0 ? hours : 1}h
            </button>
          </div>
        )}

        {/* ── Task モード ── */}
        {tab === 'task' && (
          <div className="flex flex-col gap-4">
            <p style={{ fontFamily: 'sans-serif', fontSize: 12, color: 'rgba(245,230,211,0.4)', letterSpacing: '0.05em', textAlign: 'center' }}>
              List what you'll do. Completing them all builds the whole town.
            </p>

            <div className="flex flex-col gap-2">
              {tasks.map((t, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span style={{ fontFamily: "'Cinzel', serif", fontSize: 12, color: 'rgba(212,175,55,0.6)', width: 18 }}>
                    {i + 1}
                  </span>
                  <input
                    type="text"
                    value={t}
                    placeholder={`Task ${i + 1}`}
                    onChange={(e) => updateTask(i, e.target.value)}
                    className="flex-1 min-w-0"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 10,
                      padding: '10px 14px',
                      color: '#f5e6d3',
                      fontFamily: 'sans-serif',
                      fontSize: 14,
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={() => removeTask(i)}
                    disabled={tasks.length <= 1}
                    title="Remove"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: 'rgba(245,230,211,0.4)',
                      cursor: tasks.length <= 1 ? 'not-allowed' : 'pointer',
                      opacity: tasks.length <= 1 ? 0.3 : 1,
                      flexShrink: 0,
                    }}
                  >
                    −
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={addTask}
              style={{
                alignSelf: 'flex-start',
                background: 'transparent',
                border: 'none',
                color: 'rgba(212,175,55,0.7)',
                fontFamily: "'Cinzel', serif",
                fontSize: 12,
                letterSpacing: '0.1em',
                cursor: 'pointer',
                padding: '2px 0',
              }}
            >
              + Add task
            </button>

            <button
              onClick={beginTasks}
              disabled={nonEmptyTasks.length === 0}
              style={{
                ...goldBtn,
                padding: '15px 0',
                fontSize: 14,
                opacity: nonEmptyTasks.length === 0 ? 0.35 : 1,
                cursor: nonEmptyTasks.length === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              Begin · {nonEmptyTasks.length} task{nonEmptyTasks.length === 1 ? '' : 's'}
            </button>
          </div>
        )}

        {/* ── Just Start（free モード） ── */}
        <div className="flex flex-col items-center gap-1" style={{ marginTop: 4 }}>
          <button
            onClick={onStartFree}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(245,230,211,0.4)',
              fontFamily: "'Cinzel', serif",
              fontSize: 12,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Just start →
          </button>
          <span style={{ fontFamily: 'sans-serif', fontSize: 11, color: 'rgba(245,230,211,0.25)' }}>
            No goal · grows every hour
          </span>
        </div>
      </div>
    </div>
  );
}
