import { useCallback, useEffect, useRef, useState } from 'react';

interface Position { x: number; y: number }

export function useDraggable(initial: Position) {
  const [pos, setPos] = useState<Position>(initial);
  const dragging = useRef(false);
  const startMouse = useRef<Position>({ x: 0, y: 0 });
  const startPos = useRef<Position>(initial);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    // ボタンや入力要素はドラッグしない
    if ((e.target as HTMLElement).closest('button,input')) return;
    dragging.current = true;
    startMouse.current = { x: e.clientX, y: e.clientY };
    startPos.current = pos;
    e.preventDefault();
  }, [pos]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button,input')) return;
    dragging.current = true;
    const t = e.touches[0];
    startMouse.current = { x: t.clientX, y: t.clientY };
    startPos.current = pos;
  }, [pos]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - startMouse.current.x;
      const dy = e.clientY - startMouse.current.y;
      setPos({ x: startPos.current.x + dx, y: startPos.current.y + dy });
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!dragging.current) return;
      const t = e.touches[0];
      const dx = t.clientX - startMouse.current.x;
      const dy = t.clientY - startMouse.current.y;
      setPos({ x: startPos.current.x + dx, y: startPos.current.y + dy });
    };
    const onUp = () => { dragging.current = false; };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onUp);
    };
  }, []);

  return { pos, onMouseDown, onTouchStart };
}
