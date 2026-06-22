import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTimer } from '../hooks/useTimer';
import { useVisibility } from '../hooks/useVisibility';
import { useGrowthConfig } from '../hooks/useGrowthConfig';
import { useI18n } from '../i18n/I18nContext';
import { LangToggle } from '../components/LangToggle';
import { getStage, getOverallProgress, MAX_STAGE } from '../utils/stageCalculator';
import { WorldPlayer } from '../components/World/WorldPlayer';
import type { WorldPlayerHandle } from '../components/World/WorldPlayer';
import { EndSessionModal } from '../components/EndSession/EndSessionModal';
import { SetupScreen } from './SetupScreen';
import { LanguageSelectScreen } from './LanguageSelectScreen';
import { MiniPlayer, PiPView } from '../components/MiniPlayer/MiniPlayer';
import { useFrameCapture } from '../hooks/useFrameCapture';
import { useScreenCapture } from '../hooks/useScreenCapture';
import { usePictureInPicture } from '../hooks/usePictureInPicture';
import { ScreenCapturePrompt } from '../components/ScreenCapture/ScreenCapturePrompt';
import { HomeTour, loadHomeTourSeen } from '../components/HomeTour/HomeTour';
import type { View } from '../App';

function formatTime(seconds: number, showHours = false): string {
  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (showHours || h > 0) {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

const HomeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
);
const ScrollIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v5h5" /><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" /><polyline points="12 7 12 12 15 15" /></svg>
);
const EyeOffIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" y1="2" x2="22" y2="22" /></svg>
);

interface Props {
  onNavigate: (view: View) => void;
}

export function MainPage({ onNavigate }: Props) {
  const { isRunning, elapsedSeconds, totalMinutes, start, pause, reset, resetAll } = useTimer();
  const { isActive } = useVisibility();
  const { config, setTimeMode, setTaskMode, setFreeMode, toggleTask, clearConfig } = useGrowthConfig();
  const { t, langChosen, chooseLang } = useI18n();

  const [showEndSession, setShowEndSession]         = useState(false);
  const [isMini, setIsMini]                         = useState(false);
  const [showScreenPrompt, setShowScreenPrompt]     = useState(false);
  const [uiHidden, setUiHidden]                     = useState(false);
  const [homeTourOpen, setHomeTourOpen]             = useState<boolean>(() => !loadHomeTourSeen());
  const screenPromptShownRef                        = useRef(false);
  const subscreenBtnRef                             = useRef<HTMLButtonElement>(null);
  const hideBtnRef                                  = useRef<HTMLButtonElement>(null);
  const { pipWindow, isSupported: isPipSupported, open: openPip, close: closePip, isOpen: isPipOpen } = usePictureInPicture(280, 210);

  const effectiveIsActive = isPipOpen || isActive;

  const stage                = config ? getStage(config, totalMinutes) : 1;
  const totalAccumulatedTime = Math.floor(totalMinutes * 60);

  const worldRef = useRef<WorldPlayerHandle>(null);
  const { getSessionId, getFrameCount, getLocalFrames, reset: resetFrames } = useFrameCapture({
    worldRef,
    isActive: effectiveIsActive,
    isRunning,
    stage,
  });

  const screenCapture = useScreenCapture({ sessionId: getSessionId(), isRunning });

  useEffect(() => {
    if (isRunning && !screenPromptShownRef.current && !screenCapture.isCapturing) {
      screenPromptShownRef.current = true;
      setShowScreenPrompt(true);
    }
  }, [isRunning, screenCapture.isCapturing]);

  // ── config 未設定：初回のみ言語選択 → Setup 画面 ──
  if (!config) {
    if (!langChosen) {
      return <LanguageSelectScreen onSelect={chooseLang} />;
    }
    return (
      <SetupScreen
        onStartTime={(targetMinutes) => { reset(); setTimeMode(targetMinutes); }}
        onStartTasks={(labels) => { reset(); setTaskMode(labels); }}
        onStartFree={() => { reset(); setFreeMode(); }}
        onNavigate={onNavigate}
      />
    );
  }

  const overallProgress = getOverallProgress(config, totalMinutes) * 100;
  const isTaskMode = config.mode === 'task';

  async function getFramesForTimelapse(): Promise<Blob[]> {
    const screen = await screenCapture.getFrames();
    if (screen.length > 0) return screen;
    return getLocalFrames();
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

  // END SESSION の最後：同じ目標のまま最初の状態に戻してやり直す（設定は保持）
  function handleResume() {
    setShowEndSession(false);
    resetAll();
    resetFrames();
    screenCapture.reset();
    screenPromptShownRef.current = false;
  }

  // END SESSION の最後：進捗を破棄して設定画面へ戻る
  function handleBackToSetup() {
    setShowEndSession(false);
    resetAll();
    resetFrames();
    screenCapture.reset();
    screenPromptShownRef.current = false;
    clearConfig();
  }

  if (isMini) {
    return (
      <MiniPlayer
        stage={stage}
        isRunning={isRunning}
        isActive={effectiveIsActive}
        totalAccumulatedTime={totalAccumulatedTime}
        onTogglePlay={isRunning ? pause : start}
        onExpand={() => setIsMini(false)}
      />
    );
  }

  // ── UIを隠す：ループ動画のみ表示。画面クリックで復帰 ──
  if (uiHidden) {
    return (
      <div className="scr-world ui-hidden" onClick={() => setUiHidden(false)}>
        <div className="absolute inset-0" style={{ zIndex: 0 }}>
          <WorldPlayer ref={worldRef} stage={stage} isActive={effectiveIsActive && isRunning} />
        </div>
        <div className="hide-hint">{t('hide_ui_hint')}</div>
      </div>
    );
  }

  const worldInactive = !isRunning;

  return (
    <div className={`scr-world ${worldInactive ? 'inactive' : ''}`}>

      {/* ── World video ── */}
      <div className="absolute inset-0" style={{ zIndex: 0 }}>
        <WorldPlayer ref={worldRef} stage={stage} isActive={effectiveIsActive && isRunning} />
      </div>
      <div className="world-glow" />
      <div className="world-scrim" />
      <div className="world-base" />
      {worldInactive && <div className="paused-label">{t('paused')}</div>}

      {/* ── Title ── */}
      <div className="title"><h1>LORESTEAD</h1></div>

      {/* ── Top-right: language + how-to-use + nav ── */}
      <div className="topright">
        <LangToggle />
        <button className="howlink" onClick={() => setHomeTourOpen(true)}>{t('how_to_use')}</button>
        <nav className="nav">
          <button className="active"><HomeIcon /> HOME</button>
          <button onClick={() => onNavigate('history')}><ScrollIcon /> HISTORY</button>
        </nav>
      </div>

      {/* ── Left info ── */}
      <div className="info">
        <div className="info-head">
          <span>{t('medieval_town')}</span>
          <span className="phase">{t('phase_label')} {stage} / {MAX_STAGE}</span>
        </div>
        <div className="progress"><div className="progress-fill" style={{ width: `${overallProgress}%` }} /></div>
        <div className="accum">{formatTime(totalAccumulatedTime, true)}</div>
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

      {/* ── Task checklist (task mode) ── */}
      {isTaskMode && (
        <div
          style={{
            position: 'absolute', top: 100, right: 40, zIndex: 10, width: 270,
            maxHeight: 'calc(100dvh - 220px)', display: 'flex', flexDirection: 'column', gap: 8,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Cinzel', serif", fontSize: 12, letterSpacing: '0.15em', color: 'rgba(247,236,216,0.75)', textTransform: 'uppercase' }}>
            <span>{t('tasks_word')}</span>
            <span style={{ color: 'var(--h-ember)' }}>{config.tasks.filter((x) => x.done).length} / {config.tasks.length}</span>
          </div>
          <div className="custom-scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', paddingRight: 2 }}>
            {config.tasks.map((task) => (
              <button
                key={task.id}
                onClick={() => toggleTask(task.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', cursor: 'pointer',
                  background: task.done ? 'rgba(240,164,74,0.14)' : 'rgba(30,19,11,0.6)',
                  border: task.done ? '1px solid rgba(240,164,74,0.5)' : '1px solid rgba(240,164,74,0.16)',
                  borderRadius: 12, padding: '10px 14px', backdropFilter: 'blur(6px)',
                }}
              >
                <span style={{
                  width: 18, height: 18, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, background: task.done ? 'var(--h-ember)' : 'transparent',
                  border: task.done ? 'none' : '1px solid rgba(247,236,216,0.4)', color: '#241307',
                }}>
                  {task.done ? '✓' : ''}
                </span>
                <span style={{
                  fontFamily: 'system-ui, sans-serif', fontSize: 13, lineHeight: 1.3,
                  color: task.done ? 'rgba(247,236,216,0.5)' : 'var(--h-ink)',
                  textDecoration: task.done ? 'line-through' : 'none',
                }}>
                  {task.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Bottom controls ── */}
      <div className="controls">
        <button className={`btn-start ${isRunning ? 'running' : ''}`} onClick={isRunning ? pause : start}>
          {isRunning ? t('pause') : t('start')}
        </button>
        <button className="btn-end" onClick={() => setShowEndSession(true)}>{t('end_session')}</button>
      </div>

      {/* スクリーンキャプチャ：プロンプト */}
      {showScreenPrompt && (
        <ScreenCapturePrompt
          onEnable={async () => { setShowScreenPrompt(false); await screenCapture.start(); }}
          onSkip={() => setShowScreenPrompt(false)}
        />
      )}

      {/* スクリーンキャプチャ：録画中バッジ */}
      {screenCapture.isCapturing && (
        <div
          onClick={screenCapture.stop}
          title="Click to stop screen recording"
          style={{
            position: 'absolute', bottom: 200, left: 40, display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 14px', borderRadius: 9999, background: 'rgba(180,30,30,0.18)',
            border: '1px solid rgba(200,50,50,0.45)', color: 'rgba(255,160,160,0.85)',
            fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase',
            cursor: 'pointer', zIndex: 40,
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#e05555', display: 'inline-block', animation: 'pulse 1.4s infinite' }} />
          REC {screenCapture.frameCount}f · {t('rec_stop')}
        </div>
      )}

      {showEndSession && (
        <EndSessionModal
          mode={config.mode}
          currentStage={stage}
          totalMinutes={totalMinutes}
          sessionSeconds={elapsedSeconds}
          isCompleted={stage >= MAX_STAGE}
          sessionId={getSessionId()}
          frameCount={getFrameCount() + screenCapture.frameCount}
          getLocalFrames={getFramesForTimelapse}
          onCancel={() => setShowEndSession(false)}
          onResume={handleResume}
          onBackToSetup={handleBackToSetup}
        />
      )}

      {/* Document Picture-in-Picture portal */}
      {isPipOpen && pipWindow && createPortal(
        <PiPView
          stage={stage}
          isRunning={isRunning}
          isActive={effectiveIsActive}
          totalAccumulatedTime={totalAccumulatedTime}
          onTogglePlay={isRunning ? pause : start}
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
