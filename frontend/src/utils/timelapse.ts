const CANVAS_SIZE       = 1080;
const STAGE_DURATION_MS = 1400;
const TEXT_DURATION_MS  = 2000;
const OUTRO_DURATION_MS = 1000;

/** MP4動画の指定時刻のフレームをcanvasに描画できるvideo要素を返す */
function captureVideoFrame(src: string, seekTime = 1.0): Promise<HTMLVideoElement | null> {
  return new Promise(resolve => {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.src = src;

    video.addEventListener('error', () => resolve(null), { once: true });

    video.addEventListener('loadedmetadata', () => {
      video.currentTime = Math.min(seekTime, video.duration * 0.3);
    }, { once: true });

    video.addEventListener('seeked', () => resolve(video), { once: true });

    video.load();
  });
}

function drawText(
  ctx: CanvasRenderingContext2D,
  lastVideo: HTMLVideoElement | null,
  totalMinutes: number,
  sessionSeconds: number,
) {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  if (lastVideo) ctx.drawImage(lastVideo, 0, 0, CANVAS_SIZE, CANVAS_SIZE);

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

  ctx.font = 'bold 44px Cinzel, serif';
  ctx.fillStyle = '#F5E6C8';
  ctx.fillText(date, CANVAS_SIZE / 2, CANVAS_SIZE * 0.72);

  ctx.font = '34px Cinzel, serif';
  ctx.fillStyle = '#C9A84C';
  ctx.fillText(`Today  ${sH}h ${sM}m`, CANVAS_SIZE / 2, CANVAS_SIZE * 0.80);

  ctx.font = '30px Cinzel, serif';
  ctx.fillStyle = '#F5E6C8';
  ctx.fillText(`Total  ${tH}h ${tM}m  /  20h`, CANVAS_SIZE / 2, CANVAS_SIZE * 0.87);
}

function drawOutro(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#C9A84C';
  ctx.font = 'bold 80px Cinzel, serif';
  ctx.fillText('Lorestead', CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 20);

  ctx.fillStyle = 'rgba(245,230,200,0.5)';
  ctx.font = '34px Cinzel, serif';
  ctx.fillText('#lorestead', CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 60);
}

export async function generateTimelapse(
  currentStage: number,
  totalMinutes: number,
  sessionSeconds: number,
  capturedFrames: Blob[],
  onProgress: (ratio: number) => void,
): Promise<Blob> {

  onProgress(0.02);

  // キャプチャ済みフレームがあればそれを使う。なければMP4から取得
  let videos: (HTMLVideoElement | null)[];
  if (capturedFrames.length > 0) {
    videos = await Promise.all(
      capturedFrames.map(blob => captureVideoFrame(URL.createObjectURL(blob)))
    );
  } else {
    videos = await Promise.all(
      Array.from({ length: currentStage }, (_, i) =>
        captureVideoFrame(`/assets/worlds/prague/stage_0${i + 1}.mp4`)
      )
    );
  }
  const videoCount = videos.length;
  onProgress(0.15);

  const canvas = document.createElement('canvas');
  canvas.width  = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  const ctx = canvas.getContext('2d')!;

  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : 'video/webm';

  const stream   = canvas.captureStream(30);
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 6_000_000 });
  const chunks: Blob[] = [];
  recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

  return new Promise((resolve, reject) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
    recorder.onerror = reject;
    recorder.start();

    type Phase = 'stages' | 'text' | 'outro';
    let phase: Phase  = 'stages';
    let phaseStart    = performance.now();

    function tick() {
      const now     = performance.now();
      const elapsed = now - phaseStart;

      if (phase === 'stages') {
        const idx = Math.min(Math.floor(elapsed / STAGE_DURATION_MS), videoCount - 1);
        const vid = videos[idx];

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        if (vid) ctx.drawImage(vid, 0, 0, CANVAS_SIZE, CANVAS_SIZE);

        onProgress(0.15 + 0.65 * (idx / videoCount));

        if (elapsed >= STAGE_DURATION_MS * videoCount) {
          phase = 'text';
          phaseStart = now;
        }
      } else if (phase === 'text') {
        drawText(ctx, videos[videos.length - 1] ?? null, totalMinutes, sessionSeconds);
        onProgress(0.85);

        if (elapsed >= TEXT_DURATION_MS) {
          phase = 'outro';
          phaseStart = now;
        }
      } else {
        drawOutro(ctx);
        onProgress(0.95);

        if (elapsed >= OUTRO_DURATION_MS) {
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
