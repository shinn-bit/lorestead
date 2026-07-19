import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useDailyProgress } from '../hooks/useDailyProgress';
import { useVisibility } from '../hooks/useVisibility';
import { useClock, formatClock } from '../hooks/useClock';
import { useI18n } from '../i18n/I18nContext';
import { LangToggle } from '../components/LangToggle';
import { GoalPill } from '../components/GoalDate/GoalPill';
import { getStage, getOverallProgress, MAX_STAGE } from '../utils/stageCalculator';
import { getGoal, daysUntil } from '../utils/goalStore';
import { saveDailyRecord, countStudiedDays } from '../utils/dailyRecordStore';
import { WorldPlayer } from '../components/World/WorldPlayer';
import { EndDayModal } from '../components/EndSession/EndDayModal';
import { SetupScreen } from './SetupScreen';
import { MiniPlayer, PiPView } from '../components/MiniPlayer/MiniPlayer';
import { usePictureInPicture } from '../hooks/usePictureInPicture';
import { HomeTour, loadHomeTourSeen } from '../components/HomeTour/HomeTour';
import type { View } from '../App';

const EyeOffIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" y1="2" x2="22" y2="22" /></svg>
);
const ClockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8.5" /><polyline points="12 7 12 12 16 14" /></svg>
);

interface Props {
  onNavigate: (view: View) => void;
}

export function MainPage({ onNavigate }: Props) {
  const { config, startDay, toggleTask, buildDailyRecord, discardDay } = useDailyProgress();
  const { isActive } = useVisibility();
  const clock = useClock();
  const { t } = useI18n();

  const [showEndDay, setShowEndDay]                 = useState(false);
  const [isMini, setIsMini]                         = useState(false);
  const [uiHidden, setUiHidden]                     = useState(false);
  const [showClock, setShowClock]                   = useState(false);
  const [homeTourOpen, setHomeTourOpen]             = useState<boolean>(() => !loadHomeTourSeen());
  const [studiedDays, setStudiedDays]               = useState(0);
  const subscreenBtnRef                             = useRef<HTMLButtonElement>(null);
  const hideBtnRef                                  = useRef<HTMLButtonElement>(null);
  const { pipWindow, isSupported: isPipSupported, open: openPip, close: closePip, isOpen: isPipOpen } = usePictureInPicture(280, 210);

  const effectiveIsActive = isPipOpen || isActive;

  const goal = getGoal();
  const goalDaysLeft = goal ? daysUntil(goal.date) : null;

  useEffect(() => {
    countStudiedDays().then(setStudiedDays).catch(() => {});
  }, []);

  const stage = config ? getStage(config) : 1;

  // ── config 未設定：Setup 画面 ──
  if (!config) {
    return (
      <SetupScreen
        onStartTasks={(labels) => startDay(labels)}
        onNavigate={onNavigate}
      />
    );
  }

  const overallProgress = getOverallProgress(config) * 100;
  const doneCount = config.tasks.filter((t) => t.done).length;
  const totalCount = config.tasks.length;

  async function handleSubScreen() {
    if (isPipOpen) { closePip(); return; }
    if (isMini)    { setIsMini(false); return; }
    if (isPipSupported) {
      const ok = await openPip();
      if (!ok) setIsMini(true);
    } else {
      setIsMini(true);
    }
  }

  /** 今日を確定（記録を保存） */
  async function handleFinalizeDay() {
    const record = buildDailyRecord();
    if (record) {
      await saveDailyRecord(record).catch((e) => console.error('Failed to save daily record', e));
      const n = await countStudiedDays().catch(() => studiedDays);
      setStudiedDays(n);
    }
    return record;
  }

  /** モーダルを閉じ、次の日を始められる状態に戻す */
  function handleBeginNextDay() {
    setShowEndDay(false);
    discardDay();
  }

  if (isMini) {
    return (
      <MiniPlayer
        stage={stage}
        isActive={effectiveIsActive}
        onExpand={() => setIsMini(false)}
      />
    );
  }

  // ── UIを隠す：ループ動画のみ表示。画面クリックで復帰 ──
  if (uiHidden) {
    return (
      <div className="scr-world ui-hidden" onClick={() => setUiHidden(false)}>
        <div className="absolute inset-0" style={{ zIndex: 0 }}>
          <WorldPlayer stage={stage} isActive={effectiveIsActive} />
        </div>
        <div className="hide-hint">{t('hide_ui_hint')}</div>
      </div>
    );
  }

  const worldInactive = !effectiveIsActive;

  return (
    <div className={`scr-world ${worldInactive ? 'inactive' : ''}`}>

      {/* ── World video ── */}
      <div className="absolute inset-0" style={{ zIndex: 0 }}>
        <WorldPlayer stage={stage} isActive={effectiveIsActive} />
      </div>
      <div className="world-glow" />
      <div className="world-base" />

      {/* ── Title ── */}
      <div className="title"><h1>LORESTEAD</h1></div>

      {/* ── Top-right: goal + language + how-to-use + nav ── */}
      <div className="topright">
        <GoalPill />
        <LangToggle />
        <button className="howlink" onClick={() => setHomeTourOpen(true)}>{t('how_to_use')}</button>
        <nav className="nav">
          <button className="active">HOME</button>
          <button onClick={() => onNavigate('history')}>HISTORY</button>
        </nav>
      </div>

      {/* ── Left info ── */}
      <div className="info">
        {showClock && <div className="big-clock">{formatClock(clock)}</div>}
        <div className="info-head">
          <span>{t('medieval_town')}</span>
          <span className="phase">{t('phase_label')} {stage} / {MAX_STAGE}</span>
        </div>
        <div className="progress"><div className="progress-fill" style={{ width: `${overallProgress}%` }} /></div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div className="goal-line">
            {goalDaysLeft === null && t('goal_none_label')}
            {goalDaysLeft !== null && goal && goalDaysLeft > 0 && `${goal.label ? `${goal.label} · ` : ''}${goalDaysLeft} ${t('goal_days_left_suffix')}`}
            {goalDaysLeft !== null && goal && goalDaysLeft === 0 && `${goal.label ? `${goal.label} · ` : ''}${t('goal_today_label')}`}
            {goalDaysLeft !== null && goal && goalDaysLeft < 0 && `${goal.label ? `${goal.label} · ` : ''}${t('goal_overdue_label')}`}
          </div>
          <div className="studied-line">
            {studiedDays} {t('studied_days_suffix')}
          </div>
        </div>

        <div className="view-controls">
          <button
            ref={subscreenBtnRef}
            className={`view-btn ${isPipOpen ? 'on' : ''}`}
            onClick={handleSubScreen}
            title={isPipOpen ? 'Close sub screen' : 'Open as floating sub screen'}
          >
            <span style={{ fontSize: 14, lineHeight: 1 }}>⊡</span>
            <span style={{ whiteSpace: 'nowrap' }}>{isPipOpen ? t('close_sub_screen') : t('sub_screen')}</span>
          </button>
          <button
            className={`view-btn ${showClock ? 'on' : ''}`}
            onClick={() => setShowClock((s) => !s)}
            title={t('clock_label')}
          >
            <ClockIcon />
            <span style={{ whiteSpace: 'nowrap' }}>{t('clock_label')}</span>
          </button>
          <button
            ref={hideBtnRef}
            className="view-btn"
            onClick={() => setUiHidden(true)}
            title={t('hide_ui')}
          >
            <EyeOffIcon />
            <span style={{ whiteSpace: 'nowrap' }}>{t('hide_ui')}</span>
          </button>
        </div>
      </div>

      {/* ── Task ledger ── */}
      <div className="ledger">
        <div className="ledger-head">
          <span>{t('tasks_word')}</span>
          <span className="ledger-count">{doneCount} / {totalCount}</span>
        </div>
        <div className="ledger-rows custom-scrollbar">
          {config.tasks.map((task) => (
            <button
              key={task.id}
              className={`ledger-row ${task.done ? 'done' : ''}`}
              onClick={() => toggleTask(task.id)}
            >
              <span className="ledger-mark" />
              <span className="ledger-label">{task.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Bottom controls ── */}
      <div className="controls">
        <button className="btn-endday" onClick={() => setShowEndDay(true)}>{t('end_session')}</button>
      </div>

      {showEndDay && (
        <EndDayModal
          tasks={config.tasks}
          currentStage={stage}
          isCompleted={stage >= MAX_STAGE}
          onFinalize={handleFinalizeDay}
          onCancel={() => setShowEndDay(false)}
          onBeginNextDay={handleBeginNextDay}
        />
      )}

      {/* Document Picture-in-Picture portal */}
      {isPipOpen && pipWindow && createPortal(
        <PiPView
          stage={stage}
          isActive={effectiveIsActive}
          onClose={closePip}
        />,
        pipWindow.document.body
      )}

      {/* ホーム使い方ツアー：初回は自動表示、以後は「使い方」ボタンから */}
      <HomeTour
        open={homeTourOpen}
        onClose={() => setHomeTourOpen(false)}
        subscreenRef={subscreenBtnRef}
        hideBtnRef={hideBtnRef}
      />
    </div>
  );
}
