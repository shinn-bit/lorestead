import { useState, useCallback, useEffect } from 'react';

export function usePictureInPicture(width = 280, height = 210) {
  const [pipWindow, setPipWindow] = useState<Window | null>(null);
  const isSupported = typeof window !== 'undefined' && 'documentPictureInPicture' in window;

  const open = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pip: Window = await (window as any).documentPictureInPicture.requestWindow({ width, height });

      // Load Cinzel font
      const fontLink = pip.document.createElement('link');
      fontLink.rel = 'stylesheet';
      fontLink.href = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@300;400;600&display=swap';
      pip.document.head.appendChild(fontLink);

      // Copy all stylesheets from the main document
      [...document.styleSheets].forEach(sheet => {
        try {
          const cssText = [...sheet.cssRules].map(r => r.cssText).join('');
          const style = pip.document.createElement('style');
          style.textContent = cssText;
          pip.document.head.appendChild(style);
        } catch {
          const href = (sheet as CSSStyleSheet).href;
          if (href) {
            const link = pip.document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            pip.document.head.appendChild(link);
          }
        }
      });

      pip.document.body.style.cssText =
        'margin:0;padding:0;background:#15171a;overflow:hidden;width:100%;height:100%;';

      pip.addEventListener('pagehide', () => setPipWindow(null));
      setPipWindow(pip);
      return true;
    } catch {
      return false;
    }
  }, [isSupported, width, height]);

  const close = useCallback(() => {
    pipWindow?.close();
    setPipWindow(null);
  }, [pipWindow]);

  // Close PiP on unmount
  useEffect(() => {
    return () => { pipWindow?.close(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pipWindow]);

  return { pipWindow, isSupported, open, close, isOpen: !!pipWindow };
}
