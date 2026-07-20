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
import { isAudioAllowed, setAudioAllowed } from '../utils/audioStore';
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
const MicIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" /><path d="M19 10v1a7 7 0 0 1-14 0v-1" /><line x1="12" y1="18" x2="12" y2="22" /><line x1="8" y1="22" x2="16" y2="22" /></svg>
);
const MicOffIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23" /><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" /><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>
);
const MenuIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="20" y2="17" /></svg>
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
  const [audioOn, setAudioOn]                       = useState<boolean>(() => isAudioAllowed());
  const [homeTourOpen, setHomeTourOpen]             = useState<boolean>(() => !loadHomeTourSeen());
  const [studiedDays, setStudiedDays]               = useState(0);
  const [mobileSheetOpen, setMobileSheetOpen]       = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen]         = useState(false);
  const subscreenBtnRef                             = useRef<HTMLButtonElement>(null);
  const hideBtnRef                                  = useRef<HTMLButtonElement>(null);
  const mobileHandleRef                             = useRef<HTMLButtonElement>(null);
  const mobileMenuBtnRef                            = useRef<HTMLButtonElement>(null);
  const { pipWindow, isSupported: isPipSupported, open: openPip, close: closePip, isOpen: isPipOpen } = usePictureInPicture(280, 210);

  const effectiveIsActive = isPipOpen || isActive;

  const goal = getGoal();
  const goalDaysLeft = goal ? daysUntil(goal.date) : null;

  useEffect(() => {
    countStudiedDays().then(setStudiedDays).catch(() => {});
  }, []);

  const stage = config ? getStage(config) : 1;
  const allDone = !!config && config.tasks.length > 0 && config.tasks.every((task) => task.done);

  // 最後のタスクを終えた瞬間（未完了→全完了への遷移）に「今日を終えますか？」を自動で開く。
  // 復元直後から全完了だった場合（前回モーダルを閉じてリロード等）には開かない。
  const prevAllDoneRef = useRef(allDone);
  useEffect(() => {
    if (allDone && !prevAllDoneRef.current) setShowEndDay(true);
    prevAllDoneRef.current = allDone;
  }, [allDone]);

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

  const goalPrefix = goal?.label ? `${goal.label} · ` : '';
  const goalText =
    goalDaysLeft === null ? t('goal_none_label')
    : goalDaysLeft > 0    ? `${goalPrefix}${goalDaysLeft} ${t('goal_days_left_suffix')}`
    : goalDaysLeft === 0  ? `${goalPrefix}${t('goal_today_label')}`
    :                       `${goalPrefix}${t('goal_overdue_label')}`;

  function toggleAudio() {
    setAudioOn((v) => {
      const next = !v;
      setAudioAllowed(next);
      return next;
    });
  }

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
          <WorldPlayer stage={stage} isActive={effectiveIsActive} audioOn={audioOn} />
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
        <WorldPlayer stage={stage} isActive={effectiveIsActive} audioOn={audioOn} />
      </div>
      <div className="world-glow" />
      <div className="world-base" />

      {/* ── Mobile compact chrome (narrow screens only) ── */}
      <div className="mobile-bar">
        <button ref={mobileMenuBtnRef} className="mobile-icon-btn" onClick={() => setMobileMenuOpen((v) => !v)} aria-label={t('menu_label')}>
          <MenuIcon />
        </button>
        <span className="mobile-brand">LORESTEAD</span>
        <button
          className="mobile-icon-btn"
          onClick={toggleAudio}
          title={audioOn ? t('audio_turn_off') : t('audio_turn_on')}
        >
          {audioOn ? <MicIcon /> : <MicOffIcon />}
        </button>
      </div>

      {mobileMenuOpen && (
        <>
          <div className="mobile-menu-backdrop" onClick={() => setMobileMenuOpen(false)} />
          <div className="mobile-menu-panel">
            <LangToggle />
            <button className="mobile-menu-item" onClick={() => { setMobileMenuOpen(false); setUiHidden(true); }}>{t('hide_ui')}</button>
            <button className="mobile-menu-item" onClick={() => { setHomeTourOpen(true); setMobileMenuOpen(false); }}>{t('how_to_use')}</button>
            <button className="mobile-menu-item" onClick={() => { setMobileMenuOpen(false); onNavigate('history'); }}>HISTORY</button>
          </div>
        </>
      )}

      {/* ── Mobile: goal line + bottom-sheet handle ── */}
      <div className="mobile-foot">
        <div className="mobile-goal">{goalText}</div>
        <button ref={mobileHandleRef} className="mobile-handle" onClick={() => setMobileSheetOpen(true)}>
          <span className="mobile-handle-rule" />
          <span className="mobile-handle-label">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 15 12 9 18 15" /></svg>
            {t('tasks_word')} {doneCount} / {totalCount}
          </span>
          <span className="mobile-handle-rule" />
        </button>
      </div>

      {mobileSheetOpen && (
        <>
          <div className="mobile-sheet-backdrop" onClick={() => setMobileSheetOpen(false)} />
          <div className="mobile-sheet">
            <button className="mobile-sheet-grip" onClick={() => setMobileSheetOpen(false)} aria-label="Close" />
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
            <button className="btn-endday mobile-sheet-endday" onClick={() => { setMobileSheetOpen(false); setShowEndDay(true); }}>
              {t('end_session')}
            </button>
          </div>
        </>
      )}

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
          <div className="goal-line">{goalText}</div>
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
            className={`view-btn view-btn-icon-only ${audioOn ? 'on' : ''}`}
            onClick={toggleAudio}
            title={audioOn ? t('audio_turn_off') : t('audio_turn_on')}
          >
            {audioOn ? <MicIcon /> : <MicOffIcon />}
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
          isCompleted={allDone}
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
        mobileHandleRef={mobileHandleRef}
        mobileMenuRef={mobileMenuBtnRef}
      />
    </div>
  );
}
