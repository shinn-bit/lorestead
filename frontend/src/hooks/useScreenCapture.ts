import { useState, useRef, useCallback, useEffect } from 'react';
import { saveFrame, getSessionFrames } from '../utils/frameStore';

const CAPTURE_INTERVAL_MS = 60_000;

export type ScreenCaptureResult = 'ok' | 'denied' | 'unsupported';

interface Options {
  sessionId: string;
  isRunning: boolean;
}

export function useScreenCapture({ sessionId, isRunning }: Options) {
  const [isCapturing, setIsCapturing]   = useState(false);
  const [frameCount,  setFrameCount]    = useState(0);
  const streamRef    = useRef<MediaStream | null>(null);
  const videoRef     = useRef<HTMLVideoElement | null>(null);
  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const frameIdxRef  = useRef(0);
  const sessionIdRef = useRef(sessionId);

  useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);

  // タイマーが止まったら映像をスロー（停止はしない）
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    // screen capture は再生速度制御不要。何もしない
  }, [isRunning]);

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;

    const canvas    = document.createElement('canvas');
    canvas.width    = video.videoWidth  || 1920;
    canvas.height   = video.videoHeight || 1080;
    canvas.getContext('2d')!.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(blob => {
      if (!blob) return;
      const index = frameIdxRef.current;
      frameIdxRef.current += 1;
      setFrameCount(index + 1);
      saveFrame({
        sessionId:  sessionIdRef.current,
        frameIndex: index,
        timestamp:  Date.now(),
        stage:      0,
        blob,
        source:     'screen',
      }).catch(e => console.warn('[ScreenCapture] save failed', e));
    }, 'image/jpeg', 0.82);
  }, []);

  const stop = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    videoRef.current  = null;
    setIsCapturing(false);
  }, []);

  const start = useCallback(async (): Promise<ScreenCaptureResult> => {
    if (!navigator.mediaDevices?.getDisplayMedia) return 'unsupported';

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 1 },
        audio: false,
      });

      const video      = document.createElement('video');
      video.srcObject  = stream;
      video.muted      = true;
      video.playsInline = true;
      await video.play();

      streamRef.current   = stream;
      videoRef.current    = video;
      frameIdxRef.current = 0;
      setFrameCount(0);
      setIsCapturing(true);

      // ユーザーがブラウザ側の「共有停止」を押したとき
      stream.getVideoTracks()[0].addEventListener('ended', stop, { once: true });

      // 開始直後に1枚撮影 → 以降1分ごと
      setTimeout(captureFrame, 1_500);
      intervalRef.current = setInterval(captureFrame, CAPTURE_INTERVAL_MS);

      return 'ok';
    } catch {
      return 'denied';
    }
  }, [captureFrame, stop]);

  const getFrames = useCallback(
    () => getSessionFrames(sessionIdRef.current, 'screen'),
    [],
  );

  const reset = useCallback(() => {
    stop();
    frameIdxRef.current = 0;
    setFrameCount(0);
  }, [stop]);

  return { isCapturing, frameCount, start, stop, getFrames, reset };
}
