import { useState, useEffect, useRef, useCallback } from 'react';

export type ActivityType = 'study' | 'work' | 'creative' | 'other';

const STORAGE_KEY = 'lorestead_total_minutes';

function loadSavedMinutes(): number {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v ? parseFloat(v) : 0;
  } catch {
    return 0;
  }
}

function saveMinutes(minutes: number) {
  try {
    localStorage.setItem(STORAGE_KEY, String(minutes));
  } catch {}
}

export function useTimer() {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  // totalMinutes = saved baseline + current session elapsed
  const [totalMinutes, setTotalMinutes] = useState<number>(() => loadSavedMinutes());
  const [activityType, setActivityType] = useState<ActivityType>('study');

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const runStartTimeRef = useRef<number>(0);      // Date.now() when current run began
  const runStartElapsedRef = useRef<number>(0);   // elapsedSeconds when current run began
  const baselineMinutesRef = useRef<number>(totalMinutes); // saved total when session started

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      const nowDelta = Math.floor((Date.now() - runStartTimeRef.current) / 1000);
      const newElapsed = runStartElapsedRef.current + nowDelta;
      setElapsedSeconds(newElapsed);

      const newTotal = baselineMinutesRef.current + newElapsed / 60;
      setTotalMinutes(newTotal);
      saveMinutes(newTotal);
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const start = useCallback(() => {
    runStartTimeRef.current = Date.now();
    runStartElapsedRef.current = elapsedSeconds;
    baselineMinutesRef.current = loadSavedMinutes();
    setIsRunning(true);
  }, [elapsedSeconds]);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setElapsedSeconds(0);
    runStartElapsedRef.current = 0;
  }, []);

  const resetAll = useCallback(() => {
    setIsRunning(false);
    setElapsedSeconds(0);
    runStartElapsedRef.current = 0;
    setTotalMinutes(0);
    saveMinutes(0);
    baselineMinutesRef.current = 0;
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
  };
}
