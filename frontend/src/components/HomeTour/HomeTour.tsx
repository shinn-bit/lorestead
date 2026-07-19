import { useState, useEffect, useLayoutEffect, type RefObject } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import type { I18nKey } from '../../i18n/dict';

const TOUR_SEEN_KEY = 'lorestead_home_tour_seen';

export function loadHomeTourSeen(): boolean {
  try { return localStorage.getItem(TOUR_SEEN_KEY) === '1'; } catch { return false; }
}

interface Geom { top: number; left: number; width: number; height: number; popTop: boolean; }

interface Step { ref: RefObject<HTMLElement | null>; key: I18nKey; preview?: boolean }

interface Props {
  open: boolean;
  onClose: () => void;
  subscreenRef: RefObject<HTMLElement | null>;
  hideBtnRef: RefObject<HTMLElement | null>;
  mobileHandleRef: RefObject<HTMLElement | null>;
  mobileMenuRef: RefObject<HTMLElement | null>;
}

/**
 * ホーム画面の使い方ツアー。
 * デスクトップ：サブ画面ボタン → 表示を隠すボタンの2ステップ。
 * モバイル（640px以下）：タスクハンドル → メニューの2ステップ（対象要素が異なるため別系統）。
 * 初回はホーム到達時に自動表示、以後は「使い方」ボタンから再表示できる。
 */
export function HomeTour({ open, onClose, subscreenRef, hideBtnRef, mobileHandleRef, mobileMenuRef }: Props) {
  const { t } = useI18n();
  const [idx, setIdx] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [geom, setGeom] = useState<Geom>({ top: 0, left: 0, width: 0, height: 0, popTop: false });

  const STEPS: Step[] = isMobile
    ? [
        { ref: mobileHandleRef, key: 'home_tour_m1' },
        { ref: mobileMenuRef, key: 'home_tour_m2' },
      ]
    : [
        { ref: subscreenRef, key: 'home_tour_1', preview: true },
        { ref: hideBtnRef, key: 'home_tour_2' },
      ];

  useEffect(() => {
    if (open) {
      setIdx(0);
      setIsMobile(window.matchMedia('(max-width: 640px)').matches);
    }
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;
    const measure = () => {
      const el = STEPS[idx].ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const pad = 10;
      const top = Math.max(0, r.top - pad);
      const left = Math.max(0, r.left - pad);
      const width = r.right + pad - left;
      const height = r.bottom + pad - top;
      setGeom({ top, left, width, height, popTop: r.top + r.height / 2 > window.innerHeight * 0.52 });
    };
    const id = requestAnimationFrame(measure);
    window.addEventListener('resize', measure);
    return () => { cancelAnimationFrame(id); window.removeEventListener('resize', measure); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, idx]);

  function close() {
    try { localStorage.setItem(TOUR_SEEN_KEY, '1'); } catch { /* ignore */ }
    onClose();
  }
  function next() {
    if (idx < STEPS.length - 1) setIdx((i) => i + 1);
    else close();
  }
  function prev() { setIdx((i) => Math.max(0, i - 1)); }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, idx]);

  if (!open) return null;

  const bottom = geom.top + geom.height;
  const right = geom.left + geom.width;

  return (
    <div className="tour">
      <div className="tour-mask" style={{ top: 0, left: 0, right: 0, height: geom.top }} />
      <div className="tour-mask" style={{ top: bottom, left: 0, right: 0, bottom: 0 }} />
      <div className="tour-mask" style={{ top: geom.top, left: 0, width: geom.left, height: geom.height }} />
      <div className="tour-mask" style={{ top: geom.top, left: right, right: 0, height: geom.height }} />
      <div className="tour-ring" style={{ top: geom.top, left: geom.left, width: geom.width, height: geom.height }} />

      {STEPS[idx].preview && (
        <div
          className="home-tour-preview"
          style={{ top: geom.popTop ? 'auto' : 24, bottom: geom.popTop ? 24 : 'auto' }}
        >
          <span className="htp-label">{t('home_tour_preview')}</span>
          <div className="htp-mock">
            <div className="htp-video" />
          </div>
        </div>
      )}

      <div className="tour-pop" style={{ top: geom.popTop ? 40 : 'auto', bottom: geom.popTop ? 'auto' : 40 }}>
        <span className="corner tl" /><span className="corner tr" />
        <span className="corner bl" /><span className="corner br" />
        <div className="tour-step">{idx + 1} / {STEPS.length}</div>
        <p className="tour-text" dangerouslySetInnerHTML={{ __html: t(STEPS[idx].key) }} />
        <div className="tour-actions">
          <button className="tour-btn" onClick={close}>{t('tour_skip')}</button>
          <span className="grow" />
          <button className="tour-btn" onClick={prev} style={{ visibility: idx === 0 ? 'hidden' : 'visible' }}>{t('tour_back')}</button>
          <button className="tour-btn tour-next" onClick={next}>{idx === STEPS.length - 1 ? t('tour_done') : t('tour_next')}</button>
        </div>
      </div>
    </div>
  );
}
