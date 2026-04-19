import { useState, useEffect, useRef } from 'react';
import { timelapseApi } from '../../api/client';
import { generateTimelapse, downloadBlob } from '../../utils/timelapse';

type Phase = 'confirm' | 'generating' | 'done';

interface Props {
  currentStage: number;
  totalMinutes: number;
  sessionSeconds: number;
  /** S3にアップロード済みのセッションID */
  sessionId: string;
  /** アップロード済みフレーム数 */
  frameCount: number;
  /** Cognitoアクセストークン（nullなら未ログイン） */
  accessToken: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function EndSessionModal({
  currentStage, totalMinutes, sessionSeconds,
  sessionId, frameCount, accessToken,
  onClose, onConfirm,
}: Props) {
  const [phase, setPhase]       = useState<Phase>('confirm');
  const [progress, setProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [blob, setBlob]         = useState<Blob | null>(null);
  const [error, setError]       = useState('');
  const videoRef                = useRef<HTMLVideoElement>(null);

  // サーバー生成の場合はURLをそのまま使う
  const isServerGeneration = !!accessToken && frameCount > 0;

  useEffect(() => {
    return () => { if (videoUrl && blob) URL.revokeObjectURL(videoUrl); };
  }, [videoUrl, blob]);

  async function handleGenerate() {
    setPhase('generating');
    setProgress(0);
    setError('');

    try {
      if (isServerGeneration) {
        // ─── サーバー側生成（S3フレーム → Lambda FFmpeg） ───
        setProgress(20);
        const { downloadUrl } = await timelapseApi.generate(
          accessToken,
          sessionId,
          frameCount,
          totalMinutes,
          sessionSeconds,
        );
        setProgress(100);
        setVideoUrl(downloadUrl);
        setBlob(null); // presigned URLなのでBlob不要
      } else {
        // ─── ブラウザ側フォールバック（MP4フレームキャプチャ） ───
        const result = await generateTimelapse(
          currentStage,
          totalMinutes,
          sessionSeconds,
          [],
          (ratio) => setProgress(Math.round(ratio * 100)),
        );
        const url = URL.createObjectURL(result);
        setBlob(result);
        setVideoUrl(url);
      }

      setPhase('done');
      onConfirm();
    } catch (e) {
      console.error(e);
      setError('Failed to generate video. Please try again.');
      setPhase('confirm');
    }
  }

  function handleJustEnd() {
    onConfirm();
    onClose();
  }

  function handleDownload() {
    if (!videoUrl) return;
    if (blob) {
      // ブラウザ生成Blob
      const date = new Date().toISOString().slice(0, 10);
      downloadBlob(blob, `lorestead_${date}.webm`);
    } else {
      // サーバー生成presigned URL → 直接リンク
      const a = document.createElement('a');
      a.href = videoUrl;
      a.download = `lorestead_${new Date().toISOString().slice(0, 10)}.mp4`;
      a.click();
    }
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
              End Session
            </h2>
            <p className="text-center text-sm text-[#f5e6d3]/60 tracking-widest leading-relaxed">
              Ready to wrap up?<br />
              {isServerGeneration
                ? `${frameCount} frames captured — generate your timelapse.`
                : accessToken
                  ? 'No frames captured yet (session too short).'
                  : 'Sign in to generate a timelapse from your session.'}
            </p>

            <div className="flex flex-col gap-3 mt-2">
              <button
                onClick={handleGenerate}
                disabled={!isServerGeneration && !currentStage}
                className="w-full py-4 rounded-full border border-[#d4af37]/70 text-[#f5e6d3] tracking-[0.2em] text-sm uppercase transition-all hover:bg-[#d4af37]/15 font-serif disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Generate Timelapse & End
              </button>

              <button
                onClick={handleJustEnd}
                className="w-full py-3 rounded-full border border-white/15 text-[#f5e6d3]/50 tracking-widest text-xs uppercase transition-all hover:bg-white/5 font-serif"
              >
                End Without Timelapse
              </button>

              <button
                onClick={onClose}
                className="w-full py-2 text-[#f5e6d3]/30 tracking-widest text-xs uppercase transition-all hover:text-[#f5e6d3]/60 font-serif"
              >
                Cancel
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
              Generating...
            </h2>
            <p className="text-center text-sm text-[#f5e6d3]/50 tracking-widest">
              {isServerGeneration ? 'Processing on server with FFmpeg' : 'Creating your timelapse'}
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
              Complete
            </h2>
            <p className="text-center text-sm text-[#f5e6d3]/60 tracking-widest">
              Your timelapse is ready.
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
                Download
              </button>
              <button
                onClick={onClose}
                className="w-full py-2 text-[#f5e6d3]/30 tracking-widest text-xs uppercase transition-all hover:text-[#f5e6d3]/60 font-serif"
              >
                Close
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
