import { useState, useEffect } from 'react';
import { useI18n } from '../i18n/I18nContext';

/**
 * 起動スプラッシュ（炎のignite演出）。ページを開く（リロードする）たびに毎回再生される。
 * 約1.9秒（reduced-motion時0.5秒）でフェードアウトしアンマウントする。
 */
export function LaunchSplash() {
  const { t } = useI18n();
  const [show, setShow] = useState(true);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!show) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const dur = reduce ? 500 : 1900;
    const t1 = setTimeout(() => setDone(true), dur);
    const t2 = setTimeout(() => setShow(false), dur + 650);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [show]);

  if (!show) return null;
  return (
    <div className={`launch ${done ? 'done' : ''}`}>
      <div className="launch-core">
        <div className="launch-flame" />
        <h1 className="launch-word">LORESTEAD</h1>
        <p className="launch-tag">{t('tagline')}</p>
      </div>
    </div>
  );
}
