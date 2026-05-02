import { useRef, useEffect, useCallback } from 'react';
import type { WorldPlayerHandle } from '../components/World/WorldPlayer';
import { timelapseApi } from '../api/client';
import { saveFrame, getSessionFrames, deleteSessionFrames } from '../utils/frameStore';

const CAPTURE_INTERVAL_MS = 60_000;

interface Options {
  worldRef: React.RefObject<WorldPlayerHandle | null>;
  isActive: boolean;
  isRunning: boolean;
  stage: number;
  accessToken: string | null;
}

export function useFrameCapture({ worldRef, isActive, isRunning, stage, accessToken }: Options) {
  const sessionIdRef  = useRef(`${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  const frameCountRef = useRef(0);
  const conditionRef  = useRef({ isActive, isRunning, stage, accessToken });

  useEffect(() => {
    conditionRef.current = { isActive, isRunning, stage, accessToken };
  }, [isActive, isRunning, stage, accessToken]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const { isActive, isRunning, stage, accessToken } = conditionRef.current;
      if (!isActive || !isRunning) return;

      const blob = await worldRef.current?.captureFrame();
      if (!blob) return;

      const index = frameCountRef.current;
      frameCountRef.current += 1;

      // 常にローカル（IndexedDB）に保存
      saveFrame({
        sessionId:  sessionIdRef.current,
        frameIndex: index,
        timestamp:  Date.now(),
        stage,
        blob,
        source: 'world',
      }).catch(e => console.warn('[FrameCapture] local save failed', e));

      // ログイン中ならS3にも並行アップロード
      if (accessToken) {
        try {
          const { uploadUrl } = await timelapseApi.getUploadUrl(
            accessToken,
            sessionIdRef.current,
            index,
          );
          await timelapseApi.uploadFrame(uploadUrl, blob);
        } catch (e) {
          console.warn('[FrameCapture] S3 upload failed', e);
        }
      }
    }, CAPTURE_INTERVAL_MS);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getSessionId   = useCallback(() => sessionIdRef.current, []);
  const getFrameCount  = useCallback(() => frameCountRef.current, []);
  const getLocalFrames = useCallback(
    () => getSessionFrames(sessionIdRef.current),
    [],
  );

  const reset = useCallback(() => {
    deleteSessionFrames(sessionIdRef.current).catch(() => {});
    sessionIdRef.current  = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    frameCountRef.current = 0;
  }, []);

  return { getSessionId, getFrameCount, getLocalFrames, reset };
}
