import { useState, useEffect, useRef } from 'react';

const INACTIVITY_GRACE_MS = 8000; // 8秒の猶予

export function useVisibility() {
  const [isActive, setIsActive] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        timerRef.current = setTimeout(() => {
          setIsActive(false);
        }, INACTIVITY_GRACE_MS);
      } else {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        setIsActive(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { isActive };
}
