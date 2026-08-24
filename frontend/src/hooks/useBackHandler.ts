import { useEffect, useRef } from 'react';
import { registerBackHandler, type BackHandler } from '../utils/backButton';

/**
 * Android のバックキーをこの画面で処理する。
 * handler が true を返した場合だけ「処理済み」として扱われ、下位のハンドラは呼ばれない。
 * handler は毎レンダーで作り直されても登録し直さない（ref経由で最新を読む）。
 */
export function useBackHandler(handler: BackHandler, enabled = true) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!enabled) return;
    return registerBackHandler(() => handlerRef.current());
  }, [enabled]);
}
