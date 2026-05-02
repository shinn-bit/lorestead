import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTimer } from '../hooks/useTimer';
import { useVisibility } from '../hooks/useVisibility';
import { useAuth } from '../context/AuthContext';
import { getCurrentStage } from '../utils/stageCalculator';
import { WorldPlayer } from '../components/World/WorldPlayer';
import type { WorldPlayerHandle } from '../components/World/WorldPlayer';
import type { HistoryItem } from './HistoryPage';
import { AuthModal } from '../components/Auth/AuthModal';
import { EndSessionModal } from '../components/EndSession/EndSessionModal';
import { MiniPlayer, PiPView } from '../components/MiniPlayer/MiniPlayer';
import { useFrameCapture } from '../hooks/useFrameCapture';
import { useScreenCapture } from '../hooks/useScreenCapture';
import { usePictureInPicture } from '../hooks/usePictureInPicture';
import { ScreenCapturePrompt } from '../components/ScreenCapture/ScreenCapturePrompt';
import { Button } from '../App';

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

// 変更点：名前が変わる機能を無くしたため、hoursだけのシンプルな配列に変更
const WORLD_PHASES = [
  { hours: 0 },
  { hours: 1 },
  { hours: 3 },
  { hours: 5 },
  { hours: 8 },
  { hours: 12 },
  { hours: 16 },
  { hours: 20 },
];

const ACTIVE_PRESETS = [25, 45, 60, 90];
const REST_PRESETS   = [5, 10, 15];

interface Props {
  resumeMinutes: number | null;
  onResumeHandled: () => void;
  onAddHistory: (item: HistoryItem) => void;
}

export function MainPage({ resumeMinutes, onResumeHandled, onAddHistory }: Props) {
  const { isRunning, elapsedSeconds, totalMinutes, start, pause, reset, resetAll, debugSetMinutes } = useTimer();
  const { isActive } = useVisibility();
  const { isLoggedIn, accessToken, signOut, syncProgress } = useAuth();
  const [showAuth, setShowAuth]                     = useState(false);
  const [showEndSession, setShowEndSession]         = useState(false);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [isMini, setIsMini]                         = useState(false);
  const [showScreenPrompt, setShowScreenPrompt]     = useState(false);
  const screenPromptShownRef                        = useRef(false);
  const { pipWindow, isSupported: isPipSupported, open: openPip, close: closePip, isOpen: isPipOpen } = usePictureInPicture(280, 210);

  // History画面からのResume
  useEffect(() => {
    if (resumeMinutes !== null) {
      debugSetMinutes(resumeMinutes);
      onResumeHandled();
    }
  }, [resumeMinutes, debugSetMinutes, onResumeHandled]);

  // PiP表示中は他のタブで作業しながらでもアクティブ扱いにする
  const effectiveIsActive = isPipOpen || isActive;

  const stage                = getCurrentStage(totalMinutes);
  const totalAccumulatedTime = Math.floor(totalMinutes * 60);

  const worldRef = useRef<WorldPlayerHandle>(null);
  const { getSessionId, getFrameCount, getLocalFrames, reset: resetFrames } = useFrameCapture({
    worldRef,
    isActive: effectiveIsActive,
    isRunning,
    stage,
    accessToken,
  });

  const screenCapture = useScreenCapture({ sessionId: getSessionId(), isRunning });

  // 初回START時にスクリーンキャプチャのプロンプトを表示
  useEffect(() => {
    if (isRunning && !screenPromptShownRef.current && !screenCapture.isCapturing) {
      screenPromptShownRef.current = true;
      setShowScreenPrompt(true);
    }
  }, [isRunning, screenCapture.isCapturing]);

  // タイムラプス生成用：スクリーンフレーム優先、なければワールドフレーム
  async function getFramesForTimelapse(): Promise<Blob[]> {
    const screen = await screenCapture.getFrames();
    if (screen.length > 0) return screen;
    return getLocalFrames();
  }

  const currentPhaseIndex = WORLD_PHASES.reduce((acc, phase, index) =>
    (totalAccumulatedTime / 3600) >= phase.hours ? index : acc, 0
  );
  
  const currentPhase  = WORLD_PHASES[currentPhaseIndex];
  const nextPhase     = WORLD_PHASES[currentPhaseIndex + 1] || currentPhase;
  const phaseProgress = currentPhase === nextPhase ? 100 :
    (((totalAccumulatedTime / 3600) - currentPhase.hours) / (nextPhase.hours - currentPhase.hours)) * 100;

  // Pomodoro
  const [sessionType,     setSessionType]     = useState<'ACTIVE' | 'REST'>('ACTIVE');
  const [sessionTimeLeft, setSessionTimeLeft] = useState(25 * 60);
  const [isSessionActive, setIsSessionActive] = useState(false);

  const resetSessionTimer = (minutes: number) => {
    setIsSessionActive(false);
    setSessionTimeLeft(minutes * 60);
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isSessionActive && sessionTimeLeft > 0) {
      interval = setInterval(() => setSessionTimeLeft(t => t - 1), 1000);
    } else if (sessionTimeLeft === 0) {
      setIsSessionActive(false);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isSessionActive, sessionTimeLeft]);

  const prevRunning = useRef(false);
  useEffect(() => {
    if (prevRunning.current && !isRunning && elapsedSeconds > 0) {
      syncProgress(elapsedSeconds / 60).catch(() => {});
    }
    prevRunning.current = isRunning;
  }, [isRunning, elapsedSeconds, syncProgress]);

  async function handleSubScreen() {
    if (isPipOpen) { closePip(); return; }
    if (isMini)    { setIsMini(false); return; }
    if (isPipSupported) {
      const ok = await openPip();
      if (!ok) setIsMini(true); // fallback: in-page mini
    } else {
      setIsMini(true);
    }
  }

  function handleRestart() {
    // 現在のセッションを履歴に追加してからリセット
    if (totalMinutes > 0) {
      const now = new Date();
      const dateStr = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}  ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      onAddHistory({
        id: String(Date.now()),
        date: dateStr,
        totalMinutes,
        sessionMinutes: Math.round(elapsedSeconds / 60),
        stage,
        isCompleted: stage === 9,
      });
    }
    resetAll();
    resetFrames();
    screenCapture.reset();
    screenPromptShownRef.current = false;
    setShowRestartConfirm(false);
  }

  // ミニモード中はMiniPlayerだけ表示
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

  return (
    <div className="absolute inset-0">

      {/* ── 背景動画：全画面 ── */}
      <div className="absolute inset-0 z-0">
        <WorldPlayer ref={worldRef} stage={stage} isActive={effectiveIsActive && isRunning} />
      </div>

      {/* ══════════════════════════════════
          左上：フェーズ情報 + プログレスバー + 累積タイマー
      ══════════════════════════════════ */}
      <div className="absolute top-24 left-10 z-10 flex flex-col gap-4 w-72">
        <div className="flex justify-between text-sm tracking-widest font-semibold text-[#f5e6d3]/90 uppercase">
          {/* 変更点：全フェーズ共通で「MEDIEVAL TOWN」と表示 */}
          <span style={{ fontFamily: "'Cinzel', serif" }}>MEDIEVAL TOWN</span>
          <span className="text-[#d4af37]" style={{ fontFamily: "'Cinzel', serif" }}>PHASE {currentPhaseIndex + 1}</span>
        </div>

        <div className="h-3 w-full bg-[#2a2d33] flex items-center p-0.5">
          <div
            className="h-full bg-[#f5e6d3] transition-all duration-1000"
            style={{ width: `${phaseProgress}%` }}
          />
        </div>

        <div
          className="text-6xl font-light tracking-wider text-[#f5e6d3] flex items-end gap-4"
          style={{ textShadow: '0 4px 20px rgba(0,0,0,0.8)', fontFamily: "'Cinzel', serif" }}
        >
          {formatTime(totalAccumulatedTime, true)}
        </div>

        {/* Sub Screen ボタン */}
        <button
          onClick={handleSubScreen}
          title={isPipOpen ? 'Close sub screen' : 'Open as floating sub screen'}
          style={{
            marginTop: 4,
            alignSelf: 'flex-start',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: isPipOpen ? 'rgba(212,175,55,0.15)' : 'rgba(0,0,0,0.35)',
            border: isPipOpen
              ? '1px solid rgba(212,175,55,0.5)'
              : '1px solid rgba(255,255,255,0.12)',
            color: isPipOpen ? '#d4af37' : 'rgba(245,230,211,0.5)',
            fontFamily: "'Cinzel', serif",
            fontSize: 11,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            padding: '7px 16px',
            borderRadius: 9999,
            cursor: 'pointer',
            backdropFilter: 'blur(4px)',
            transition: 'all 0.2s',
          }}
        >
          <span style={{ fontSize: 14, lineHeight: 1 }}>⊡</span>
          {isPipOpen ? 'Close Sub Screen' : (isMini ? 'Restore' : 'Sub Screen')}
        </button>
      </div>

      {/* ══════════════════════════════════
          左下：START / END SESSION ボタン
      ══════════════════════════════════ */}
      <div className="absolute bottom-12 left-10 z-10 flex flex-col gap-4 w-72">
        <Button
          onClick={isRunning ? pause : start}
          className={`!py-4 text-xl tracking-[0.3em] ${isRunning ? 'border-red-500/50 text-red-200 hover:bg-red-500/10' : ''}`}
        >
          {isRunning ? 'PAUSE' : 'START'}
        </Button>
        <Button
          onClick={() => setShowEndSession(true)}
          className="!py-3 text-sm tracking-widest text-[#f5e6d3]/70 border-[#f5e6d3]/20"
        >
          END SESSION
        </Button>

        {/* Restart: 確認前 */}
        {!showRestartConfirm && (
          <button
            onClick={() => setShowRestartConfirm(true)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(245,230,211,0.25)',
              fontFamily: "'Cinzel', serif",
              fontSize: '11px',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              padding: '4px 0',
              textAlign: 'left',
            }}
          >
            Restart World
          </button>
        )}

        {/* Restart: 確認中 */}
        {showRestartConfirm && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p style={{
              fontFamily: "'Cinzel', serif",
              fontSize: '11px',
              color: 'rgba(245,230,211,0.5)',
              letterSpacing: '0.1em',
              textAlign: 'center',
            }}>
              Reset everything from scratch?
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setShowRestartConfirm(false)}
                style={{
                  flex: 1, padding: '8px',
                  borderRadius: '9999px',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: 'rgba(245,230,211,0.5)',
                  fontFamily: "'Cinzel', serif",
                  fontSize: '10px',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleRestart}
                style={{
                  flex: 1, padding: '8px',
                  borderRadius: '9999px',
                  background: 'rgba(200,50,50,0.25)',
                  border: '1px solid rgba(200,50,50,0.5)',
                  color: '#f5e6d3',
                  fontFamily: "'Cinzel', serif",
                  fontSize: '10px',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                Restart
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════
          右上：ポモドーロパネル (ピュアCSS管理)
      ══════════════════════════════════ */}
      <div className="pomodoro-panel-custom">

        {/* ACTIVE / REST トグル */}
        <div className="pomodoro-toggle-wrapper">
          <button
            onClick={() => { setSessionType('ACTIVE'); resetSessionTimer(25); }}
            className={sessionType === 'ACTIVE' ? 'pomodoro-btn-active' : 'pomodoro-btn-inactive'}
          >
            ACTIVE
          </button>
          <button
            onClick={() => { setSessionType('REST'); resetSessionTimer(5); }}
            className={sessionType === 'REST' ? 'pomodoro-btn-active' : 'pomodoro-btn-inactive'}
          >
            REST
          </button>
        </div>

        {/* セッションタイマー */}
        <div className="pomodoro-time-display">
          {formatTime(sessionTimeLeft)}
        </div>

        {/* START / PAUSE */}
        <button
          onClick={() => setIsSessionActive(a => !a)}
          className="pomodoro-start-btn"
        >
          {isSessionActive ? 'PAUSE' : 'START'}
        </button>

        {/* プリセット */}
        {!isSessionActive && (
          <div className="pomodoro-presets-wrapper">
            {(sessionType === 'ACTIVE' ? ACTIVE_PRESETS : REST_PRESETS).map(mins => (
              <button
                key={mins}
                onClick={() => resetSessionTimer(mins)}
                className="pomodoro-preset-btn"
              >
                {mins}
              </button>
            ))}
          </div>
        )}
      </div>


      {/* サインイン / サインアウト */}
      <div className="absolute bottom-8 right-10 z-10">
        {isLoggedIn ? (
          <button
            onClick={signOut}
            style={{
              background: 'transparent',
              border: '1px solid rgba(245,230,211,0.15)',
              color: 'rgba(245,230,211,0.4)',
              fontFamily: "'Cinzel', serif",
              fontSize: '11px',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              padding: '8px 20px',
              borderRadius: '9999px',
              cursor: 'pointer',
            }}
          >
            Sign Out
          </button>
        ) : (
          <button
            onClick={() => setShowAuth(true)}
            style={{
              background: 'rgba(212,175,55,0.12)',
              border: '1px solid rgba(212,175,55,0.45)',
              color: '#f5e6d3',
              fontFamily: "'Cinzel', serif",
              fontSize: '12px',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              padding: '12px 28px',
              borderRadius: '9999px',
              cursor: 'pointer',
            }}
          >
            Sign In to Save Progress
          </button>
        )}
      </div>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

      {/* スクリーンキャプチャ：プロンプト */}
      {showScreenPrompt && (
        <ScreenCapturePrompt
          onEnable={async () => {
            setShowScreenPrompt(false);
            await screenCapture.start();
          }}
          onSkip={() => setShowScreenPrompt(false)}
        />
      )}

      {/* スクリーンキャプチャ：録画中バッジ */}
      {screenCapture.isCapturing && (
        <div
          onClick={screenCapture.stop}
          title="Click to stop screen recording"
          style={{
            position:      'absolute',
            bottom:        180,
            left:          40,
            display:       'flex',
            alignItems:    'center',
            gap:           8,
            padding:       '7px 14px',
            borderRadius:  9999,
            background:    'rgba(180,30,30,0.18)',
            border:        '1px solid rgba(200,50,50,0.45)',
            color:         'rgba(255,160,160,0.85)',
            fontFamily:    "'Cinzel', serif",
            fontSize:      10,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            cursor:        'pointer',
            zIndex:        40,
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#e05555', display: 'inline-block', animation: 'pulse 1.4s infinite' }} />
          REC {screenCapture.frameCount}f · Stop
        </div>
      )}

      {showEndSession && (
        <EndSessionModal
          currentStage={stage}
          totalMinutes={totalMinutes}
          sessionSeconds={elapsedSeconds}
          sessionId={getSessionId()}
          frameCount={getFrameCount() + screenCapture.frameCount}
          getLocalFrames={getFramesForTimelapse}
          accessToken={accessToken}
          onConfirm={() => { reset(); resetFrames(); screenCapture.reset(); }}
          onClose={() => setShowEndSession(false)}
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
    </div>
  );
}