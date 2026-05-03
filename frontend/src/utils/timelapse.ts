import { getVideoConfig } from './stageCalculator';

const CANVAS_SIZE       = 1080;
const STAGE_DURATION_MS = 1400; // フォールバック時（動画）の1ステージあたり表示時間
const TEXT_DURATION_MS  = 2000;
const OUTRO_DURATION_MS = 1000;

// ─── フォールバック用：動画ロード ───────────────────────────────────────────

function getStageSrc(stage: number): string {
  const config = getVideoConfig(stage);
  return config.loopSrc ?? (getVideoConfig(8).loopSrc as string);
}

function loadVideoForPlayback(src: string): Promise<HTMLVideoElement | null> {
  return new Promise(resolve => {
    const video       = document.createElement('video');
    video.muted       = true;
    video.playsInline = true;
    video.loop        = true;
    video.preload     = 'auto';
    video.src         = src;
    video.addEventListener('error',   () => resolve(null), { once: true });
    video.addEventListener('canplay', () => resolve(video), { once: true });
    video.load();
  });
}

// ─── テキスト・アウトロ描画 ────────────────────────────────────────────────

function drawText(
  ctx: CanvasRenderingContext2D,
  lastFrame: CanvasImageSource | null,
  totalMinutes: number,
  sessionSeconds: number,
) {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  if (lastFrame) ctx.drawImage(lastFrame, 0, 0, CANVAS_SIZE, CANVAS_SIZE);

  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, CANVAS_SIZE * 0.6, CANVAS_SIZE, CANVAS_SIZE * 0.4);

  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  const sH = Math.floor(sessionSeconds / 3600);
  const sM = Math.floor((sessionSeconds % 3600) / 60);
  const tH = Math.floor(totalMinutes / 60);
  const tM = Math.floor(totalMinutes % 60);

  ctx.textAlign = 'center';

  ctx.font      = 'bold 44px Cinzel, serif';
  ctx.fillStyle = '#F5E6C8';
  ctx.fillText(date, CANVAS_SIZE / 2, CANVAS_SIZE * 0.72);

  ctx.font      = '34px Cinzel, serif';
  ctx.fillStyle = '#C9A84C';
  ctx.fillText(`Today  ${sH}h ${sM}m`, CANVAS_SIZE / 2, CANVAS_SIZE * 0.80);

  ctx.font      = '30px Cinzel, serif';
  ctx.fillStyle = '#F5E6C8';
  ctx.fillText(`Total  ${tH}h ${tM}m  /  20h`, CANVAS_SIZE / 2, CANVAS_SIZE * 0.87);
}

function drawOutro(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#C9A84C';
  ctx.font      = 'bold 80px Cinzel, serif';
  ctx.fillText('Lorestead', CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 20);

  ctx.fillStyle = 'rgba(245,230,200,0.5)';
  ctx.font      = '34px Cinzel, serif';
  ctx.fillText('#lorestead', CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 60);
}

// ─── メイン生成関数 ────────────────────────────────────────────────────────

/**
 * タイムラプス動画を生成する。
 * - capturedFrames.length > 0 → キャプチャ済みフレーム（JPEG Blob）を使用
 * - capturedFrames.length === 0 → ステージ動画からフォールバック生成
 */
export async function generateTimelapse(
  currentStage: number,
  totalMinutes: number,
  sessionSeconds: number,
  capturedFrames: Blob[],
  onProgress: (ratio: number) => void,
): Promise<Blob> {

  onProgress(0.02);

  const useCaptures = capturedFrames.length > 0;

  // ── キャプチャフレームをImageBitmapに変換（メインパス） ──
  let bitmaps: ImageBitmap[] = [];
  let videos: (HTMLVideoElement | null)[] = [];

  if (useCaptures) {
    bitmaps = await Promise.all(capturedFrames.map(b => createImageBitmap(b)));
  } else {
    // フォールバック：ステージ動画をロード
    const stageCount = Math.max(1, Math.min(currentStage, 9));
    videos = await Promise.all(
      Array.from({ length: stageCount }, (_, i) =>
        loadVideoForPlayback(getStageSrc(i + 1))
      )
    );
  }

  onProgress(0.15);

  const itemCount = useCaptures ? bitmaps.length : videos.length;

  // 常に合計12秒に収まるよう計算（最低16ms = rAF 1フレーム、最大1400ms）
  const frameDurationMs = useCaptures
    ? Math.max(16, Math.min(1400, 12_000 / itemCount))
    : STAGE_DURATION_MS;

  const canvas  = document.createElement('canvas');
  canvas.width  = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  const ctx     = canvas.getContext('2d')!;

  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : 'video/webm';

  const stream   = canvas.captureStream(30);
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 6_000_000 });
  const chunks: Blob[] = [];
  recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

  return new Promise((resolve, reject) => {
    recorder.onstop  = () => resolve(new Blob(chunks, { type: mimeType }));
    recorder.onerror = reject;
    recorder.start();

    type Phase = 'stages' | 'text' | 'outro';
    let phase: Phase = 'stages';
    let phaseStart   = performance.now();
    let currentIdx   = -1;

    function tick() {
      const now     = performance.now();
      const elapsed = now - phaseStart;

      if (phase === 'stages') {
        const idx = Math.min(Math.floor(elapsed / frameDurationMs), itemCount - 1);

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        if (useCaptures) {
          // ── キャプチャフレームを描画 ──
          if (bitmaps[idx]) ctx.drawImage(bitmaps[idx], 0, 0, CANVAS_SIZE, CANVAS_SIZE);
        } else {
          // ── 動画フォールバック ──
          if (idx !== currentIdx) {
            if (currentIdx >= 0) videos[currentIdx]?.pause();
            currentIdx = idx;
            const vid = videos[idx];
            if (vid) { vid.currentTime = 0; vid.play().catch(() => {}); }
          }
          const vid = videos[idx];
          if (vid && vid.readyState >= 2) ctx.drawImage(vid, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
        }

        onProgress(0.15 + 0.65 * (idx / itemCount));

        if (elapsed >= frameDurationMs * itemCount) {
          if (!useCaptures) videos.forEach(v => v?.pause());
          phase      = 'text';
          phaseStart = now;
        }

      } else if (phase === 'text') {
        const lastFrame = useCaptures
          ? (bitmaps[bitmaps.length - 1] ?? null)
          : (videos[videos.length - 1] ?? null);
        drawText(ctx, lastFrame, totalMinutes, sessionSeconds);
        onProgress(0.85);

        if (elapsed >= TEXT_DURATION_MS) {
          phase      = 'outro';
          phaseStart = now;
        }
      } else {
        drawOutro(ctx);
        onProgress(0.95);

        if (elapsed >= OUTRO_DURATION_MS) {
          bitmaps.forEach(b => b.close());
          recorder.stop();
          onProgress(1.0);
          return;
        }
      }

      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
