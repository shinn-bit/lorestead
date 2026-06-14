import { useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { LangToggle } from '../components/LangToggle';
import type { View } from '../App';

interface Props {
  onStartTime: (targetMinutes: number) => void;
  onStartTasks: (labels: string[]) => void;
  onStartFree: () => void;
  onNavigate: (view: View) => void;
}

type Tab = 'time' | 'task';

const HOUR_PRESETS = [1, 2, 4, 8];
const SETUP_SEEN_KEY = 'lorestead_setup_seen';

const HomeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
);
const ScrollIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v5h5" /><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" /><polyline points="12 7 12 12 15 15" /></svg>
);

function loadSetupSeen(): boolean {
  try { return localStorage.getItem(SETUP_SEEN_KEY) === '1'; } catch { return false; }
}

export function SetupScreen({ onStartTime, onStartTasks, onStartFree, onNavigate }: Props) {
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>('time');
  const [hours, setHours] = useState<number>(2);
  const [tasks, setTasks] = useState<string[]>(['', '', '']);
  const [explainOpen, setExplainOpen] = useState<boolean>(() => !loadSetupSeen());

  const nonEmptyTasks = tasks.map((s) => s.trim()).filter((s) => s.length > 0);

  function updateTask(i: number, v: string) { setTasks((p) => p.map((x, idx) => (idx === i ? v : x))); }
  function addTask() { setTasks((p) => [...p, '']); }
  function removeTask(i: number) { setTasks((p) => (p.length <= 1 ? p : p.filter((_, idx) => idx !== i))); }

  function beginTime() { onStartTime(Math.round((hours > 0 ? hours : 1) * 60)); }
  function beginTasks() { if (nonEmptyTasks.length > 0) onStartTasks(nonEmptyTasks); }

  function closeExplain() {
    setExplainOpen(false);
    try { localStorage.setItem(SETUP_SEEN_KEY, '1'); } catch { /* ignore */ }
  }
  function chooseWay(go: 'time' | 'task' | 'free') {
    if (go === 'task') setTab('task');
    else setTab('time');
    closeExplain();
  }

  const hoursLabel = hours > 0 ? hours : 1;

  return (
    <div className="scr-setup parchment">
      {/* Top bar */}
      <div className="topbar">
        <div className="wordmark">LORE<b>STEAD</b></div>
        <div className="topbar-right">
          <LangToggle />
          <button className="howlink" onClick={() => setExplainOpen(true)}>{t('how_it_works')}</button>
          <nav className="nav">
            <button className="active"><HomeIcon /> Home</button>
            <button onClick={() => onNavigate('history')}><ScrollIcon /> Chronicle</button>
          </nav>
        </div>
      </div>

      {/* Manuscript */}
      <main className="page">
        <span className="corner tl" /><span className="corner tr" />
        <span className="corner bl" /><span className="corner br" />

        <div className="eyebrow">{t('setup_eyebrow')}</div>
        <h1>{t('setup_h1')}</h1>
        <p className="sub">{t('setup_sub')}</p>

        <div className="divider"><span className="line" /><span className="mark">✦</span><span className="line r" /></div>

        <div className="tabs">
          <button className={`tab ${tab === 'time' ? 'active' : ''}`} onClick={() => setTab('time')}>{t('tab_time')}</button>
          <button className={`tab ${tab === 'task' ? 'active' : ''}`} onClick={() => setTab('task')}>{t('tab_task')}</button>
        </div>

        {/* TIME */}
        <div className={`mode ${tab === 'time' ? '' : 'hidden'}`}>
          <p className="hint">{t('time_hint')}</p>
          <div className="presets">
            {HOUR_PRESETS.map((h) => (
              <div key={h} className={`preset ${hours === h ? 'active' : ''}`} onClick={() => setHours(h)}>{h}h</div>
            ))}
          </div>
          <div className="custom-row">
            <label>{t('custom')}</label>
            <input type="number" value={hours} min={0.5} max={24} step={0.5} onChange={(e) => setHours(Number(e.target.value))} />
            <span className="unit">{t('hours')}</span>
          </div>
          <button className="begin" onClick={beginTime}>{t('begin')} · {hoursLabel}h</button>
        </div>

        {/* TASKS */}
        <div className={`mode ${tab === 'task' ? '' : 'hidden'}`}>
          <p className="hint">{t('task_hint')}</p>
          <div className="tasklist">
            {tasks.map((task, i) => (
              <div key={i} className="task-row">
                <span className="num">{i + 1}</span>
                <input
                  type="text"
                  value={task}
                  placeholder={`${t('task_ph')} ${i + 1}`}
                  onChange={(e) => updateTask(i, e.target.value)}
                />
                <button className="rm" onClick={() => removeTask(i)} disabled={tasks.length <= 1}>−</button>
              </div>
            ))}
          </div>
          <button className="addtask" onClick={addTask}>{t('add_task')}</button>
          <button className="begin" onClick={beginTasks} disabled={nonEmptyTasks.length === 0}>
            {t('begin')} · {t('tasks_word')}
          </button>
        </div>

        <div className="juststart">
          <button onClick={onStartFree}>{t('just_start')}</button>
          <span className="note">{t('just_start_note')}</span>
        </div>
      </main>

      {/* First-run explanation */}
      {explainOpen && (
        <div className="explain" onClick={(e) => { if (e.target === e.currentTarget) closeExplain(); }}>
          <div className="explain-card">
            <span className="corner tl" /><span className="corner tr" />
            <span className="corner bl" /><span className="corner br" />
            <div className="explain-eyebrow">{t('explain_eyebrow')}</div>
            <h2>{t('explain_h2')}</h2>
            <p className="explain-lead">{t('explain_lead')}</p>
            <div className="explain-divider"><span className="line" /><span className="mark">✦</span><span className="line r" /></div>
            <div className="ways">
              <div className="way" onClick={() => chooseWay('time')}>
                <span className="way-mark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8.5" /><polyline points="12 7 12 12 16 14" /></svg></span>
                <div className="way-body">
                  <div className="way-h"><span>{t('way_time_h')}</span> <span className="arrow">›</span></div>
                  <p>{t('way_time_p')}</p>
                </div>
              </div>
              <div className="way" onClick={() => chooseWay('task')}>
                <span className="way-mark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="3.5 7 5.5 9 9 5.5" /><polyline points="3.5 17 5.5 19 9 15.5" /><line x1="12.5" y1="7" x2="20.5" y2="7" /><line x1="12.5" y1="17" x2="20.5" y2="17" /></svg></span>
                <div className="way-body">
                  <div className="way-h"><span>{t('way_task_h')}</span> <span className="arrow">›</span></div>
                  <p>{t('way_task_p')}</p>
                </div>
              </div>
              <div className="way" onClick={() => chooseWay('free')}>
                <span className="way-mark"><svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M13 2 4 14 11 14 10 22 20 9 13 9 13 2Z" /></svg></span>
                <div className="way-body">
                  <div className="way-h"><span>{t('way_free_h')}</span> <span className="arrow">›</span></div>
                  <p>{t('way_free_p')}</p>
                </div>
              </div>
            </div>
            <button className="explain-begin" onClick={closeExplain}>{t('explain_begin')}</button>
          </div>
        </div>
      )}
    </div>
  );
}
