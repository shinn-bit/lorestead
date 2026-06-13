import { useState, useEffect, useRef, useCallback } from 'react';

export type ActivityType = 'study' | 'work' | 'creative' | 'other';

// 進捗の継承はしない方針：localStorage には保存せず、毎セッション 0 から計測する。
// totalMinutes は「現在セッションの経過分」と一致する（= elapsedSeconds / 60）。

export function useTimer() {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [totalMinutes, setTotalMinutes] = useState<number>(0);
  const [activityType, setActivityType] = useState<ActivityType>('study');

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const runStartTimeRef = useRef<number>(0);      // Date.now() when current run began
  const runStartElapsedRef = useRef<number>(0);   // elapsedSeconds when current run began

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      const nowDelta = Math.floor((Date.now() - runStartTimeRef.current) / 1000);
      const newElapsed = runStartElapsedRef.current + nowDelta;
      setElapsedSeconds(newElapsed);
      setTotalMinutes(newElapsed / 60);
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const start = useCallback(() => {
    runStartTimeRef.current = Date.now();
    runStartElapsedRef.current = elapsedSeconds;
    setIsRunning(true);
  }, [elapsedSeconds]);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setElapsedSeconds(0);
    setTotalMinutes(0);
    runStartElapsedRef.current = 0;
  }, []);

  const resetAll = useCallback(() => {
    setIsRunning(false);
    setElapsedSeconds(0);
    runStartElapsedRef.current = 0;
    setTotalMinutes(0);
  }, []);

  // Debug: jump to arbitrary total minutes
  const debugSetMinutes = useCallback((minutes: number) => {
    setIsRunning(false);
    setElapsedSeconds(Math.round(minutes * 60));
    runStartElapsedRef.current = Math.round(minutes * 60);
    setTotalMinutes(minutes);
  }, []);

  return {
    isRunning,
    elapsedSeconds,
    totalMinutes,
    activityType,
    setActivityType,
    start,
    pause,
    reset,
    resetAll,
    debugSetMinutes,
  };
}
