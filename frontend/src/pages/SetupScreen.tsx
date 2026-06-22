import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { LangToggle } from '../components/LangToggle';
import type { View } from '../App';
import type { I18nKey } from '../i18n/dict';

interface Props {
  onStartTime: (targetMinutes: number) => void;
  onStartTasks: (labels: string[]) => void;
  onStartFree: () => void;
  onNavigate: (view: View) => void;
}

type WizardView = 'choose' | 'time' | 'task';

const HOUR_PRESETS = [1, 2, 4, 8];
const SETUP_SEEN_KEY = 'lorestead_setup_seen';

const HomeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
);
const ScrollIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v5h5" /><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" /><polyline points="12 7 12 12 15 15" /></svg>
);
const ClockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8.5" /><polyline points="12 7 12 12 16 14" /></svg>
);
const ListIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="3.5 7 5.5 9 9 5.5" /><polyline points="3.5 17 5.5 19 9 15.5" /><line x1="12.5" y1="7" x2="20.5" y2="7" /><line x1="12.5" y1="17" x2="20.5" y2="17" /></svg>
);

function loadSetupSeen(): boolean {
  try { return localStorage.getItem(SETUP_SEEN_KEY) === '1'; } catch { return false; }
}

interface Geom { top: number; left: number; width: number; height: number; popTop: boolean; }

export function SetupScreen({ onStartTime, onStartTasks, onStartFree, onNavigate }: Props) {
  const { t, lang } = useI18n();

  const [view, setView] = useState<WizardView>('choose');
  const [hours, setHours] = useState<number>(2);
  const [tasks, setTasks] = useState<string[]>(['', '', '']);

  // guided tour
  const [tourOpen, setTourOpen] = useState<boolean>(() => !loadSetupSeen());
  const [tourIdx, setTourIdx] = useState(0);
  const [geom, setGeom] = useState<Geom>({ top: 0, left: 0, width: 0, height: 0, popTop: false });

  const pathsRef = useRef<HTMLDivElement>(null);
  const presetsRef = useRef<HTMLDivElement>(null);
  const tasklistRef = useRef<HTMLDivElement>(null);
  const beginTimeRef = useRef<HTMLButtonElement>(null);
  const justStartRef = useRef<HTMLDivElement>(null);

  const TOUR: { view: WizardView; ref: React.RefObject<HTMLElement | null>; key: I18nKey }[] = [
    { view: 'choose', ref: pathsRef, key: 'tour_1' },
    { view: 'time', ref: presetsRef, key: 'tour_2' },
    { view: 'task', ref: tasklistRef, key: 'tour_task' },
    { view: 'time', ref: beginTimeRef, key: 'tour_3' },
    { view: 'choose', ref: justStartRef, key: 'tour_4' },
  ];

  // tour 表示中は対象ステップの view を強制表示する
  const activeView: WizardView = tourOpen ? TOUR[tourIdx].view : view;

  const nonEmptyTasks = tasks.map((s) => s.trim()).filter((s) => s.length > 0);
  function updateTask(i: number, v: string) { setTasks((p) => p.map((x, idx) => (idx === i ? v : x))); }
  function addTask() { setTasks((p) => [...p, '']); }
  function removeTask(i: number) { setTasks((p) => (p.length <= 1 ? p : p.filter((_, idx) => idx !== i))); }

  function beginTime() { onStartTime(Math.round((hours > 0 ? hours : 1) * 60)); }
  function beginTasks() { if (nonEmptyTasks.length > 0) onStartTasks(nonEmptyTasks); }

  // ── tour controls ──
  function openTour() { setTourIdx(0); setTourOpen(true); }
  function closeTour() {
    setTourOpen(false);
    setView('choose');
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
  }, [tourOpen, tourIdx, lang, activeView]);

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

  const hoursLabel = hours > 0 ? hours : 1;
  const stepActive = (n: number) => (activeView === 'choose' ? 1 : 2) >= n;
  const viewCls = (v: WizardView) => `view ${activeView === v ? 'active' : ''} ${tourOpen ? 'no-anim' : ''}`;

  const bottom = geom.top + geom.height;
  const right = geom.left + geom.width;

  return (
    <div className="scr-setup parchment">
      {/* Top bar */}
      <div className="topbar">
        <div className="wordmark">LORE<b>STEAD</b></div>
        <div className="topbar-right">
          <LangToggle />
          <button className="howlink" onClick={openTour}>{t('how_it_works')}</button>
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

        <div className="steps">
          <span className={`dot ${stepActive(1) ? 'on' : ''}`} />
          <span className={`dot ${stepActive(2) ? 'on' : ''}`} />
        </div>

        {/* VIEW 1 · CHOOSE */}
        <section className={viewCls('choose')}>
          <div className="eyebrow">{t('setup_eyebrow')}</div>
          <h1>{t('setup_h1')}</h1>
          <p className="sub">{t('choose_sub')}</p>
          <div className="divider"><span className="line" /><span className="mark">✦</span><span className="line r" /></div>

          <div className="paths" ref={pathsRef}>
            <button className="path" onClick={() => setView('time')}>
              <span className="path-mark"><ClockIcon /></span>
              <span className="path-body">
                <span className="path-h">{t('way_time_h')}</span>
                <span className="path-p">{t('way_time_p')}</span>
              </span>
              <span className="arrow">›</span>
            </button>
            <button className="path" onClick={() => setView('task')}>
              <span className="path-mark"><ListIcon /></span>
              <span className="path-body">
                <span className="path-h">{t('way_task_h')}</span>
                <span className="path-p">{t('way_task_p')}</span>
              </span>
              <span className="arrow">›</span>
            </button>
          </div>

          <div className="juststart" ref={justStartRef}>
            <button onClick={onStartFree}>{t('just_start')}</button>
            <span className="note">{t('just_start_note')}</span>
          </div>
        </section>

        {/* VIEW 2a · TIME */}
        <section className={viewCls('time')}>
          <button className="backlink" onClick={() => setView('choose')}><span className="chev">‹</span> {t('nav_back')}</button>
          <div className="eyebrow">{t('time_step_eyebrow')}</div>
          <h1>{t('time_step_h')}</h1>
          <p className="sub">{t('time_hint')}</p>
          <div className="divider"><span className="line" /><span className="mark">✦</span><span className="line r" /></div>

          <div className="presets" ref={presetsRef}>
            {HOUR_PRESETS.map((h) => (
              <div key={h} className={`preset ${hours === h ? 'active' : ''}`} onClick={() => setHours(h)}>{h}h</div>
            ))}
          </div>
          <div className="custom-row">
            <label>{t('custom')}</label>
            <input type="number" value={hours} min={0.5} max={24} step={0.5} onChange={(e) => setHours(Number(e.target.value))} />
            <span className="unit">{t('hours')}</span>
          </div>
          <button className="begin" ref={beginTimeRef} onClick={beginTime}>{t('begin')} · {hoursLabel}h</button>

          <div className="juststart">
            <button onClick={onStartFree}>{t('just_start')}</button>
            <span className="note">{t('just_start_note')}</span>
          </div>
        </section>

        {/* VIEW 2b · TASKS */}
        <section className={viewCls('task')}>
          <button className="backlink" onClick={() => setView('choose')}><span className="chev">‹</span> {t('nav_back')}</button>
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
          <button className="begin" onClick={beginTasks} disabled={nonEmptyTasks.length === 0}>{t('begin')} · {t('tasks_word')}</button>

          <div className="juststart">
            <button onClick={onStartFree}>{t('just_start')}</button>
            <span className="note">{t('just_start_note')}</span>
          </div>
        </section>
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
