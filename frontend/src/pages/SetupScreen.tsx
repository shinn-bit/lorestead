import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { LangToggle } from '../components/LangToggle';
import { getGoal, setGoal } from '../utils/goalStore';
import type { View } from '../App';
import type { I18nKey } from '../i18n/dict';

interface Props {
  onStartTasks: (labels: string[]) => void;
  onNavigate: (view: View) => void;
}

type WizardView = 'goal' | 'task';

const SETUP_SEEN_KEY = 'lorestead_setup_seen';

const ScrollIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v5h5" /><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" /><polyline points="12 7 12 12 15 15" /></svg>
);
const HomeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
);

function loadSetupSeen(): boolean {
  try { return localStorage.getItem(SETUP_SEEN_KEY) === '1'; } catch { return false; }
}

interface Geom { top: number; left: number; width: number; height: number; popTop: boolean; }

export function SetupScreen({ onStartTasks, onNavigate }: Props) {
  const { t, lang } = useI18n();

  const [view, setView] = useState<WizardView>(() => (getGoal() ? 'task' : 'goal'));
  const [goalDateInput, setGoalDateInput] = useState(() => getGoal()?.date ?? '');
  const [goalLabelInput, setGoalLabelInput] = useState(() => getGoal()?.label ?? '');
  const [tasks, setTasks] = useState<string[]>(['', '', '', '', '']);

  // guided tour（タスク入力に到達した時にだけ開く）
  const [tourOpen, setTourOpen] = useState(false);
  const [tourIdx, setTourIdx] = useState(0);
  const [geom, setGeom] = useState<Geom>({ top: 0, left: 0, width: 0, height: 0, popTop: false });

  const tasklistRef = useRef<HTMLDivElement>(null);
  const beginRef = useRef<HTMLButtonElement>(null);

  const TOUR: { ref: React.RefObject<HTMLElement | null>; key: I18nKey }[] = [
    { ref: tasklistRef, key: 'tour_task' },
    { ref: beginRef, key: 'tour_begin' },
  ];

  const nonEmptyTasks = tasks.map((s) => s.trim()).filter((s) => s.length > 0);
  function updateTask(i: number, v: string) { setTasks((p) => p.map((x, idx) => (idx === i ? v : x))); }
  function addTask() { setTasks((p) => [...p, '']); }
  function removeTask(i: number) { setTasks((p) => (p.length <= 1 ? p : p.filter((_, idx) => idx !== i))); }

  function beginTasks() { if (nonEmptyTasks.length > 0) onStartTasks(nonEmptyTasks); }

  function continueFromGoal() {
    if (goalDateInput) setGoal(goalDateInput, goalLabelInput);
    setView('task');
  }

  function openGoalEditor() {
    setGoalDateInput(getGoal()?.date ?? '');
    setGoalLabelInput(getGoal()?.label ?? '');
    setView('goal');
  }

  // タスク入力画面に着いたら、初回だけツアーを開く
  useEffect(() => {
    if (view === 'task' && !loadSetupSeen()) { setTourIdx(0); setTourOpen(true); }
  }, [view]);

  function openTour() { setTourIdx(0); setTourOpen(true); }
  function closeTour() {
    setTourOpen(false);
    try { localStorage.setItem(SETUP_SEEN_KEY, '1'); } catch { /* ignore */ }
  }
  function nextTour() { setTourIdx((i) => { if (i < TOUR.length - 1) return i + 1; closeTour(); return i; }); }
  function prevTour() { setTourIdx((i) => Math.max(0, i - 1)); }

  // スポットライト位置を計測
  useLayoutEffect(() => {
    if (!tourOpen) return;
    const measure = () => {
      const el = TOUR[tourIdx].ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const pad = 10;
      const top = Math.max(0, r.top - pad);
      const left = Math.max(0, r.left - pad);
      const width = r.right + pad - left;
      const height = r.bottom + pad - top;
      setGeom({ top, left, width, height, popTop: r.top + r.height / 2 > window.innerHeight * 0.52 });
    };
    const id = requestAnimationFrame(measure);
    window.addEventListener('resize', measure);
    return () => { cancelAnimationFrame(id); window.removeEventListener('resize', measure); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourOpen, tourIdx, lang]);

  // キーボード操作
  useEffect(() => {
    if (!tourOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeTour();
      else if (e.key === 'ArrowRight') nextTour();
      else if (e.key === 'ArrowLeft') prevTour();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourOpen, tourIdx]);

  const bottom = geom.top + geom.height;
  const right = geom.left + geom.width;

  return (
    <div className="scr-setup parchment">
      {/* Top bar */}
      <div className="topbar">
        <div className="wordmark">LORE<b>STEAD</b></div>
        <div className="topbar-right">
          <LangToggle />
          {view === 'task' && <button className="howlink" onClick={openGoalEditor}>{t('goal_edit_link')}</button>}
          {view === 'task' && <button className="howlink" onClick={openTour}>{t('how_it_works')}</button>}
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

        {/* VIEW · GOAL DATE (optional, first-run) */}
        {view === 'goal' && (
          <section className="view active">
            <div className="eyebrow">{t('goal_step_eyebrow')}</div>
            <h1>{t('goal_step_h')}</h1>
            <p className="sub">{t('goal_step_p')}</p>
            <div className="divider"><span className="line" /><span className="mark">✦</span><span className="line r" /></div>

            <div className="custom-row">
              <label>{t('goal_input_label')}</label>
              <input type="date" value={goalDateInput} onChange={(e) => setGoalDateInput(e.target.value)} />
            </div>
            <div className="custom-row">
              <label>{t('goal_label_input')}</label>
              <input
                type="text"
                value={goalLabelInput}
                placeholder={t('goal_label_ph')}
                onChange={(e) => setGoalLabelInput(e.target.value)}
                style={{ textAlign: 'left' }}
              />
            </div>
            <button className="begin" onClick={continueFromGoal}>{t('goal_continue')}</button>
          </section>
        )}

        {/* VIEW · TASKS */}
        {view === 'task' && (
          <section className="view active">
            <div className="eyebrow">{t('task_step_eyebrow')}</div>
            <h1>{t('task_step_h')}</h1>
            <p className="sub">{t('task_hint')}</p>
            <div className="divider"><span className="line" /><span className="mark">✦</span><span className="line r" /></div>

            <div className="tasklist" ref={tasklistRef}>
              {tasks.map((task, i) => (
                <div key={i} className="task-row">
                  <span className="num">{i + 1}</span>
                  <input type="text" value={task} placeholder={`${t('task_ph')} ${i + 1}`} onChange={(e) => updateTask(i, e.target.value)} />
                  <button className="rm" onClick={() => removeTask(i)} disabled={tasks.length <= 1}>−</button>
                </div>
              ))}
            </div>
            <button className="addtask" onClick={addTask}>{t('add_task')}</button>
            <button className="begin" ref={beginRef} onClick={beginTasks} disabled={nonEmptyTasks.length === 0}>{t('begin')} · {t('tasks_word')}</button>
          </section>
        )}
      </main>

      {/* Guided tour */}
      {tourOpen && (
        <div className="tour">
          <div className="tour-mask" style={{ top: 0, left: 0, right: 0, height: geom.top }} />
          <div className="tour-mask" style={{ top: bottom, left: 0, right: 0, bottom: 0 }} />
          <div className="tour-mask" style={{ top: geom.top, left: 0, width: geom.left, height: geom.height }} />
          <div className="tour-mask" style={{ top: geom.top, left: right, right: 0, height: geom.height }} />
          <div className="tour-ring" style={{ top: geom.top, left: geom.left, width: geom.width, height: geom.height }} />
          <div className="tour-pop" style={{ top: geom.popTop ? 40 : 'auto', bottom: geom.popTop ? 'auto' : 40 }}>
            <span className="corner tl" /><span className="corner tr" />
            <span className="corner bl" /><span className="corner br" />
            <div className="tour-step">{tourIdx + 1} / {TOUR.length}</div>
            <p className="tour-text" dangerouslySetInnerHTML={{ __html: t(TOUR[tourIdx].key) }} />
            <div className="tour-actions">
              <button className="tour-btn" onClick={closeTour}>{t('tour_skip')}</button>
              <span className="grow" />
              <button className="tour-btn" onClick={prevTour} style={{ visibility: tourIdx === 0 ? 'hidden' : 'visible' }}>{t('tour_back')}</button>
              <button className="tour-btn tour-next" onClick={nextTour}>{tourIdx === TOUR.length - 1 ? t('tour_done') : t('tour_next')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
