import { useState, useEffect, useRef } from 'react';
import { generateTimelapse, downloadBlob } from '../../utils/timelapse';
import { saveTimelapse } from '../../utils/timelapseStore';
import type { GrowthMode } from '../../utils/stageCalculator';
import { useI18n } from '../../i18n/I18nContext';

type Phase = 'confirm' | 'generating' | 'done';

interface Props {
  mode: GrowthMode;
  currentStage: number;
  totalMinutes: number;
  sessionSeconds: number;
  isCompleted: boolean;
  sessionId: string;
  frameCount: number;
  /** IndexedDBからローカルフレームを取得する関数 */
  getLocalFrames: () => Promise<Blob[]>;
  onClose: () => void;
  onConfirm: () => void;
}

export function EndSessionModal({
  mode, currentStage, totalMinutes, sessionSeconds, isCompleted,
  sessionId, frameCount, getLocalFrames,
  onClose, onConfirm,
}: Props) {
  const { t } = useI18n();
  const [phase, setPhase]       = useState<Phase>('confirm');
  const [progress, setProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [blob, setBlob]         = useState<Blob | null>(null);
  const [error, setError]       = useState('');
  const videoRef                = useRef<HTMLVideoElement>(null);

  // 生成した動画をローカル履歴(IndexedDB)に保存
  async function persistToHistory(videoBlob: Blob | null) {
    if (!videoBlob) return;
    try {
      await saveTimelapse({
        id: sessionId || `tl_${Date.now()}`,
        createdAt: Date.now(),
        mode,
        stage: currentStage,
        durationMinutes: Math.round(sessionSeconds / 60),
        isCompleted,
        blob: videoBlob,
      });
    } catch (e) {
      console.error('Failed to save timelapse to history', e);
    }
  }

  useEffect(() => {
    return () => { if (videoUrl && blob) URL.revokeObjectURL(videoUrl); };
  }, [videoUrl, blob]);

  async function handleGenerate() {
    setPhase('generating');
    setProgress(0);
    setError('');

    try {
      // ブラウザ側生成（ローカルキャプチャフレーム → なければ動画フォールバック）
      const localFrames = await getLocalFrames();
      const result = await generateTimelapse(
        currentStage,
        totalMinutes,
        sessionSeconds,
        localFrames,
        (ratio) => setProgress(Math.round(ratio * 100)),
      );
      const url = URL.createObjectURL(result);
      setBlob(result);
      setVideoUrl(url);
      await persistToHistory(result);

      setPhase('done');
      onConfirm();
    } catch (e) {
      console.error(e);
      setError(t('gen_failed'));
      setPhase('confirm');
    }
  }

  function handleJustEnd() {
    onConfirm();
    onClose();
  }

  function handleDownload() {
    if (!blob) return;
    const date = new Date().toISOString().slice(0, 10);
    downloadBlob(blob, `lorestead_${date}.webm`);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div
        className="flex flex-col gap-6 rounded-[2rem] border border-[#d4af37]/40 shadow-2xl"
        style={{ background: 'rgba(30,30,30,0.95)', padding: '40px 48px', minWidth: 380, maxWidth: 480 }}
      >

        {/* ── Confirm ── */}
        {phase === 'confirm' && (
          <>
            <h2 className="text-center text-xl tracking-[0.15em] text-[#f5e6d3] uppercase">
              {t('end_session')}
            </h2>
            <p className="text-center text-sm text-[#f5e6d3]/60 tracking-widest leading-relaxed">
              {t('end_ready')}<br />
              {frameCount > 0
                ? `${frameCount} ${t('end_frames')}`
                : t('end_frames_none')}
            </p>

            <div className="flex flex-col gap-3 mt-2">
              <button
                onClick={handleGenerate}
                disabled={currentStage < 1}
                className="w-full py-4 rounded-full border border-[#d4af37]/70 text-[#f5e6d3] tracking-[0.2em] text-sm uppercase transition-all hover:bg-[#d4af37]/15 font-serif disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {t('end_generate')}
              </button>

              <button
                onClick={handleJustEnd}
                className="w-full py-3 rounded-full border border-white/15 text-[#f5e6d3]/50 tracking-widest text-xs uppercase transition-all hover:bg-white/5 font-serif"
              >
                {t('end_without')}
              </button>

              <button
                onClick={onClose}
                className="w-full py-2 text-[#f5e6d3]/30 tracking-widest text-xs uppercase transition-all hover:text-[#f5e6d3]/60 font-serif"
              >
                {t('cancel')}
              </button>
            </div>

            {error && (
              <p className="text-center text-xs text-red-400 tracking-widest">{error}</p>
            )}
          </>
        )}

        {/* ── Generating ── */}
        {phase === 'generating' && (
          <>
            <h2 className="text-center text-xl tracking-[0.15em] text-[#f5e6d3] uppercase">
              {t('generating')}
            </h2>
            <p className="text-center text-sm text-[#f5e6d3]/50 tracking-widest">
              {t('generating_sub')}
            </p>

            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#d4af37] rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-center text-xs text-[#d4af37] tracking-widest">{progress}%</p>
          </>
        )}

        {/* ── Done ── */}
        {phase === 'done' && (
          <>
            <h2 className="text-center text-xl tracking-[0.15em] text-[#f5e6d3] uppercase">
              {t('complete')}
            </h2>
            <p className="text-center text-sm text-[#f5e6d3]/60 tracking-widest">
              {t('timelapse_ready')}
            </p>

            {videoUrl && (
              <div className="w-full rounded-2xl overflow-hidden border border-[#d4af37]/20 bg-black">
                <video
                  ref={videoRef}
                  src={videoUrl}
                  autoPlay
                  loop
                  controls
                  className="w-full"
                  style={{ maxHeight: 240, objectFit: 'contain' }}
                />
              </div>
            )}

            <div className="flex flex-col gap-3 mt-2">
              <button
                onClick={handleDownload}
                className="w-full py-4 rounded-full border border-[#d4af37]/70 text-[#f5e6d3] tracking-[0.2em] text-sm uppercase transition-all hover:bg-[#d4af37]/15 font-serif"
              >
                {t('download')}
              </button>
              <button
                onClick={onClose}
                className="w-full py-2 text-[#f5e6d3]/30 tracking-widest text-xs uppercase transition-all hover:text-[#f5e6d3]/60 font-serif"
              >
                {t('close')}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
