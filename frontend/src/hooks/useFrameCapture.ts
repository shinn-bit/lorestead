import { useRef, useEffect, useCallback } from 'react';
import type { WorldPlayerHandle } from '../components/World/WorldPlayer';
import { timelapseApi } from '../api/client';

const CAPTURE_INTERVAL_MS = 60_000; // 1分ごと

interface Options {
  worldRef: React.RefObject<WorldPlayerHandle | null>;
  isActive: boolean;
  isRunning: boolean;
  /** ログイン中のアクセストークン。あればS3にアップロード */
  accessToken: string | null;
}

export function useFrameCapture({ worldRef, isActive, isRunning, accessToken }: Options) {
  // セッションIDはマウント時に固定
  const sessionIdRef    = useRef(`${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  const frameCountRef   = useRef(0);
  const conditionRef    = useRef({ isActive, isRunning, accessToken });

  useEffect(() => {
    conditionRef.current = { isActive, isRunning, accessToken };
  }, [isActive, isRunning, accessToken]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const { isActive, isRunning, accessToken } = conditionRef.current;
      if (!isActive || !isRunning) return;

      const blob = await worldRef.current?.captureFrame();
      if (!blob) return;

      const index = frameCountRef.current;
      frameCountRef.current += 1;

      // ログイン中なら S3 に直接アップロード
      if (accessToken) {
        try {
          const { uploadUrl } = await timelapseApi.getUploadUrl(
            accessToken,
            sessionIdRef.current,
            index,
          );
          await timelapseApi.uploadFrame(uploadUrl, blob);
          console.debug(`[FrameCapture] uploaded frame #${index} to S3`);
        } catch (e) {
          console.warn('[FrameCapture] upload failed', e);
          // アップロード失敗してもカウントは維持（generate時にスキップされる）
        }
      } else {
        console.debug(`[FrameCapture] captured frame #${index} (not logged in, skipped S3)`);
      }
    }, CAPTURE_INTERVAL_MS);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getSessionId  = useCallback(() => sessionIdRef.current, []);
  const getFrameCount = useCallback(() => frameCountRef.current, []);

  const reset = useCallback(() => {
    sessionIdRef.current  = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    frameCountRef.current = 0;
  }, []);

  return { getSessionId, getFrameCount, reset };
}
